#!/usr/bin/env python3
"""
将 492728.json 中剩余的 Keep 记录转为 FIT 文件
设备标记为手机，遵循 Garmin FIT 标准
"""

import json
import os
from datetime import datetime, timezone
from garmin_fit_sdk import Encoder
from garmin_fit_sdk.util import FIT_EPOCH_S

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

KEEP_JSON = os.path.join(PROJECT_ROOT, "JSON", "492728.json")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "FIT_from_keep")

# Keep 运动类型 -> (FIT sport, FIT sub_sport)
# sport 有效值: running, cycling, fitness_equipment, swimming, training, walking,
#   hiking, rowing, alpine_skiing, snowboarding, basketball, soccer, tennis,
#   boxing, golf, dance, jump_rope, meditation, hiit, inline_skating, ...
# sub_sport 有效值: generic, track, indoor_cycling, mountain, elliptical,
#   lap_swimming, flexibility_training, strength_training, cardio_training,
#   yoga(43, under training), indoor_running, indoor_walking, hiit(70, under hiit), ...
SPORT_MAP = {
    "跑步": ("running", "generic"),
    "行走": ("walking", "generic"),
    "健身": ("training", "cardio_training"),
    "瑜伽": ("training", "yoga"),
    "骑行": ("cycling", "generic"),
    "游泳": ("swimming", "lap_swimming"),
    "徒步": ("hiking", "generic"),
    "登山": ("hiking", "generic"),
    "椭圆机": ("fitness_equipment", "elliptical"),
    "划船机": ("fitness_equipment", "indoor_rowing"),
    "跳绳": ("jump_rope", "generic"),
    "力量训练": ("training", "strength_training"),
    "室内跑步": ("fitness_equipment", "indoor_running"),
    "室内骑行": ("cycling", "indoor_cycling"),
    "自由训练": ("training", "generic"),
    "拉伸": ("training", "flexibility_training"),
    "HIIT": ("hiit", "hiit"),
    "冥想": ("meditation", "generic"),
    "越野跑": ("running", "generic"),
}

# Garmin FIT 标准: manufacturer 枚举值
# 1=Garmin, 23=Suunto, 32=Wahoo, 89=Tacx, 123=Polar, 260=Zwift,
# 265=Strava, 294=Coros, 310=Decathlon, 348=Huawei
# 参照现有有轨迹的 FIT 文件，统一使用 garmin (1)
MANUFACTURER = 1  # garmin


def parse_time(t):
    if not t or t == "NULL":
        return None
    try:
        return datetime.strptime(t, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None


def safe_float(v):
    """返回 float 或 None（跳过 NULL/空/0）"""
    if v is None or v == "NULL" or v == "":
        return None
    try:
        f = float(v)
        return f if f != 0 else None
    except (ValueError, TypeError):
        return None


def safe_int(v):
    """返回 int 或 None（跳过 NULL/空/0）"""
    f = safe_float(v)
    return int(f) if f is not None else None


def time_to_fit_epoch(dt):
    return int(dt.timestamp()) - FIT_EPOCH_S


def json_to_fit(json_rec):
    """将一条 Keep JSON 记录转为 FIT 文件 bytes"""
    encoder = Encoder()

    # 解析数据
    start_dt = parse_time(json_rec.get("开始时间"))
    end_dt = parse_time(json_rec.get("结束时间"))
    if not start_dt:
        return None

    duration = safe_float(json_rec.get("运动时长(秒)"))
    distance = safe_float(json_rec.get("运动距离(米)"))
    calories = safe_int(json_rec.get("卡路里"))
    avg_hr = safe_int(json_rec.get("平均心率"))
    max_hr = safe_int(json_rec.get("最大心率"))

    # 心率记录
    hr_list = []
    hr_raw = json_rec.get("心率记录", "")
    if hr_raw and hr_raw != "NULL":
        try:
            parsed = json.loads(hr_raw)
            hr_list = [int(float(h)) for h in parsed if float(h) > 0]
        except (json.JSONDecodeError, ValueError):
            hr_list = []

    # 运动类型
    sport_type = json_rec.get("运动类型", "健身")
    sport, sub_sport = SPORT_MAP.get(sport_type, ("training", "generic"))

    start_ts = time_to_fit_epoch(start_dt)
    end_ts = time_to_fit_epoch(end_dt) if end_dt else start_ts + int(duration or 0)

    # ---- file_id_mesg (mesg_num=0) ----
    file_id = {
        "mesg_num": 0,
        "manufacturer": MANUFACTURER,
        "type": "activity",
        "product": 0,
        "serial_number": 0,
        "time_created": start_ts,
    }
    encoder.write_mesg(file_id)

    # ---- sport_mesg (mesg_num=12) ----
    sport_mesg = {
        "mesg_num": 12,
        "sport": sport,
        "sub_sport": sub_sport,
    }
    encoder.write_mesg(sport_mesg)

    # ---- record_mesgs (mesg_num=20) ----
    if hr_list:
        for i, hr in enumerate(hr_list):
            rec = {
                "mesg_num": 20,
                "timestamp": start_ts + i,
                "heart_rate": hr,
            }
            encoder.write_mesg(rec)

    # ---- lap_mesg (mesg_num=19) ----
    lap = {
        "mesg_num": 19,
        "timestamp": end_ts,
        "start_time": start_ts,
    }
    if duration:
        lap["total_elapsed_time"] = duration
        lap["total_timer_time"] = duration
    if distance:
        lap["total_distance"] = distance
    if calories:
        lap["total_calories"] = calories
    if avg_hr:
        lap["avg_heart_rate"] = avg_hr
    if max_hr:
        lap["max_heart_rate"] = max_hr
    encoder.write_mesg(lap)

    # ---- session_mesg (mesg_num=18) ----
    session = {
        "mesg_num": 18,
        "timestamp": end_ts,
        "start_time": start_ts,
        "sport": sport,
        "sub_sport": sub_sport,
    }
    if duration:
        session["total_elapsed_time"] = duration
        session["total_timer_time"] = duration
    if distance:
        session["total_distance"] = distance
    if calories:
        session["total_calories"] = calories
    if avg_hr:
        session["avg_heart_rate"] = avg_hr
    if max_hr:
        session["max_heart_rate"] = max_hr
    encoder.write_mesg(session)

    # ---- activity_mesg (mesg_num=34) ----
    activity = {
        "mesg_num": 34,
        "timestamp": end_ts,
        "total_timer_time": duration or 0,
        "type": "manual",
        "event": "activity",
        "event_type": "stop",
        "num_sessions": 1,
    }
    encoder.write_mesg(activity)

    return encoder.close()


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with open(KEEP_JSON, "r", encoding="utf-8") as f:
        records = json.load(f)

    print(f"Keep 记录: {len(records)} 条")

    created = 0
    errors = 0

    for r in records:
        start_dt = parse_time(r.get("开始时间"))
        if not start_dt:
            errors += 1
            continue

        sport_type = r.get("运动类型", "training")
        out_name = start_dt.strftime("%Y%m%d-%H%M%S") + f"-{sport_type}-keep.fit"
        out_path = os.path.join(OUTPUT_DIR, out_name)

        try:
            data = json_to_fit(r)
            if data is None:
                errors += 1
                continue
            with open(out_path, "wb") as f:
                f.write(data)
            created += 1
        except Exception as e:
            print(f"  [错误] {out_name}: {e}")
            errors += 1

        if created % 100 == 0 and created > 0:
            print(f"  进度: {created} 个文件...")

    print(f"\n完成!")
    print(f"  创建: {created} 个")
    print(f"  错误: {errors} 个")
    print(f"  输出: {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
