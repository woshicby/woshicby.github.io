#!/usr/bin/env python3
"""
从 FIT 目录读取 FIT 文件，转换为 activities.json
包含完善的异常处理和控制台输出
"""
import json
import sys
import os
import traceback

# 将当前目录添加到路径，确保可以导入模块
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import JSON_FILE, SQL_FILE, FIT_FOLDER, SUSPICIOUS_ELEVATION_THRESHOLD_M
from generator import Generator


def make_activities_file(sql_file, data_dir, json_file, file_suffix="gpx"):
    print(f"=" * 60)
    print(f"FIT 文件转换工具")
    print(f"=" * 60)
    print(f"数据库文件: {sql_file}")
    print(f"FIT 文件目录: {data_dir}")
    print(f"输出 JSON 文件: {json_file}")
    print(f"文件类型: {file_suffix}")
    print()

    # 检查 FIT 目录是否存在
    if not os.path.isdir(data_dir):
        print(f"[错误] FIT 文件目录不存在: {data_dir}")
        sys.exit(1)

    # 统计 FIT 文件数量
    fit_files = [f for f in os.listdir(data_dir) if f.endswith(f".{file_suffix}")]
    print(f"发现 {len(fit_files)} 个 {file_suffix.upper()} 文件")
    print()

    if not fit_files:
        print("[警告] 没有找到任何 FIT 文件，退出")
        return

    # 步骤1: 同步 FIT 文件到数据库
    print("-" * 40)
    print("步骤 1/3: 读取 FIT 文件并写入数据库")
    print("-" * 40)
    try:
        generator = Generator(sql_file)
        generator.sync_from_data_dir(data_dir, file_suffix=file_suffix)
    except Exception as e:
        print(f"\n[错误] 同步 FIT 文件时发生异常:")
        print(f"  异常类型: {type(e).__name__}")
        print(f"  异常信息: {e}")
        traceback.print_exc()
        # 即使出错也保存位置缓存
        try:
            from db import _save_location_cache
            _save_location_cache()
            print("[信息] 位置缓存已保存")
        except Exception:
            pass
        sys.exit(1)

    # 步骤2: 从数据库加载活动数据
    print()
    print("-" * 40)
    print("步骤 2/3: 从数据库加载活动数据")
    print("-" * 40)
    try:
        activities_list = generator.load()
    except Exception as e:
        print(f"\n[错误] 加载活动数据时发生异常:")
        print(f"  异常类型: {type(e).__name__}")
        print(f"  异常信息: {e}")
        traceback.print_exc()
        try:
            from db import _save_location_cache
            _save_location_cache()
            print("[信息] 位置缓存已保存")
        except Exception:
            pass
        sys.exit(1)

    # 保存位置缓存
    try:
        from db import _save_location_cache
        _save_location_cache()
        print("[信息] 位置缓存已保存")
    except Exception as e:
        print(f"[警告] 保存位置缓存失败: {e}")

    # 步骤3: 验证数据并写入 JSON
    print()
    print("-" * 40)
    print("步骤 3/3: 验证数据并写入 JSON 文件")
    print("-" * 40)

    # 数据验证
    total_count = len(activities_list)
    print(f"总活动数: {total_count}")

    # 检查各字段完整性
    missing_fields = {}
    suspicious_data = []

    for i, act in enumerate(activities_list):
        # 检查关键字段是否缺失
        for key in ["run_id", "start_date_local", "distance", "type"]:
            if not act.get(key) and act.get(key) != 0:
                field_key = f"{key}"
                if field_key not in missing_fields:
                    missing_fields[field_key] = []
                missing_fields[field_key].append(i)

        # 检查可疑数据
        run_id = act.get("run_id")
        distance = act.get("distance", 0)
        elevation = act.get("elevation_gain", 0)
        start_date = act.get("start_date_local", "")
        name = act.get("name", "")

        if distance < 0:
            suspicious_data.append(
                f"  [{i}] run_id={run_id}: 距离为负数 ({distance}m) - {start_date} {name}"
            )
        if elevation and elevation > SUSPICIOUS_ELEVATION_THRESHOLD_M:
            suspicious_data.append(
                f"  [{i}] run_id={run_id}: 爬升异常巨大 ({elevation}m) - {start_date} {name}"
            )
        if not start_date:
            suspicious_data.append(
                f"  [{i}] run_id={run_id}: 缺少开始日期"
            )

    # 输出缺失字段统计
    if missing_fields:
        print("\n[警告] 部分活动缺少关键字段:")
        for field, indices in missing_fields.items():
            print(f"  缺少 {field}: {len(indices)} 条活动")

    # 输出可疑数据
    if suspicious_data:
        print(f"\n[警告] 发现 {len(suspicious_data)} 条可疑数据:")
        for msg in suspicious_data[:20]:  # 最多显示20条
            print(msg)
        if len(suspicious_data) > 20:
            print(f"  ... 还有 {len(suspicious_data) - 20} 条可疑数据未显示")

    # 按类型统计
    type_counts = {}
    for act in activities_list:
        t = act.get("type", "Unknown")
        type_counts[t] = type_counts.get(t, 0) + 1
    print("\n活动类型统计:")
    for t, count in sorted(type_counts.items(), key=lambda x: -x[1]):
        print(f"  {t}: {count} 条")

    # 写入 JSON
    try:
        with open(json_file, "w", encoding="utf-8") as f:
            json.dump(activities_list, f, ensure_ascii=False)
        file_size = os.path.getsize(json_file)
        print(f"\n[成功] 活动数据已保存到 {json_file}")
        print(f"  文件大小: {file_size / 1024:.1f} KB")
        print(f"  活动总数: {total_count}")
    except Exception as e:
        print(f"\n[错误] 写入 JSON 文件时发生异常:")
        print(f"  异常类型: {type(e).__name__}")
        print(f"  异常信息: {e}")
        traceback.print_exc()
        sys.exit(1)

    print()
    print("=" * 60)
    print("转换完成！")
    print("=" * 60)


if __name__ == "__main__":
    make_activities_file(SQL_FILE, FIT_FOLDER, JSON_FILE, "fit")
