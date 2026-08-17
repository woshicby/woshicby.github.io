#!/usr/bin/env python3
"""
一体化同步脚本：FIT → DB → JSON + Nominatim 逆地理编码 + 详情导出

用法：
  python sync_all.py              # 增量同步（仅处理新 FIT 文件 + 未获取地址的活动）
  python sync_all.py --force-geo  # 强制重新获取所有有轨迹活动的地址
  python sync_all.py --full       # 完整重建：重新导入所有 FIT + 强制获取地址

流程：
  1. 扫描 FIT/ 目录，将新文件导入 SQLite 数据库
  2. 对有轨迹的活动，通过 Nominatim 获取最详细的地址
  3. 从数据库导出 activities.json
  4. 从 FIT 文件提取详细数据到 activities_detail/
"""

import json
import os
import re
import sys
import time
import random
import string
import datetime
from datetime import timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import (
    FIT_FOLDER, JSON_FILE, SQL_FILE, IMPORTED_FILE, DETAIL_DIR,
    SEMICIRCLE, MUNICIPALITIES, DEFAULT_COUNTRY,
    NOMINATIM_USER_AGENT, NOMINATIM_LANGUAGE, NOMINATIM_TIMEOUT,
    NOMINATIM_MAX_RETRIES, NOMINATIM_RETRY_DELAY, NOMINATIM_RATE_LIMIT_SECONDS,
    LOCATION_CACHE_EXPAND_OFFSETS, LOCATION_CACHE_GRID_PRECISION,
    BASE_TIMEZONE, NOMINATIM_RANDOM_SUFFIX_LENGTH,
    SPORT_MAP, SUB_SPORT_MAP, SPORT_CN,
)
from db import (
    Activity,
    init_db,
    _save_location_cache,
    _location_cache,
    LOCATION_CACHE_FILE,
    _find_location_by_coords,
    _set_location_cache,
    _get_location_from_cache,
)
from generator import Generator
from synced_data_file_logger import save_synced_data_file_list, get_synced_data_file_list

import polyline as polyline_codec
from geopy.geocoders import options, Nominatim
from garmin_fit_sdk import Decoder, Stream
from garmin_fit_sdk.util import FIT_EPOCH_S
from sqlalchemy import create_engine

# ============ Nominatim 逆地理编码 ============

options.default_user_agent = NOMINATIM_USER_AGENT


def _get_geocoder():
    """创建 Nominatim 地理编码器，使用随机 user_agent 避免限流"""
    letters = string.ascii_lowercase
    agent = NOMINATIM_USER_AGENT + "_" + "".join(random.choice(letters) for _ in range(NOMINATIM_RANDOM_SUFFIX_LENGTH))
    return Nominatim(user_agent=agent, timeout=NOMINATIM_TIMEOUT)


def reverse_geocode(geocoder, lat, lon, max_retries=NOMINATIM_MAX_RETRIES):
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


def is_detailed_location(location_str):
    """判断位置是否已有详细地址（城市级别或更详细）

    返回 True 表示地址足够详细，不需要再查询。
    """
    if not location_str:
        return False
    # 匹配城市级：市、自治州、特别行政区、盟、地区
    city_match = re.search(r'[\u4e00-\u9fa5]{2,}(市|自治州|特别行政区|盟|地区)', location_str)
    if city_match:
        return True
    # 匹配县级：自治县、县、区
    county_match = re.search(r'[\u4e00-\u9fa5]{2,}(自治县|县|区)', location_str)
    if county_match:
        return True
    # 直辖市
    for m in MUNICIPALITIES:
        if m in location_str:
            return True
    return False


def get_start_coords_from_polyline(summary_polyline):
    """从 summary_polyline 提取起点坐标 (lat, lon)"""
    if not summary_polyline:
        return None
    try:
        coords = polyline_codec.decode(summary_polyline)
        if coords and len(coords) > 0:
            return (coords[0][0], coords[0][1])
    except Exception:
        pass
    return None


# ============ 步骤 1：导入 FIT 文件到数据库 ============

def _parse_fit_to_activity(file_path):
    """使用 garmin_fit_sdk 解析 FIT 文件，返回活动数据字典或 None"""
    if os.path.getsize(file_path) == 0:
        return None

    stream = Stream.from_file(file_path)
    decoder = Decoder(stream)
    messages, errors = decoder.read(convert_datetimes_to_dates=False)

    if not messages.get("session_mesgs"):
        return None

    session_msg = messages["session_mesgs"][0]

    # 计算 run_id
    start_ts = session_msg["start_time"] + FIT_EPOCH_S
    start_time_utc = datetime.datetime.fromtimestamp(start_ts, tz=timezone.utc)
    run_id = int(start_time_utc.timestamp() * 1000)

    # 运动类型
    sport_num = session_msg.get("sport", 0)
    sub_sport_num = session_msg.get("sub_sport", 0)
    sport_name = SPORT_MAP.get(sport_num, "generic") if isinstance(sport_num, int) else str(sport_num).lower()
    sub_sport_name = SUB_SPORT_MAP.get(sub_sport_num, "generic") if isinstance(sub_sport_num, int) else str(sub_sport_num).lower()

    # 确定最详细的运动类型：优先 sub_sport（非 generic 时），否则用 sport
    if sub_sport_name != "generic":
        detailed_sport = sub_sport_name
    else:
        detailed_sport = sport_name
    type_cn = SPORT_CN.get(detailed_sport, detailed_sport)

    # 距离、时间
    distance = float(session_msg.get("total_distance", 0))
    elapsed_time = float(session_msg.get("total_elapsed_time", 0))
    moving_time = float(session_msg.get("total_timer_time", elapsed_time))

    # 心率、速度
    avg_hr = session_msg.get("avg_heart_rate")
    avg_speed = float(session_msg.get("enhanced_avg_speed", session_msg.get("avg_speed", 0)))

    # 海拔增益
    elevation_gain = float(session_msg.get("total_ascent", 0))

    # 活动名称
    name = session_msg.get("sport", "")
    if isinstance(name, int):
        name = sport_name

    # 本地时间
    import zoneinfo
    start_date_local = start_time_utc.astimezone(
        zoneinfo.ZoneInfo(BASE_TIMEZONE)
    )

    # 提取轨迹点用于生成 polyline
    summary_polyline = ""
    start_latlng = None
    record_mesgs = messages.get("record_mesgs", [])
    if record_mesgs:
        coords = []
        for rec in record_mesgs:
            if "position_lat" in rec and "position_long" in rec:
                lat = rec["position_lat"] / SEMICIRCLE
                lon = rec["position_long"] / SEMICIRCLE
                # 过滤无效坐标：0,0 或超出合理范围
                if lat == 0.0 and lon == 0.0:
                    continue
                if abs(lat) > 90 or abs(lon) > 180:
                    continue
                coords.append((lat, lon))
        if coords:
            summary_polyline = polyline_codec.encode(coords)
            start_latlng = (coords[0][0], coords[0][1])

    return {
        "run_id": run_id,
        "name": name,
        "distance": distance,
        "moving_time": datetime.timedelta(seconds=moving_time),
        "elapsed_time": datetime.timedelta(seconds=elapsed_time),
        "type": type_cn,
        "subtype": detailed_sport,
        "start_date": start_time_utc.strftime("%Y-%m-%d %H:%M:%S"),
        "start_date_local": start_date_local.strftime("%Y-%m-%d %H:%M:%S"),
        "average_heartrate": float(avg_hr) if avg_hr else None,
        "average_speed": avg_speed,
        "elevation_gain": elevation_gain,
        "summary_polyline": summary_polyline,
        "start_latlng": start_latlng,
    }


def step_import_fit(session, force_all=False):
    """扫描 FIT 目录，将新文件导入数据库

    Args:
        session: SQLAlchemy session
        force_all: 是否强制重新导入所有文件

    Returns:
        (new_count, updated_count, error_count)
    """
    print()
    print("=" * 60)
    print("步骤 1/4: 导入 FIT 文件到数据库")
    print("=" * 60)

    if not os.path.isdir(FIT_FOLDER):
        print(f"[错误] FIT 文件目录不存在: {FIT_FOLDER}")
        sys.exit(1)

    fit_files = sorted([f for f in os.listdir(FIT_FOLDER) if f.endswith(".fit")])
    print(f"FIT 文件目录: {FIT_FOLDER}")
    print(f"发现 {len(fit_files)} 个 FIT 文件")

    # 获取已导入文件列表
    if force_all:
        synced_files = {}
    else:
        synced_files = get_synced_data_file_list()

    # 筛选新文件
    new_files = []
    for f in fit_files:
        if force_all or f not in synced_files:
            new_files.append(f)

    if not new_files:
        print("没有新的 FIT 文件需要导入")
        return 0, 0, 0

    print(f"需要导入: {len(new_files)} 个新文件")
    print()

    new_count = 0
    updated_count = 0
    error_count = 0
    synced_file_names = []

    for i, filename in enumerate(new_files):
        file_path = os.path.join(FIT_FOLDER, filename)
        try:
            act_data = _parse_fit_to_activity(file_path)

            if act_data is None:
                # 空文件或无 session，跳过但记录
                synced_file_names.append(filename)
                continue

            created = _update_or_create_activity(session, act_data)
            if created:
                new_count += 1
                sys.stdout.write("+")
            else:
                updated_count += 1
                sys.stdout.write(".")
            synced_file_names.append(filename)
            sys.stdout.flush()

        except Exception as e:
            error_count += 1
            session.rollback()
            print(f"\n[错误] 处理文件失败: {filename}")
            print(f"  异常: {e}")

        # 进度显示
        if (i + 1) % 50 == 0:
            print(f"\n  进度: {i + 1}/{len(new_files)}")

    session.commit()
    save_synced_data_file_list(synced_file_names)

    print(f"\n导入完成: 新增 {new_count}, 更新 {updated_count}, 失败 {error_count}")
    return new_count, updated_count, error_count


def _update_or_create_activity(session, act_data):
    """从解析后的活动数据字典创建或更新 Activity 数据库记录"""
    activity = session.query(Activity).filter_by(run_id=act_data["run_id"]).first()

    # 处理 location_country
    location_country = ""
    start_latlng = act_data.get("start_latlng")
    if start_latlng and (not activity or not activity.location_country):
        try:
            location_country = _find_location_by_coords(start_latlng[0], start_latlng[1])
        except Exception:
            pass

    if not activity:
        activity = Activity(
            run_id=act_data["run_id"],
            name=act_data["name"],
            distance=act_data["distance"],
            moving_time=act_data["moving_time"],
            elapsed_time=act_data["elapsed_time"],
            type=act_data["type"],
            subtype=act_data["subtype"],
            start_date=act_data["start_date"],
            start_date_local=act_data["start_date_local"],
            location_country=location_country,
            average_heartrate=act_data["average_heartrate"],
            average_speed=act_data["average_speed"],
            elevation_gain=act_data["elevation_gain"],
            summary_polyline=act_data["summary_polyline"],
        )
        session.add(activity)
        return True
    else:
        # 更新已有记录（保留已有的详细地址，除非为空或省份级）
        activity.name = act_data["name"]
        activity.distance = act_data["distance"]
        activity.moving_time = act_data["moving_time"]
        activity.elapsed_time = act_data["elapsed_time"]
        activity.type = act_data["type"]
        activity.subtype = act_data["subtype"]
        activity.average_heartrate = act_data["average_heartrate"]
        activity.average_speed = act_data["average_speed"]
        activity.elevation_gain = act_data["elevation_gain"]
        if act_data["summary_polyline"]:
            activity.summary_polyline = act_data["summary_polyline"]
        if location_country and (not activity.location_country or activity.location_country.startswith("中国 (")):
            activity.location_country = location_country
        return False


# ============ 步骤 2：Nominatim 逆地理编码 ============

def step_geocode(session, force_geo=False):
    """对有轨迹的活动通过 Nominatim 获取详细地址

    Args:
        session: SQLAlchemy session
        force_geo: 是否强制重新获取所有地址

    Returns:
        updated_count
    """
    print()
    print("=" * 60)
    print("步骤 2/4: Nominatim 逆地理编码")
    print("=" * 60)

    activities = session.query(Activity).all()
    print(f"数据库中共 {len(activities)} 条活动")

    # 筛选需要获取地址的活动
    need_geocode = []
    for a in activities:
        if not a.summary_polyline:
            continue  # 无轨迹，跳过
        if force_geo or not is_detailed_location(a.location_country):
            need_geocode.append(a)

    print(f"有轨迹的活动: {sum(1 for a in activities if a.summary_polyline)}")
    print(f"需要获取地址: {len(need_geocode)}")

    if not need_geocode:
        print("所有有轨迹活动已有详细地址，跳过")
        return 0

    # 按坐标网格去重
    grid_map = {}  # cache_key -> (lat, lon, [activity_ids])
    no_coords = []

    for a in need_geocode:
        coords = get_start_coords_from_polyline(a.summary_polyline)
        if coords:
            lat, lon = coords
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

    if not grid_map:
        print("没有可查询的坐标，跳过")
        return 0

    # 检查缓存
    cached_count = 0
    to_query = {}
    for cache_key, (lat, lon, run_ids) in grid_map.items():
        if force_geo:
            to_query[cache_key] = (lat, lon, run_ids)
        else:
            cached_val = _location_cache.get(cache_key, "")
            if cached_val and is_detailed_location(cached_val):
                cached_count += 1
            else:
                to_query[cache_key] = (lat, lon, run_ids)

    print(f"已有详细缓存: {cached_count} 个网格")
    print(f"需要查询 Nominatim: {len(to_query)} 个网格")

    # 查询 Nominatim
    if to_query:
        print(f"预计耗时: 约 {len(to_query)} 秒（每秒1次查询）")
        print()
        print("开始查询 Nominatim...")
        print("-" * 40)

        geocoder = _get_geocoder()
        success = 0
        fail = 0

        for i, (cache_key, (lat, lon, run_ids)) in enumerate(to_query.items()):
            print(f"  [{i+1}/{len(to_query)}] 查询 ({lat:.4f}, {lon:.4f})...", end=" ", flush=True)
            result = reverse_geocode(geocoder, lat, lon)
            if result:
                _location_cache[cache_key] = result
                # 扩大缓存覆盖范围
                cache_lat, cache_lon = round(lat, LOCATION_CACHE_GRID_PRECISION), round(lon, LOCATION_CACHE_GRID_PRECISION)
                for dlat in LOCATION_CACHE_EXPAND_OFFSETS:
                    for dlon in LOCATION_CACHE_EXPAND_OFFSETS:
                        if dlat == 0 and dlon == 0:
                            continue
                        k = f"{cache_lat + dlat:.2f},{cache_lon + dlon:.2f}"
                        old_val = _location_cache.get(k, "")
                        if not is_detailed_location(old_val):
                            _location_cache[k] = result
                success += 1
                short = result.split(",")[0] if result else "?"
                print(f"-> {short}")
            else:
                fail += 1
                print("-> 失败")

            # 每10次保存缓存
            if (i + 1) % 10 == 0:
                _save_location_cache()

            # Nominatim 限速
            time.sleep(NOMINATIM_RATE_LIMIT_SECONDS)

        _save_location_cache()
        print(f"\n查询完成: 成功 {success}, 失败 {fail}")

    # 更新数据库中的地址
    print()
    print("更新数据库地址...")
    updated = 0
    for a in need_geocode:
        coords = get_start_coords_from_polyline(a.summary_polyline)
        if not coords:
            continue
        lat, lon = coords
        cache_lat = round(lat, LOCATION_CACHE_GRID_PRECISION)
        cache_lon = round(lon, LOCATION_CACHE_GRID_PRECISION)
        cache_key = f"{cache_lat},{cache_lon}"
        cached = _location_cache.get(cache_key, "")
        if cached and (force_geo or is_detailed_location(cached)):
            a.location_country = cached
            updated += 1

    session.commit()
    _save_location_cache()
    print(f"已更新 {updated} 条活动的地址")

    return updated


# ============ 步骤 3：导出 activities.json ============

def step_export_json():
    """从数据库导出 activities.json"""
    print()
    print("=" * 60)
    print("步骤 3/4: 导出 activities.json")
    print("=" * 60)

    generator = Generator(SQL_FILE)
    activities_list = generator.load()

    # 确保输出目录存在
    os.makedirs(os.path.dirname(JSON_FILE), exist_ok=True)

    with open(JSON_FILE, "w", encoding="utf-8") as f:
        json.dump(activities_list, f, ensure_ascii=False)

    print(f"已导出 {len(activities_list)} 条活动到 {JSON_FILE}")

    # 统计地址详细程度
    detailed = sum(1 for a in activities_list if is_detailed_location(a.get("location_country", "")))
    province_only = sum(
        1 for a in activities_list
        if a.get("location_country") and not is_detailed_location(a.get("location_country", ""))
    )
    empty = sum(1 for a in activities_list if not a.get("location_country"))
    print(f"地址统计: 详细 {detailed}, 省份级 {province_only}, 空 {empty}")

    return len(activities_list)


# ============ 步骤 4：导出活动详情 ============

def step_export_details(session=None):
    """从 FIT 文件提取详细数据到 activities_detail/

    优化：先从数据库获取缺少详情的活动 run_id，再从 FIT 文件中匹配提取。
    """
    print()
    print("=" * 60)
    print("步骤 4/4: 导出活动详情到 activities_detail/")
    print("=" * 60)

    detail_dir = DETAIL_DIR
    os.makedirs(detail_dir, exist_ok=True)

    # 获取已有的详情文件，避免重复提取
    existing_details = set()
    if os.path.isdir(detail_dir):
        existing_details = {f.replace(".json", "") for f in os.listdir(detail_dir) if f.endswith(".json")}

    # 从数据库获取缺少详情的活动 run_id
    missing_ids = set()
    if session:
        all_activities = session.query(Activity).all()
        for a in all_activities:
            rid = str(a.run_id)
            if rid not in existing_details:
                missing_ids.add(rid)

    if not os.path.isdir(FIT_FOLDER):
        print(f"[错误] FIT 文件目录不存在: {FIT_FOLDER}")
        return 0, 0

    fit_files = sorted([f for f in os.listdir(FIT_FOLDER) if f.endswith(".fit")])
    print(f"FIT 文件: {len(fit_files)} 个")
    print(f"已有详情: {len(existing_details)} 个")
    print(f"缺少详情: {len(missing_ids)} 个")

    # 如果没有缺少的详情，直接跳过
    if not missing_ids:
        print("所有活动详情已完整，跳过")
        return 0, 0

    success_count = 0
    skip_count = 0
    error_count = 0

    for i, filename in enumerate(fit_files):
        file_path = os.path.join(FIT_FOLDER, filename)

        try:
            if os.path.getsize(file_path) == 0:
                skip_count += 1
                continue

            stream = Stream.from_file(file_path)
            decoder = Decoder(stream)
            messages, errors = decoder.read(convert_datetimes_to_dates=False)

            if not messages.get("session_mesgs"):
                skip_count += 1
                continue

            session_msg = messages["session_mesgs"][0]
            start_ts = session_msg["start_time"] + FIT_EPOCH_S
            start_time_utc = datetime.datetime.fromtimestamp(start_ts, tz=timezone.utc)
            run_id = str(int(start_time_utc.timestamp() * 1000))

            # 如果详情已存在或不在缺少列表中，跳过
            if run_id in existing_details or run_id not in missing_ids:
                skip_count += 1
                continue

            # 提取详细数据
            result = _extract_detail(messages, run_id, start_time_utc)
            if result is None:
                skip_count += 1
                continue

            # 保存
            output_path = os.path.join(detail_dir, f"{run_id}.json")
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False)
            success_count += 1
            existing_details.add(run_id)
            print(f"  + {run_id} ({result.get('type', '?')}, {result.get('distance', 0):.0f}m)")

        except Exception as e:
            error_count += 1
            if error_count <= 5:
                print(f"\n[错误] 处理文件失败: {filename} - {e}")

        # 进度
        if (i + 1) % 500 == 0:
            print(f"  扫描进度: {i + 1}/{len(fit_files)} (新增 {success_count})")

        # 如果所有缺少的都已找到，提前退出
        if success_count >= len(missing_ids):
            break

    print(f"\n详情导出完成: 新增 {success_count}, 跳过 {skip_count}, 失败 {error_count}")
    return success_count, error_count


def _extract_detail(messages, run_id, start_time_utc):
    """从 FIT messages 提取详细数据"""
    session_msg = messages["session_mesgs"][0]

    records = []
    for rec in messages.get("record_mesgs", []):
        point = {}
        if "position_lat" in rec and "position_long" in rec:
            point["lat"] = round(rec["position_lat"] / SEMICIRCLE, 7)
            point["lon"] = round(rec["position_long"] / SEMICIRCLE, 7)
        if "enhanced_altitude" in rec:
            point["alt"] = round(rec["enhanced_altitude"], 1)
        elif "altitude" in rec:
            point["alt"] = round(rec["altitude"], 1)
        if "heart_rate" in rec:
            point["hr"] = int(rec["heart_rate"])
        if "distance" in rec:
            point["dist"] = round(rec["distance"], 1)
        if "enhanced_speed" in rec:
            point["speed"] = round(rec["enhanced_speed"], 2)
        elif "speed" in rec:
            point["speed"] = round(rec["speed"], 2)
        if "timestamp" in rec:
            point["time"] = rec["timestamp"] - session_msg["start_time"]
        if "temperature" in rec:
            point["temp"] = int(rec["temperature"])
        if "cadence" in rec:
            point["cadence"] = int(rec["cadence"])
        if "power" in rec:
            point["power"] = int(rec["power"])
        records.append(point)

    laps = []
    for lap in messages.get("lap_mesgs", []):
        lap_data = {}
        if "total_distance" in lap:
            lap_data["dist"] = round(lap["total_distance"], 1)
        if "total_elapsed_time" in lap:
            lap_data["time"] = round(lap["total_elapsed_time"], 1)
        if "avg_heart_rate" in lap:
            lap_data["avg_hr"] = int(lap["avg_heart_rate"])
        if "max_heart_rate" in lap:
            lap_data["max_hr"] = int(lap["max_heart_rate"])
        if "enhanced_avg_speed" in lap:
            lap_data["avg_speed"] = round(lap["enhanced_avg_speed"], 2)
        elif "avg_speed" in lap:
            lap_data["avg_speed"] = round(lap["avg_speed"], 2)
        if "total_ascent" in lap:
            lap_data["ascent"] = round(lap["total_ascent"], 1)
        if "total_descent" in lap:
            lap_data["descent"] = round(lap["total_descent"], 1)
        if lap_data:
            laps.append(lap_data)

    result = {
        "run_id": int(run_id),
        "start_time": start_time_utc.strftime("%Y-%m-%d %H:%M:%S"),
        "type": session_msg.get("sport", "unknown").lower(),
        "distance": round(session_msg.get("total_distance", 0), 1),
        "elapsed_time": round(session_msg.get("total_elapsed_time", 0), 1),
        "records": records,
    }
    if laps:
        result["laps"] = laps

    return result


# ============ 主函数 ============

def main():
    force_geo = "--force-geo" in sys.argv
    full = "--full" in sys.argv

    print("=" * 60)
    print("跑步数据一体化同步工具")
    print("=" * 60)
    print(f"FIT 目录:    {FIT_FOLDER}")
    print(f"数据库:      {SQL_FILE}")
    print(f"输出 JSON:   {JSON_FILE}")
    print(f"地址缓存:    {LOCATION_CACHE_FILE}")
    print(f"强制获取地址: {'是' if force_geo else '否'}")
    print(f"完整重建:     {'是' if full else '否'}")

    # 初始化数据库
    session = init_db(SQL_FILE)

    # 步骤 1：导入 FIT 文件
    step_import_fit(session, force_all=full)

    # 步骤 2：Nominatim 逆地理编码
    step_geocode(session, force_geo=force_geo or full)

    # 步骤 3：导出 activities.json
    step_export_json()

    # 步骤 4：导出活动详情
    step_export_details(session)

    # 最终统计
    print()
    print("=" * 60)
    print("同步完成！")
    print("=" * 60)

    # 输出数据库统计
    activities = session.query(Activity).all()
    type_counts = {}
    for a in activities:
        t = a.type or "Unknown"
        type_counts[t] = type_counts.get(t, 0) + 1
    print(f"\n活动总数: {len(activities)}")
    print("类型统计:")
    for t, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {t}: {count}")

    detailed = sum(1 for a in activities if is_detailed_location(a.location_country))
    province_only = sum(1 for a in activities if a.location_country and not is_detailed_location(a.location_country))
    no_location = sum(1 for a in activities if not a.location_country)
    has_track = sum(1 for a in activities if a.summary_polyline)
    print(f"\n地址统计: 详细 {detailed}, 省份级 {province_only}, 空 {no_location}")
    print(f"轨迹统计: 有轨迹 {has_track}, 无轨迹 {len(activities) - has_track}")


if __name__ == "__main__":
    main()
