#!/usr/bin/env python3
"""
合并 FIT_keep 中的 FIT 文件与 492728.json 中的 Keep 数据
生成包含最完整数据的新 FIT 文件
"""

import json
import os
import re
import sys
from datetime import datetime, timezone, timedelta

from garmin_fit_sdk import Decoder, Stream, Encoder
from garmin_fit_sdk.util import FIT_EPOCH_S

# ============================================================
# 配置
# ============================================================
PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

FIT_KEEP_DIR = os.path.join(PROJECT_ROOT, "FIT_keep")
KEEP_JSON = os.path.join(PROJECT_ROOT, "JSON", "492728.json")
OUTPUT_DIR = os.path.join(PROJECT_ROOT, "FIT_merged")

# Keep 运动类型 -> FIT sport 映射
SPORT_MAP = {
    "跑步": "running",
    "行走": "walking",
    "健身": "training",
    "瑜伽": "yoga",
    "骑行": "cycling",
    "游泳": "swimming",
    "徒步": "hiking",
    "登山": "hiking",
    "椭圆机": "elliptical",
    "划船机": "rowing",
    "跳绳": "jump_rope",
    "力量训练": "strength_training",
    "室内跑步": "treadmill_running",
    "室内骑行": "indoor_cycling",
    "自由训练": "training",
    "拉伸": "flexibility",
    "HIIT": "hiit",
    "冥想": "breathwork",
    "滑雪": "alpine_skiing",
    "滑冰": "ice_skating",
    "篮球": "basketball",
    "足球": "soccer",
    "羽毛球": "badminton",
    "乒乓球": "table_tennis",
    "网球": "tennis",
    "拳击": "boxing",
    "攀岩": "climbing",
    "高尔夫": "golf",
    "舞蹈": "dance",
    "武术": "martial_arts",
    "飞盘": "ultimate_frisbee",
    "橄榄球": "rugby",
    "排球": "volleyball",
    "手球": "handball",
    "水球": "water_polo",
    "冲浪": "surfing",
    "帆船": "sailing",
    "皮划艇": "kayaking",
    "桨板": "stand_up_paddleboarding",
    "攀冰": "ice_climbing",
    "越野跑": "trail_running",
    "越野滑雪": "cross_country_skiing",
    "单板滑雪": "snowboarding",
    "滑板": "skateboarding",
    "轮滑": "inline_skating",
    "体操": "gymnastics",
    "击剑": "fencing",
    "摔跤": "wrestling",
    "举重": "weightlifting",
    "射箭": "archery",
    "射击": "shooting",
    "马术": "equestrian",
    "铁人三项": "triathlon",
    "铁人两项": "duathlon",
}


def parse_keep_time(t):
    """解析 Keep JSON 中的时间字符串 -> datetime"""
    if not t or t == "NULL":
        return None
    try:
        return datetime.strptime(t, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        return None


def time_to_fit_epoch(dt):
    """datetime -> FIT epoch timestamp (seconds since FIT_EPOCH)"""
    return int(dt.timestamp()) - FIT_EPOCH_S


def build_time_key(dt_str):
    """时间字符串 -> 匹配用的 key (20260603-181313)"""
    if not dt_str:
        return ""
    return dt_str.replace("-", "").replace(" ", "-").replace(":", "").replace(".", "")[:15]


def load_keep_records():
    """加载 Keep JSON 并按时间 key 索引"""
    with open(KEEP_JSON, "r", encoding="utf-8") as f:
        records = json.load(f)

    by_time = {}
    for r in records:
        for key in ["开始时间", "结束时间"]:
            t = r.get(key, "")
            tk = build_time_key(t)
            if tk and tk not in by_time:
                by_time[tk] = r
    return records, by_time


def find_best_fit(fit_files, fit_dir):
    """从匹配的 FIT 文件列表中选择数据最丰富的"""
    best = None
    best_score = -1
    best_messages = None

    for f in fit_files:
        fp = os.path.join(fit_dir, f)
        sz = os.path.getsize(fp)
        try:
            stream = Stream.from_file(fp)
            decoder = Decoder(stream)
            messages, errs = decoder.read(convert_datetimes_to_dates=False)
        except Exception:
            continue

        # 评分：有 record 数据的优先
        score = 0
        has_record = bool(messages.get("record_mesgs"))
        record_count = len(messages.get("record_mesgs", []))
        has_hr_in_record = False
        if has_record:
            score += 1000
            score += record_count
            has_hr_in_record = any("heart_rate" in r for r in messages["record_mesgs"][:5])
            if has_hr_in_record:
                score += 5000

        session = messages.get("session_mesgs", [{}])[0]
        if session.get("avg_heart_rate"):
            score += 100
        if session.get("total_distance"):
            score += 50

        if score > best_score:
            best_score = score
            best = f
            best_messages = messages

    return best, best_messages


def merge_fit_with_keep(messages, json_rec):
    """合并 FIT 数据与 Keep JSON 数据，返回新的 messages dict"""
    if not json_rec:
        return messages

    # 解析 JSON 数据
    def safe_float(v, default=0):
        if v is None or v == "NULL" or v == "":
            return default
        try:
            return float(v)
        except (ValueError, TypeError):
            return default

    json_start = parse_keep_time(json_rec.get("开始时间", ""))
    json_end = parse_keep_time(json_rec.get("结束时间", ""))
    json_duration = safe_float(json_rec.get("运动时长(秒)"))
    json_distance = safe_float(json_rec.get("运动距离(米)"))
    json_calories = safe_float(json_rec.get("卡路里"))
    json_avg_hr = safe_float(json_rec.get("平均心率"))
    json_max_hr = safe_float(json_rec.get("最大心率"))

    # 解析心率记录
    hr_list = []
    hr_raw = json_rec.get("心率记录", "")
    if hr_raw and hr_raw != "NULL":
        try:
            hr_list = json.loads(hr_raw)
            hr_list = [int(float(h)) for h in hr_list if float(h) > 0]
        except (json.JSONDecodeError, ValueError):
            hr_list = []

    # 运动类型映射
    json_sport = json_rec.get("运动类型", "")
    fit_sport = SPORT_MAP.get(json_sport, "training")

    # ---- 合并 session ----
    session = messages.get("session_mesgs", [{}])[0]

    # 如果 session 缺少 avg_heart_rate 且 JSON 有数据
    if not session.get("avg_heart_rate") and json_avg_hr > 0:
        session["avg_heart_rate"] = int(json_avg_hr)
    if not session.get("max_heart_rate") and json_max_hr > 0:
        session["max_heart_rate"] = int(json_max_hr)

    # 如果 session 缺少 total_calories 或为 0
    if (not session.get("total_calories") or session.get("total_calories") == 0) and json_calories > 0:
        session["total_calories"] = int(json_calories)

    # 如果 session 缺少 total_distance 或为 0
    if (not session.get("total_distance") or session.get("total_distance") == 0) and json_distance > 0:
        session["total_distance"] = json_distance

    # 如果 session 缺少 total_timer_time
    if not session.get("total_timer_time") and json_duration > 0:
        session["total_timer_time"] = json_duration
    if not session.get("total_elapsed_time") and json_duration > 0:
        session["total_elapsed_time"] = json_duration

    # 更新 session
    if messages.get("session_mesgs"):
        messages["session_mesgs"][0] = session
    else:
        messages["session_mesgs"] = [session]

    # ---- 合并 record mesgs ----
    record_mesgs = messages.get("record_mesgs", [])

    if record_mesgs and hr_list:
        # FIT 有 record 数据，添加心率
        has_hr = any("heart_rate" in r for r in record_mesgs[:5])
        if not has_hr:
            # 将 JSON 心率数据分配到 record mesgs
            n_records = len(record_mesgs)
            n_hr = len(hr_list)
            for i, rec in enumerate(record_mesgs):
                # 按比例分配心率
                hr_idx = int(i * n_hr / n_records) if n_records > 0 else 0
                hr_idx = min(hr_idx, n_hr - 1)
                if hr_idx >= 0:
                    rec["heart_rate"] = hr_list[hr_idx]

    elif not record_mesgs and hr_list:
        # FIT 没有 record 数据，用心率创建 record mesgs
        if json_start:
            start_ts = time_to_fit_epoch(json_start)
            new_records = []
            for i, hr in enumerate(hr_list):
                rec = {
                    "timestamp": start_ts + i,  # 每秒一个记录
                    "heart_rate": hr,
                }
                new_records.append(rec)
            messages["record_mesgs"] = new_records

    # ---- 确保 file_id 和 sport mesg 存在 ----
    if not messages.get("file_id_mesgs"):
        if json_start:
            messages["file_id_mesgs"] = [{
                "manufacturer": 10000,
                "type": "activity",
                "product": 9001,
                "serial_number": 1,
                "time_created": time_to_fit_epoch(json_start),
            }]

    if not messages.get("sport_mesgs"):
        messages["sport_mesgs"] = [{
            "sport": fit_sport,
            "sub_sport": "generic",
        }]

    # 确保 session 有 sport
    if not session.get("sport"):
        session["sport"] = fit_sport
        session["sub_sport"] = "generic"

    # 确保 session 有 start_time
    if not session.get("start_time") and json_start:
        session["start_time"] = time_to_fit_epoch(json_start)
    if not session.get("timestamp") and json_end:
        session["timestamp"] = time_to_fit_epoch(json_end)

    # ---- 确保 lap mesg 存在 ----
    if not messages.get("lap_mesgs"):
        lap = {
            "timestamp": session.get("timestamp", 0),
            "start_time": session.get("start_time", 0),
            "total_elapsed_time": session.get("total_elapsed_time", 0),
            "total_timer_time": session.get("total_timer_time", 0),
        }
        if session.get("total_distance"):
            lap["total_distance"] = session["total_distance"]
        if session.get("total_calories"):
            lap["total_calories"] = session["total_calories"]
        if session.get("avg_heart_rate"):
            lap["avg_heart_rate"] = session["avg_heart_rate"]
        messages["lap_mesgs"] = [lap]

    # ---- 确保 activity mesg 存在 ----
    if not messages.get("activity_mesgs"):
        messages["activity_mesgs"] = [{
            "timestamp": session.get("timestamp", 0),
            "total_timer_time": session.get("total_timer_time", 0),
            "type": "manual",
            "event": "activity",
            "event_type": "stop",
            "num_sessions": 1,
        }]

    return messages


def write_fit(messages, output_path):
    """将 messages dict 写入 FIT 文件"""
    encoder = Encoder()

    # mesg_num 映射
    MESG_NUM = {
        "file_id_mesgs": 0,
        "activity_mesgs": 34,
        "session_mesgs": 18,
        "lap_mesgs": 19,
        "record_mesgs": 20,
        "sport_mesgs": 12,
        "event_mesgs": 21,
        "device_info_mesgs": 23,
        "user_profile_mesgs": 3,
        "hrv_mesgs": 78,
        "developer_data_id_mesgs": 207,
        "field_description_mesgs": 206,
    }

    # 按正确顺序写入消息
    write_order = [
        "file_id_mesgs",
        "sport_mesgs",
        "session_mesgs",
        "lap_mesgs",
        "record_mesgs",
        "event_mesgs",
        "activity_mesgs",
        "device_info_mesgs",
        "user_profile_mesgs",
        "hrv_mesgs",
    ]

    for mesg_type in write_order:
        mesgs = messages.get(mesg_type, [])
        mesg_num = MESG_NUM.get(mesg_type)
        if mesg_num is None:
            continue
        for mesg in mesgs:
            mesg_copy = dict(mesg)
            mesg_copy["mesg_num"] = mesg_num
            encoder.write_mesg(mesg_copy)

    data = encoder.close()
    with open(output_path, "wb") as f:
        f.write(data)


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # 加载 Keep 数据
    print("加载 Keep 数据...")
    keep_records, keep_by_time = load_keep_records()
    print(f"  Keep 记录: {len(keep_records)} 条")
    print(f"  时间索引: {len(keep_by_time)} 个")

    # 扫描 FIT_keep 文件
    print("扫描 FIT 文件...")
    fit_files = sorted([f for f in os.listdir(FIT_KEEP_DIR) if f.endswith(".fit")])
    print(f"  FIT 文件: {len(fit_files)} 个")

    # 按时间 key 分组 FIT 文件
    fit_by_time = {}
    unmatched_fit = []
    for f in fit_files:
        parts = f.split("-")
        if len(parts) >= 2:
            dt_key = parts[0] + "-" + parts[1]
        else:
            dt_key = ""

        if dt_key in keep_by_time:
            if dt_key not in fit_by_time:
                fit_by_time[dt_key] = []
            fit_by_time[dt_key].append(f)
        else:
            unmatched_fit.append(f)

    print(f"  匹配时间点: {len(fit_by_time)} 个")
    print(f"  未匹配 FIT: {len(unmatched_fit)} 个")

    # 按 Keep 记录分组处理
    # 一个 Keep 记录可能匹配多个时间点（开始+结束），需要去重
    processed_json_recs = set()
    merged_count = 0
    error_count = 0

    for dt_key, fit_file_list in sorted(fit_by_time.items()):
        json_rec = keep_by_time.get(dt_key)
        if not json_rec:
            continue

        # 用开始时间作为去重 key
        start_key = json_rec.get("开始时间", "")
        if start_key in processed_json_recs:
            continue
        processed_json_recs.add(start_key)

        # 选择最佳 FIT 文件
        best_file, best_messages = find_best_fit(fit_file_list, FIT_KEEP_DIR)
        if best_messages is None:
            error_count += 1
            continue

        # 合并数据
        merged_messages = merge_fit_with_keep(best_messages, json_rec)

        # 生成输出文件名
        # 使用开始时间 + 运动类型
        json_start = parse_keep_time(json_rec.get("开始时间", ""))
        sport_name = json_rec.get("运动类型", "training")
        if json_start:
            out_name = json_start.strftime("%Y%m%d-%H%M%S") + f"-{sport_name}-keep.fit"
        else:
            out_name = best_file.replace(".fit", "-merged.fit")

        out_path = os.path.join(OUTPUT_DIR, out_name)

        try:
            write_fit(merged_messages, out_path)
            merged_count += 1
        except Exception as e:
            print(f"  [错误] 写入 {out_name} 失败: {e}")
            error_count += 1

        if merged_count % 200 == 0:
            print(f"  进度: {merged_count} 个文件已合并...")

    # 处理未匹配的 FIT 文件（直接复制）
    copied = 0
    for f in unmatched_fit:
        src = os.path.join(FIT_KEEP_DIR, f)
        dst = os.path.join(OUTPUT_DIR, f)
        if not os.path.exists(dst):
            import shutil
            shutil.copy2(src, dst)
            copied += 1

    print(f"\n完成!")
    print(f"  合并: {merged_count} 个")
    print(f"  复制未匹配: {copied} 个")
    print(f"  错误: {error_count} 个")
    print(f"  输出目录: {OUTPUT_DIR}/")


if __name__ == "__main__":
    main()
