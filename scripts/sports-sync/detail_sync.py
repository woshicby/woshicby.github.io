#!/usr/bin/env python3
"""
从 FIT 文件提取详细运动数据，生成 activities_detail/RUN_ID.json
包含每个记录点的：距离、海拔、心率、速度、坐标、时间戳
"""
import json
import os
import sys
import traceback
import datetime
from datetime import timezone

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from garmin_fit_sdk import Decoder, Stream
from garmin_fit_sdk.util import FIT_EPOCH_S

from config import SEMICIRCLE, FIT_FOLDER, DETAIL_DIR


def make_run_id(start_time_utc):
    """从 UTC 时间生成 run_id（毫秒时间戳）"""
    return int(start_time_utc.timestamp() * 1000)


def extract_detail_from_fit(file_path):
    """从单个 FIT 文件提取详细数据"""
    if os.path.getsize(file_path) == 0:
        return None

    try:
        stream = Stream.from_file(file_path)
        decoder = Decoder(stream)
        messages, errors = decoder.read(convert_datetimes_to_dates=False)

        if errors:
            print(f"[警告] FIT 文件读取有错误: {os.path.basename(file_path)}")
            print(f"  错误: {errors}")

        # 获取 session 信息
        if not messages.get("session_mesgs"):
            return None
        session = messages["session_mesgs"][0]

        # 计算 run_id
        start_ts = session["start_time"] + FIT_EPOCH_S
        start_time_utc = datetime.datetime.fromtimestamp(start_ts, tz=timezone.utc)
        run_id = make_run_id(start_time_utc)

        # 提取 record_mesgs 详细数据
        records = []
        for rec in messages.get("record_mesgs", []):
            point = {}

            # 坐标
            if "position_lat" in rec and "position_long" in rec:
                point["lat"] = round(rec["position_lat"] / SEMICIRCLE, 7)
                point["lon"] = round(rec["position_long"] / SEMICIRCLE, 7)

            # 海拔
            if "enhanced_altitude" in rec:
                point["alt"] = round(rec["enhanced_altitude"], 1)
            elif "altitude" in rec:
                point["alt"] = round(rec["altitude"], 1)

            # 心率
            if "heart_rate" in rec:
                point["hr"] = int(rec["heart_rate"])

            # 距离
            if "distance" in rec:
                point["dist"] = round(rec["distance"], 1)

            # 速度
            if "enhanced_speed" in rec:
                point["speed"] = round(rec["enhanced_speed"], 2)
            elif "speed" in rec:
                point["speed"] = round(rec["speed"], 2)

            # 时间戳（转为秒偏移量，相对于开始时间）
            if "timestamp" in rec:
                point["time"] = rec["timestamp"] - session["start_time"]

            # 温度
            if "temperature" in rec:
                point["temp"] = int(rec["temperature"])

            # 步频（跑步时）
            if "cadence" in rec:
                point["cadence"] = int(rec["cadence"])

            # 功率（骑行时）
            if "power" in rec:
                point["power"] = int(rec["power"])

            records.append(point)

        # 提取 lap 信息
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

        # 汇总信息
        result = {
            "run_id": run_id,
            "start_time": start_time_utc.strftime("%Y-%m-%d %H:%M:%S"),
            "type": session.get("sport", "unknown").lower(),
            "distance": round(session.get("total_distance", 0), 1),
            "elapsed_time": round(session.get("total_elapsed_time", 0), 1),
            "records": records,
        }

        if laps:
            result["laps"] = laps

        return result

    except Exception as e:
        print(f"[错误] 处理 FIT 文件异常: {os.path.basename(file_path)}")
        print(f"  异常类型: {type(e).__name__}")
        print(f"  异常信息: {e}")
        return None


def main():
    print("=" * 60)
    print("FIT 详细数据提取工具")
    print("=" * 60)
    print(f"FIT 文件目录: {FIT_FOLDER}")
    print(f"输出目录: {DETAIL_DIR}")
    print()

    if not os.path.isdir(FIT_FOLDER):
        print(f"[错误] FIT 文件目录不存在: {FIT_FOLDER}")
        sys.exit(1)

    # 创建输出目录
    os.makedirs(DETAIL_DIR, exist_ok=True)

    # 获取所有 FIT 文件
    fit_files = [f for f in os.listdir(FIT_FOLDER) if f.endswith(".fit")]
    print(f"发现 {len(fit_files)} 个 FIT 文件")
    print()

    success_count = 0
    error_count = 0
    skip_count = 0

    for i, filename in enumerate(fit_files):
        file_path = os.path.join(FIT_FOLDER, filename)
        result = extract_detail_from_fit(file_path)

        if result is None:
            skip_count += 1
            continue

        # 保存为 JSON
        output_path = os.path.join(DETAIL_DIR, f"{result['run_id']}.json")
        try:
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(result, f, ensure_ascii=False)
            success_count += 1
        except Exception as e:
            error_count += 1
            print(f"[错误] 写入文件失败: {output_path}")
            print(f"  异常: {e}")

        # 进度显示
        if (i + 1) % 100 == 0:
            print(f"  进度: {i + 1}/{len(fit_files)}")

    print()
    print("-" * 40)
    print(f"提取完成!")
    print(f"  成功: {success_count}")
    print(f"  跳过: {skip_count}")
    print(f"  失败: {error_count}")
    print(f"  输出目录: {DETAIL_DIR}")
    print("=" * 60)


if __name__ == "__main__":
    main()
