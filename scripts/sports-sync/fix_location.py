#!/usr/bin/env python3
"""
使用 Nominatim 逆地理编码升级活动位置信息到城市级别。

用法：
  python fix_location.py          # 升级所有省份级别的位置
  python fix_location.py --force  # 强制重新查询所有位置

策略：
  - 先收集所有需要升级的活动，按坐标网格去重
  - 每个唯一网格只查询一次 Nominatim
  - 查询结果缓存到 location_cache.json，支持断点续传
  - Nominatim 限速：每次查询间隔1秒
"""
import json
import os
import sys
import time
import random
import string
import re

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from geopy.geocoders import options, Nominatim
from db import Activity, init_db, _save_location_cache, _location_cache, LOCATION_CACHE_FILE
from config import (
    SQL_FILE, JSON_FILE, MUNICIPALITIES,
    NOMINATIM_USER_AGENT, NOMINATIM_LANGUAGE, NOMINATIM_TIMEOUT,
    NOMINATIM_MAX_RETRIES, NOMINATIM_RETRY_DELAY,
    NOMINATIM_RATE_LIMIT_SECONDS, NOMINATIM_RANDOM_SUFFIX_LENGTH,
    LOCATION_CACHE_EXPAND_OFFSETS, LOCATION_CACHE_GRID_PRECISION,
)
from generator import Generator


def randomword():
    letters = string.ascii_lowercase
    return "".join(random.choice(letters) for i in range(NOMINATIM_RANDOM_SUFFIX_LENGTH))


options.default_user_agent = NOMINATIM_USER_AGENT
geocoder = Nominatim(user_agent=randomword())


def reverse_geocode(lat, lon, max_retries=NOMINATIM_MAX_RETRIES):
    """逆地理编码，带重试"""
    for attempt in range(max_retries):
        try:
            location = geocoder.reverse(f"{lat}, {lon}", language=NOMINATIM_LANGUAGE, timeout=NOMINATIM_TIMEOUT)
            if location:
                return str(location)
        except Exception as e:
            print(f"    [重试 {attempt+1}/{max_retries}] 查询失败: {e}")
            time.sleep(NOMINATIM_RETRY_DELAY)
    return None


def is_province_only(location_str):
    """判断位置是否只有省份级别（缺少城市/县信息）"""
    if not location_str:
        return True
    # 匹配城市级：市、自治州、特别行政区、盟、地区
    city_match = re.search(r'[\u4e00-\u9fa5]{2,}(市|自治州|特别行政区|盟|地区)', location_str)
    if city_match:
        return False
    # 匹配县级：自治县、县、区
    county_match = re.search(r'[\u4e00-\u9fa5]{2,}(自治县|县|区)', location_str)
    if county_match:
        return False
    municipalities = list(MUNICIPALITIES)
    for m in municipalities:
        if m in location_str:
            return False
    return True


def main():
    force = "--force" in sys.argv

    print("=" * 60)
    print("位置升级工具 - 使用 Nominatim 逆地理编码")
    print("=" * 60)
    print(f"数据库: {SQL_FILE}")
    print(f"缓存文件: {LOCATION_CACHE_FILE}")
    print(f"强制模式: {'是' if force else '否'}")
    print()

    # 加载数据库
    session = init_db(SQL_FILE)
    activities = session.query(Activity).all()
    print(f"数据库中共 {len(activities)} 条活动")

    # 筛选需要升级的活动
    need_fix = []
    for a in activities:
        if not a.location_country:
            continue
        if force or is_province_only(a.location_country):
            need_fix.append(a)

    print(f"需要升级: {len(need_fix)} 条活动")

    if not need_fix:
        print("无需升级，退出")
        return

    # 从 summary_polyline 提取坐标
    import polyline as polyline_codec

    # 收集所有需要查询的坐标网格（0.01度网格，约1km）
    grid_map = {}  # cache_key -> (lat, lon, [activity_ids])
    no_coords = []

    for a in need_fix:
        coords = None
        if a.summary_polyline:
            try:
                coords = polyline_codec.decode(a.summary_polyline)
                if coords:
                    coords = [(c[0], c[1]) for c in coords]
            except Exception:
                pass

        if coords and len(coords) > 0:
            lat, lon = coords[0]
            # 使用 0.01 度网格键（与缓存键一致）
            cache_lat = round(lat, LOCATION_CACHE_GRID_PRECISION)
            cache_lon = round(lon, LOCATION_CACHE_GRID_PRECISION)
            cache_key = f"{cache_lat},{cache_lon}"
            if cache_key not in grid_map:
                grid_map[cache_key] = (lat, lon, [])
            grid_map[cache_key][2].append(a.run_id)
        else:
            no_coords.append(a.run_id)

    print(f"唯一坐标网格: {len(grid_map)} 个")
    print(f"无坐标的活动: {len(no_coords)} 个（跳过）")
    print()

    if not grid_map:
        print("没有可查询的坐标，退出")
        return

    # 检查缓存中已有的城市级结果（强制模式下全部重新查询）
    cached_count = 0
    to_query = {}
    for cache_key, (lat, lon, run_ids) in grid_map.items():
        if force:
            to_query[cache_key] = (lat, lon, run_ids)
        else:
            cached_val = _location_cache.get(cache_key, "")
            if cached_val and not is_province_only(cached_val):
                cached_count += 1
            else:
                to_query[cache_key] = (lat, lon, run_ids)

    print(f"已有城市级缓存: {cached_count} 个网格")
    print(f"需要查询: {len(to_query)} 个网格")
    print()

    if not to_query:
        print("所有网格已有缓存，直接更新数据库")
    else:
        # 查询 Nominatim
        print(f"预计耗时: 约 {len(to_query)} 秒（每秒1次查询）")
        print()
        print("开始查询 Nominatim...")
        print("-" * 40)

        success = 0
        fail = 0
        for i, (cache_key, (lat, lon, run_ids)) in enumerate(to_query.items()):
            print(f"  [{i+1}/{len(to_query)}] 查询 ({lat:.2f}, {lon:.2f})...", end=" ", flush=True)
            result = reverse_geocode(lat, lon)
            if result:
                # 写入缓存（覆盖旧的省份级缓存）
                _location_cache[cache_key] = result
                # 也缓存到附近的网格点（扩大覆盖范围）
                cache_lat, cache_lon = round(lat, LOCATION_CACHE_GRID_PRECISION), round(lon, LOCATION_CACHE_GRID_PRECISION)
                for dlat in LOCATION_CACHE_EXPAND_OFFSETS:
                    for dlon in LOCATION_CACHE_EXPAND_OFFSETS:
                        if dlat == 0 and dlon == 0:
                            continue
                        k = f"{cache_lat + dlat:.2f},{cache_lon + dlon:.2f}"
                        old_val = _location_cache.get(k, "")
                        if is_province_only(old_val):
                            _location_cache[k] = result
                success += 1
                short = result.split(",")[0] if result else "?"
                print(f"-> {short}")
            else:
                fail += 1
                print("-> 失败")

            # 每10次查询保存一次缓存
            if (i + 1) % 10 == 0:
                _save_location_cache()

            # Nominatim 限速
            time.sleep(NOMINATIM_RATE_LIMIT_SECONDS)

        _save_location_cache()
        print()
        print(f"查询完成: 成功 {success}, 失败 {fail}")

    # 更新数据库
    print()
    print("-" * 40)
    print("更新数据库...")
    updated = 0
    for a in need_fix:
        if not a.summary_polyline:
            continue
        try:
            coords = polyline_codec.decode(a.summary_polyline)
            if not coords:
                continue
            lat, lon = coords[0]
            cache_lat = round(lat, LOCATION_CACHE_GRID_PRECISION)
            cache_lon = round(lon, LOCATION_CACHE_GRID_PRECISION)
            cache_key = f"{cache_lat},{cache_lon}"
            cached = _location_cache.get(cache_key, "")
            if cached and (force or not is_province_only(cached)):
                a.location_country = cached
                updated += 1
        except Exception:
            pass

    session.commit()
    _save_location_cache()
    print(f"已更新 {updated} 条活动的位置信息")

    # 重新生成 JSON
    print()
    print("-" * 40)
    print("重新生成 activities.json...")
    generator = Generator(SQL_FILE)
    activities_list = generator.load()
    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(activities_list, f, ensure_ascii=False)
    print(f"已保存 {len(activities_list)} 条活动到 {JSON_FILE}")

    # 统计
    city_count = sum(1 for a in activities_list if not is_province_only(a.get("location_country", "")))
    province_count = sum(1 for a in activities_list if is_province_only(a.get("location_country", "")) and a.get("location_country", ""))
    empty_count = sum(1 for a in activities_list if not a.get("location_country", ""))
    print()
    print(f"统计: 城市级 {city_count}, 省份级 {province_count}, 空 {empty_count}")

    print()
    print("=" * 60)
    print("升级完成！")
    print("=" * 60)


if __name__ == "__main__":
    main()
