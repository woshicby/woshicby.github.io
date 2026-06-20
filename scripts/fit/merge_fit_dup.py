#!/usr/bin/env python3
"""
合并 FIT_raw 目录中属于同一个活动的多个 FIT 文件。

策略：
  1. 扫描所有子目录的 FIT 文件，按 session start_time + 距离分组
  2. 对每组重复文件，读取所有文件的完整数据，合并互补信息：
     - session: 合并所有非空/非零字段，优先取更详细的值
     - record: 取记录点最多的那份（GPS 最详细），补充其他文件的心率/海拔等缺失字段
     - lap: 取 lap 数最多的那份，补充缺失字段
     - device_info: 合并所有文件的不同设备信息
     - sport: 取最详细的运动类型（sub_sport 非 generic 优先）
     - file_id: 取 Garmin 设备的 file_id，否则取第一个
  3. 非重复文件直接移动到 FIT_raw/ 根目录
  4. 合并完成后删除空的子目录
  5. 输出重复名单到 FIT_raw_dup_list.json

用法：
  python merge_fit_dup.py              # 实际执行合并
  python merge_fit_dup.py --dry-run    # 仅输出将要执行的操作，不实际修改
"""

import os
import sys
import json
import shutil
import datetime
from datetime import timezone, timedelta
from collections import defaultdict

from garmin_fit_sdk import Decoder, Stream, Encoder
from garmin_fit_sdk.util import FIT_EPOCH_S

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

SEMICIRCLE = 11930465

SPORT_MAP = {
    0: "generic", 1: "running", 2: "cycling", 3: "transition",
    5: "fitness_equipment", 11: "walking", 12: "cross_country_skiing",
    13: "alpine_skiing", 14: "snowboarding", 15: "rowing",
    17: "hiking", 19: "swimming", 26: "elliptical",
    27: "stair_climbing", 28: "yoga", 32: "stand_up_paddleboarding",
    36: "treadmill_running", 37: "gravel_cycling", 39: "mountain_biking",
    44: "indoor_rowing", 45: "indoor_cycling", 46: "indoor_running",
    71: "strength_training", 82: "pilates",
}

SUB_SPORT_MAP = {
    0: "generic", 1: "treadmill", 2: "street", 3: "trail",
    4: "track", 5: "spin", 6: "indoor_cycling", 7: "road",
    8: "mountain", 9: "downhill", 10: "recumbent",
    11: "cyclocross", 12: "hand_cycling", 13: "track_cycling",
    14: "indoor_running", 15: "indoor_rower", 16: "indoor_skiing",
    17: "elliptical", 18: "stair_climbing", 19: "lap_swimming",
    20: "open_water", 21: "flexibility_training", 22: "strength_training",
    23: "warm_up", 24: "match", 25: "exercise", 26: "challenge",
    27: "indoor_skiing", 28: "cardio_training", 29: "indoor_walking",
    30: "e_bike_fitness", 31: "bmx", 32: "casual_walking",
    33: "speed_walking", 34: "bike_to_run_transition",
    35: "run_to_bike_transition", 36: "swim_to_bike_transition",
    37: "atv", 38: "motocross", 39: "backcountry", 40: "resort",
    41: "rc_drone", 42: "wingsuit", 43: "whitewater",
    44: "skate_skiing", 45: "yoga", 46: "pilates",
    47: "indoor_running", 48: "indoor_cycling", 49: "indoor_rower",
}

SPORT_CN = {
    "running": "跑步", "treadmill_running": "跑步", "indoor_running": "跑步",
    "trail": "越野跑", "street": "跑步", "track": "跑步",
    "cycling": "骑行", "road": "公路骑行", "mountain": "山地骑行",
    "gravel_cycling": "砾石骑行", "indoor_cycling": "室内骑行",
    "spin": "室内骑行", "track_cycling": "场地骑行",
    "cyclocross": "越野骑行", "e_bike_fitness": "电助力骑行",
    "walking": "步行", "casual_walking": "休闲走", "speed_walking": "健走",
    "indoor_walking": "室内步行",
    "hiking": "徒步",
    "swimming": "游泳", "lap_swimming": "泳池游泳", "open_water": "公开水域游泳",
    "fitness_equipment": "健身", "strength_training": "力量训练",
    "cardio_training": "有氧训练", "elliptical": "椭圆机",
    "stair_climbing": "爬楼梯", "indoor_rower": "室内划船",
    "yoga": "瑜伽", "pilates": "普拉提",
    "flexibility_training": "柔韧训练", "exercise": "健身",
    "treadmill": "跑步机", "indoor_skiing": "室内滑雪",
    "generic": "其他", "transition": "转换",
    "warm_up": "热身", "match": "赛事", "challenge": "挑战",
    "rowing": "划船", "indoor_rowing": "室内划船",
    "cross_country_skiing": "越野滑雪", "alpine_skiing": "高山滑雪",
    "snowboarding": "单板滑雪", "stand_up_paddleboarding": "桨板",
    "mountain_biking": "山地骑行", "bmx": "BMX",
    "downhill": "速降", "recumbent": "躺车",
    "hand_cycling": "手摇车", "backcountry": "野外滑雪",
    "resort": "度假村滑雪", "skate_skiing": "滑冰滑雪",
    "whitewater": "白水漂流", "atv": "ATV", "motocross": "摩托越野",
}

FIT_RAW_DIR = os.path.join(PROJECT_ROOT, "FIT_raw")

# FIT 消息类型编号
MESG_NUM = {
    "file_id_mesgs": 0,
    "sport_mesgs": 12,
    "session_mesgs": 18,
    "lap_mesgs": 19,
    "record_mesgs": 20,
    "event_mesgs": 21,
    "device_info_mesgs": 23,
    "user_profile_mesgs": 3,
    "activity_mesgs": 34,
    "hrv_mesgs": 78,
    "developer_data_id_mesgs": 207,
    "field_description_mesgs": 206,
}

# 写入顺序（FIT 规范要求）
WRITE_ORDER = [
    "file_id_mesgs",
    "sport_mesgs",
    "device_info_mesgs",
    "user_profile_mesgs",
    "lap_mesgs",
    "record_mesgs",
    "event_mesgs",
    "session_mesgs",
    "activity_mesgs",
    "hrv_mesgs",
]


def parse_fit_full(file_path):
    """解析 FIT 文件，返回 (info_dict, messages_dict) 或 (None, None)"""
    try:
        if os.path.getsize(file_path) == 0:
            return None, None
        stream = Stream.from_file(file_path)
        decoder = Decoder(stream)
        messages, errors = decoder.read(convert_datetimes_to_dates=False)

        if not messages.get("session_mesgs"):
            return None, None

        session_msg = messages["session_mesgs"][0]

        start_ts = session_msg["start_time"] + FIT_EPOCH_S
        start_time_utc = datetime.datetime.fromtimestamp(start_ts, tz=timezone.utc)
        start_date_local = start_time_utc.astimezone(
            datetime.timezone(datetime.timedelta(hours=8))
        )

        distance = float(session_msg.get("total_distance", 0))

        sport_num = session_msg.get("sport", 0)
        sub_sport_num = session_msg.get("sub_sport", 0)
        sport_name = SPORT_MAP.get(sport_num, "generic") if isinstance(sport_num, int) else str(sport_num).lower()
        sub_sport_name = SUB_SPORT_MAP.get(sub_sport_num, "generic") if isinstance(sub_sport_num, int) else str(sub_sport_num).lower()

        if sub_sport_name != "generic":
            detailed_sport = sub_sport_name
        else:
            detailed_sport = sport_name

        elapsed_time = float(session_msg.get("total_elapsed_time", 0))
        moving_time = float(session_msg.get("total_timer_time", elapsed_time))
        avg_hr = session_msg.get("avg_heart_rate")
        elevation_gain = float(session_msg.get("total_ascent", 0))
        record_count = len(messages.get("record_mesgs", []))
        lap_count = len(messages.get("lap_mesgs", []))

        device_info = messages.get("device_info_mesgs", [])
        has_garmin_device = False
        manufacturer = None
        product = None
        if device_info:
            manufacturer = device_info[0].get("manufacturer")
            product = device_info[0].get("product")
            if manufacturer == "garmin" or (isinstance(manufacturer, int) and manufacturer == 1):
                has_garmin_device = True

        info = {
            "start_ts": start_ts,
            "start_date_local": start_date_local,
            "distance": distance,
            "sport": sport_name,
            "sub_sport": sub_sport_name,
            "detailed_sport": detailed_sport,
            "moving_time_sec": moving_time,
            "elapsed_time_sec": elapsed_time,
            "avg_hr": avg_hr,
            "elevation_gain": elevation_gain,
            "record_count": record_count,
            "lap_count": lap_count,
            "has_garmin_device": has_garmin_device,
            "manufacturer": manufacturer,
            "product": product,
            "file_path": file_path,
        }
        return info, messages
    except Exception as e:
        return {"error": str(e), "file_path": file_path}, None


def score_file(info):
    """为文件打分，分数越高数据越丰富"""
    if "error" in info:
        return -1
    score = 0
    score += info["record_count"]
    if info["has_garmin_device"]:
        score += 1000
    if info["sub_sport"] != "generic":
        score += 200
    if info["elevation_gain"] > 0:
        score += 100
    if info["avg_hr"] and info["avg_hr"] > 0:
        score += 50
    return score


def merge_messages(all_messages_list):
    """合并同一活动的多个 messages dict，返回合并后的 messages

    策略：
    - session: 以最高分的为基础，补充其他文件中缺失的字段
    - record: 取记录点最多的那份，补充心率/海拔/温度等缺失字段
    - lap: 取 lap 数最多的那份，补充缺失字段
    - device_info: 合并所有文件的不同设备信息（按 serial_number 去重）
    - sport: 取最详细的运动类型
    - file_id: 取 Garmin 设备的，否则取第一个
    - activity: 取第一个有效的
    """
    if len(all_messages_list) == 1:
        return all_messages_list[0]

    # 按 session 数据丰富度排序（用于确定基础文件）
    def session_richness(msgs):
        s = msgs.get("session_mesgs", [{}])[0]
        return sum(1 for v in s.values() if v is not None and v != 0 and v != "")

    sorted_msgs = sorted(all_messages_list, key=session_richness, reverse=True)
    base = sorted_msgs[0]

    # ---- 合并 session ----
    base_session = dict(base.get("session_mesgs", [{}])[0])
    for msgs in sorted_msgs[1:]:
        other_session = msgs.get("session_mesgs", [{}])[0]
        for key, val in other_session.items():
            if key in base_session:
                base_val = base_session[key]
                # 如果基础值为空/零/None，用其他文件的值补充
                if (base_val is None or base_val == 0 or base_val == "" or base_val == 0.0) and val is not None and val != 0 and val != "":
                    base_session[key] = val
            else:
                # 基础文件没有这个字段，直接补充
                if val is not None and val != 0 and val != "":
                    base_session[key] = val

    # ---- 合并 sport ----
    # 取最详细的运动类型（sub_sport 非 generic 优先）
    best_sport = None
    best_sub_sport = None
    for msgs in sorted_msgs:
        sport_mesgs = msgs.get("sport_mesgs", [])
        if sport_mesgs:
            s = sport_mesgs[0]
            sp = s.get("sport", "generic")
            ssp = s.get("sub_sport", "generic")
            if best_sport is None:
                best_sport = sp
                best_sub_sport = ssp
            if ssp != "generic" and best_sub_sport == "generic":
                best_sport = sp
                best_sub_sport = ssp

    # 同步 session 中的 sport/sub_sport
    if best_sub_sport and best_sub_sport != "generic":
        base_session["sport"] = best_sport
        base_session["sub_sport"] = best_sub_sport
    elif best_sport and not base_session.get("sport"):
        base_session["sport"] = best_sport

    # ---- 合并 record ----
    # 取记录点最多的那份作为基础
    best_record_idx = -1
    best_record_count = 0
    for i, msgs in enumerate(sorted_msgs):
        rc = len(msgs.get("record_mesgs", []))
        if rc > best_record_count:
            best_record_count = rc
            best_record_idx = i

    if best_record_idx >= 0:
        base_records = list(sorted_msgs[best_record_idx].get("record_mesgs", []))
    else:
        base_records = []

    # 如果基础 record 没有某些字段（心率/海拔/温度），从其他文件补充
    if base_records:
        # 检查基础 record 缺少哪些字段
        sample = base_records[:min(10, len(base_records))]
        missing_fields = set()
        for rec in sample:
            for field in ["heart_rate", "altitude", "temperature", "cadence", "speed", "enhanced_speed", "enhanced_altitude"]:
                if field not in rec:
                    missing_fields.add(field)

        if missing_fields:
            # 找到有这些字段的文件
            for msgs in sorted_msgs:
                other_records = msgs.get("record_mesgs", [])
                if not other_records:
                    continue

                # 检查其他文件是否有缺失字段
                other_sample = other_records[:min(10, len(other_records))]
                has_missing = any(f in rec for rec in other_sample for f in missing_fields)
                if not has_missing:
                    continue

                # 按时间戳对齐，补充缺失字段
                other_by_ts = {}
                for rec in other_records:
                    ts = rec.get("timestamp")
                    if ts is not None:
                        other_by_ts[ts] = rec

                for rec in base_records:
                    ts = rec.get("timestamp")
                    if ts is not None and ts in other_by_ts:
                        for field in missing_fields:
                            if field not in rec and field in other_by_ts[ts]:
                                rec[field] = other_by_ts[ts][field]

                # 对于时间戳不完全匹配的情况，按比例分配
                other_ts_list = sorted(other_by_ts.keys())
                if other_ts_list:
                    for rec in base_records:
                        ts = rec.get("timestamp")
                        if ts is None:
                            continue
                        for field in missing_fields:
                            if field not in rec:
                                # 找最近的 timestamp
                                if ts in other_by_ts and field in other_by_ts[ts]:
                                    rec[field] = other_by_ts[ts][field]
                                else:
                                    # 二分查找最近的
                                    import bisect
                                    idx = bisect.bisect_left(other_ts_list, ts)
                                    if idx < len(other_ts_list):
                                        nearest_ts = other_ts_list[idx]
                                        if field in other_by_ts[nearest_ts]:
                                            rec[field] = other_by_ts[nearest_ts][field]
                                    elif idx > 0:
                                        nearest_ts = other_ts_list[idx - 1]
                                        if field in other_by_ts[nearest_ts]:
                                            rec[field] = other_by_ts[nearest_ts][field]

                # 更新缺失字段列表（已补充的不再尝试）
                still_missing = set()
                new_sample = base_records[:min(10, len(base_records))]
                for rec in new_sample:
                    for field in missing_fields:
                        if field not in rec:
                            still_missing.add(field)
                missing_fields = still_missing
                if not missing_fields:
                    break

    # ---- 合并 lap ----
    # 取 lap 数最多的那份
    best_lap_idx = -1
    best_lap_count = 0
    for i, msgs in enumerate(sorted_msgs):
        lc = len(msgs.get("lap_mesgs", []))
        if lc > best_lap_count:
            best_lap_count = lc
            best_lap_idx = i

    if best_lap_idx >= 0:
        base_laps = [dict(lap) for lap in sorted_msgs[best_lap_idx].get("lap_mesgs", [])]
        # 补充 lap 缺失字段
        for msgs in sorted_msgs:
            other_laps = msgs.get("lap_mesgs", [])
            if len(other_laps) != len(base_laps):
                continue
            for i, lap in enumerate(base_laps):
                for key, val in other_laps[i].items():
                    if key not in lap and val is not None and val != 0:
                        lap[key] = val
                    elif key in lap and (lap[key] is None or lap[key] == 0) and val is not None and val != 0:
                        lap[key] = val
    else:
        base_laps = []

    # ---- 合并 device_info ----
    # 合并所有文件的不同设备信息（按 serial_number 去重）
    all_devices = []
    seen_serials = set()
    for msgs in sorted_msgs:
        for dev in msgs.get("device_info_mesgs", []):
            serial = dev.get("serial_number")
            if serial is not None and serial not in seen_serials:
                seen_serials.add(serial)
                all_devices.append(dict(dev))
            elif serial is None:
                all_devices.append(dict(dev))

    # ---- 合并 file_id ----
    # 优先取 Garmin 设备的 file_id
    base_file_id = None
    for msgs in sorted_msgs:
        fid = msgs.get("file_id_mesgs", [])
        if fid:
            f = fid[0]
            mfr = f.get("manufacturer")
            if mfr == "garmin" or (isinstance(mfr, int) and mfr == 1):
                base_file_id = dict(f)
                break
    if base_file_id is None:
        base_file_id = dict(sorted_msgs[0].get("file_id_mesgs", [{}])[0]) if sorted_msgs[0].get("file_id_mesgs") else {}

    # ---- 合并 activity ----
    base_activity = None
    for msgs in sorted_msgs:
        act = msgs.get("activity_mesgs", [])
        if act:
            base_activity = dict(act[0])
            break

    # ---- 合并 event ----
    base_events = []
    seen_events = set()
    for msgs in sorted_msgs:
        for ev in msgs.get("event_mesgs", []):
            # 用 (timestamp, event, event_type) 去重
            key = (ev.get("timestamp"), ev.get("event"), ev.get("event_type"))
            if key not in seen_events:
                seen_events.add(key)
                base_events.append(dict(ev))

    # ---- 合并 hrv ----
    base_hrv = []
    for msgs in sorted_msgs:
        hrv = msgs.get("hrv_mesgs", [])
        if hrv and not base_hrv:
            base_hrv = [dict(h) for h in hrv]
            break

    # ---- 构建合并后的 messages ----
    merged = {}
    if base_file_id:
        merged["file_id_mesgs"] = [base_file_id]
    if best_sport is not None:
        merged["sport_mesgs"] = [{"sport": best_sport, "sub_sport": best_sub_sport or "generic"}]
    merged["session_mesgs"] = [base_session]
    merged["lap_mesgs"] = base_laps
    merged["record_mesgs"] = base_records
    if all_devices:
        merged["device_info_mesgs"] = all_devices
    if base_events:
        merged["event_mesgs"] = base_events
    if base_activity:
        merged["activity_mesgs"] = [base_activity]
    if base_hrv:
        merged["hrv_mesgs"] = base_hrv

    return merged


def clean_mesg(mesg):
    """清理消息中的 NaN/Inf 值，编码器不支持这些"""
    import math
    cleaned = {}
    for key, val in mesg.items():
        if isinstance(val, float):
            if math.isnan(val) or math.isinf(val):
                continue
        cleaned[key] = val
    return cleaned


def write_fit(messages, output_path):
    """将 messages dict 写入 FIT 文件"""
    encoder = Encoder()

    for mesg_type in WRITE_ORDER:
        mesgs = messages.get(mesg_type, [])
        mesg_num = MESG_NUM.get(mesg_type)
        if mesg_num is None:
            continue
        for mesg in mesgs:
            mesg_copy = clean_mesg(mesg)
            mesg_copy["mesg_num"] = mesg_num
            try:
                encoder.write_mesg(mesg_copy)
            except (ValueError, TypeError) as e:
                # 跳过无法编码的消息，打印警告
                fname = os.path.basename(output_path)
                print(f"  [警告] 跳过消息 {mesg_type}: {e}")

    data = encoder.close()
    with open(output_path, "wb") as f:
        f.write(data)


def generate_filename(info):
    """根据活动信息生成标准文件名: {日期}-{时间}-{类型}.fit"""
    dt = info["start_date_local"]
    date_str = dt.strftime("%Y%m%d")
    time_str = dt.strftime("%H%M%S")
    sport_cn = SPORT_CN.get(info["detailed_sport"], info["detailed_sport"])
    return f"{date_str}-{time_str}-{sport_cn}.fit"


def main():
    dry_run = "--dry-run" in sys.argv

    if dry_run:
        print("*** DRY RUN 模式 - 不会实际删除或移动文件 ***")
        print()

    print("步骤 1: 扫描 FIT_raw 目录...")
    fit_files = []
    for root, dirs, files in os.walk(FIT_RAW_DIR):
        for f in files:
            if f.lower().endswith(".fit"):
                fit_files.append(os.path.join(root, f))

    print(f"  共找到 {len(fit_files)} 个 FIT 文件")

    print("\n步骤 2: 解析所有 FIT 文件...")
    file_data = []  # [(info, messages), ...]
    error_count = 0
    no_session_count = 0
    for i, fp in enumerate(fit_files):
        if (i + 1) % 500 == 0 or i == len(fit_files) - 1:
            print(f"  进度: {i + 1}/{len(fit_files)}")
        info, messages = parse_fit_full(fp)
        if info is None:
            no_session_count += 1
            continue
        if "error" in info:
            error_count += 1
            print(f"  [错误] {os.path.relpath(fp, FIT_RAW_DIR)}: {info['error']}")
            continue
        info["score"] = score_file(info)
        file_data.append((info, messages))

    print(f"  成功: {len(file_data)}, 无session: {no_session_count}, 错误: {error_count}")

    print("\n步骤 3: 按活动分组...")
    # 按 start_ts 分组，同一秒内距离差 < 100m 的视为同一活动
    by_start_ts = defaultdict(list)
    for info, messages in file_data:
        by_start_ts[info["start_ts"]].append((info, messages))

    # 在同一 start_ts 组内，按距离聚类
    dup_groups = []  # [[(info, messages), ...], ...]
    single_files = []  # [(info, messages), ...]
    for ts, group in by_start_ts.items():
        if len(group) == 1:
            single_files.append(group[0])
            continue

        # 按距离聚类
        sub_groups = []
        for item in group:
            matched = False
            for sg in sub_groups:
                if abs(sg[0][0]["distance"] - item[0]["distance"]) < 100:
                    sg.append(item)
                    matched = True
                    break
            if not matched:
                sub_groups.append([item])

        for sg in sub_groups:
            if len(sg) >= 2:
                dup_groups.append(sg)
            else:
                single_files.append(sg[0])

    print(f"  唯一活动: {len(single_files)} 个")
    print(f"  重复组: {len(dup_groups)} 组 (涉及 {sum(len(g) for g in dup_groups)} 个文件)")

    # ---- 输出重复名单 JSON ----
    dup_list_data = []
    for i, group in enumerate(dup_groups, 1):
        sorted_group = sorted(group, key=lambda x: x[0]["score"], reverse=True)
        best_info = sorted_group[0][0]
        entry = {
            "group_id": i,
            "start_time": best_info["start_date_local"].strftime("%Y-%m-%d %H:%M:%S"),
            "sport": best_info["detailed_sport"],
            "sport_cn": SPORT_CN.get(best_info["detailed_sport"], best_info["detailed_sport"]),
            "distance_km": round(best_info["distance"] / 1000, 3),
            "files": []
        }
        for info, messages in sorted_group:
            fname = os.path.basename(info["file_path"])
            subdir = os.path.basename(os.path.dirname(info["file_path"]))
            file_entry = {
                "filename": fname,
                "subdir": subdir,
                "record_count": info["record_count"],
                "lap_count": info["lap_count"],
                "has_garmin_device": info["has_garmin_device"],
                "distance_m": round(info["distance"], 1),
                "moving_time_sec": round(info["moving_time_sec"], 1),
                "avg_hr": info["avg_hr"],
                "elevation_gain_m": round(info["elevation_gain"], 1),
                "sport": info["sport"],
                "sub_sport": info["sub_sport"],
                "score": info["score"],
            }
            # 统计 session 字段数
            session = messages.get("session_mesgs", [{}])[0] if messages else {}
            file_entry["session_field_count"] = sum(1 for v in session.values() if v is not None and v != 0 and v != "")
            # 统计 record 中的字段类型
            records = messages.get("record_mesgs", []) if messages else []
            if records:
                sample = records[:min(10, len(records))]
                record_fields = set()
                for rec in sample:
                    record_fields.update(rec.keys())
                file_entry["record_fields"] = sorted(record_fields, key=str)
            else:
                file_entry["record_fields"] = []
            entry["files"].append(file_entry)
        dup_list_data.append(entry)

    dup_list_path = os.path.join(PROJECT_ROOT, "FIT_raw_dup_list.json")
    with open(dup_list_path, "w", encoding="utf-8") as f:
        json.dump(dup_list_data, f, ensure_ascii=False, indent=2)
    print(f"\n  重复名单已输出到: {os.path.basename(dup_list_path)}")

    print("\n步骤 4: 合并重复组并执行文件操作...")

    # 收集所有要保留的文件和要删除的文件
    keep_files = []  # (src_path_or_None, dest_filename, info, messages_or_None)
    delete_files = []

    # 处理唯一文件：直接移动
    for info, messages in single_files:
        keep_files.append((info["file_path"], generate_filename(info), info, None))

    # 处理重复组：合并数据后写入新文件
    merged_count = 0
    for group in dup_groups:
        sorted_group = sorted(group, key=lambda x: x[0]["score"], reverse=True)
        best_info = sorted_group[0][0]

        # 合并所有文件的 messages
        all_messages = [msgs for _, msgs in sorted_group]
        merged_messages = merge_messages(all_messages)

        dest_name = generate_filename(best_info)
        keep_files.append((None, dest_name, best_info, merged_messages))

        # 所有原始文件都删除
        for info, _ in sorted_group:
            delete_files.append(info["file_path"])

        merged_count += 1

    print(f"  唯一文件: {len(single_files)} 个")
    print(f"  合并组: {merged_count} 组 -> {merged_count} 个合并文件")
    print(f"  删除: {len(delete_files)} 个原始文件")

    # 检查目标文件名冲突
    name_count = defaultdict(list)
    for src, dest, info, msgs in keep_files:
        name_count[dest].append((src, info, msgs))

    conflicts = {k: v for k, v in name_count.items() if len(v) > 1}
    if conflicts:
        print(f"\n  [警告] 发现 {len(conflicts)} 个文件名冲突（不同活动但生成相同文件名）:")
        for name, items in conflicts.items():
            print(f"    {name}:")
            for src, info, msgs in items:
                print(f"      {os.path.relpath(src, FIT_RAW_DIR) if src else '合并'} (距离: {info['distance']:.0f}m, 记录点: {info['record_count']})")

        # 对冲突的文件名添加后缀区分
        resolved = {}
        for name, items in conflicts.items():
            for idx, (src, info, msgs) in enumerate(items):
                if idx == 0:
                    resolved[id(info)] = name
                else:
                    base = name.replace(".fit", "")
                    new_name = f"{base}-{int(info['distance'])}m.fit"
                    resolved[id(info)] = new_name

        # 更新 keep_files 中的文件名
        new_keep = []
        for src, dest, info, msgs in keep_files:
            if id(info) in resolved:
                dest = resolved[id(info)]
            new_keep.append((src, dest, info, msgs))
        keep_files = new_keep

    # 执行操作
    print("\n步骤 5: 执行文件操作...")

    moved_count = 0
    written_count = 0
    deleted_count = 0

    for src, dest, info, msgs in keep_files:
        dest_path = os.path.join(FIT_RAW_DIR, dest)

        # 处理目标已存在的情况
        if os.path.exists(dest_path) and (src is None or src != dest_path):
            base = dest.replace(".fit", "")
            idx = 2
            while os.path.exists(os.path.join(FIT_RAW_DIR, f"{base}_{idx}.fit")):
                idx += 1
            dest = f"{base}_{idx}.fit"
            dest_path = os.path.join(FIT_RAW_DIR, dest)

        if msgs is not None:
            # 合并后的新文件，需要写入
            if dry_run:
                print(f"  [写入合并] {dest} (合并自 {len([1 for _, _, _, m in keep_files if m is msgs])} 个文件)")
            else:
                write_fit(msgs, dest_path)
                written_count += 1
        elif src is not None:
            # 唯一文件，直接移动
            if src == dest_path:
                continue
            if dry_run:
                print(f"  [移动] {os.path.relpath(src, FIT_RAW_DIR)} -> {dest}")
            else:
                shutil.move(src, dest_path)
                moved_count += 1

    # 删除原始重复文件
    for fp in delete_files:
        if os.path.exists(fp):
            rel = os.path.relpath(fp, FIT_RAW_DIR)
            if dry_run:
                print(f"  [删除] {rel}")
            else:
                os.remove(fp)
                deleted_count += 1

    # 清理空的子目录
    if not dry_run:
        for subdir in ["coros", "garmin", "KEEP_merged", "KEEP_phone"]:
            subdir_path = os.path.join(FIT_RAW_DIR, subdir)
            if os.path.isdir(subdir_path):
                remaining = os.listdir(subdir_path)
                if not remaining:
                    os.rmdir(subdir_path)
                    print(f"  [清理] 删除空目录: {subdir}/")
                else:
                    print(f"  [保留] 目录 {subdir}/ 仍有 {len(remaining)} 个文件")

    # 输出重复组详情
    print("\n" + "=" * 80)
    print("重复组合并详情:")
    print("=" * 80)
    for i, group in enumerate(dup_groups, 1):
        sorted_group = sorted(group, key=lambda x: x[0]["score"], reverse=True)
        best_info = sorted_group[0][0]
        print(f"\n组 {i}: {best_info['start_date_local'].strftime('%Y-%m-%d %H:%M:%S')} | {SPORT_CN.get(best_info['detailed_sport'], best_info['detailed_sport'])} | {best_info['distance']/1000:.3f}km")
        for info, messages in sorted_group:
            fname = os.path.basename(info["file_path"])
            subdir = os.path.basename(os.path.dirname(info["file_path"]))
            session = messages.get("session_mesgs", [{}])[0] if messages else {}
            session_fields = sum(1 for v in session.values() if v is not None and v != 0 and v != "")
            records = messages.get("record_mesgs", []) if messages else []
            rec_fields = set()
            if records:
                for rec in records[:10]:
                    rec_fields.update(rec.keys())
            print(f"  {subdir}/{fname}")
            print(f"    记录:{info['record_count']}, Lap:{info['lap_count']}, Garmin:{info['has_garmin_device']}, 分数:{info['score']}")
            print(f"    session字段:{session_fields}, record字段:{sorted(rec_fields, key=str)}")

    if dry_run:
        print(f"\n*** DRY RUN 完成 - 未实际修改任何文件 ***")
    else:
        print(f"\n合并完成!")
        print(f"  移动: {moved_count} 个文件")
        print(f"  写入合并: {written_count} 个文件")
        print(f"  删除: {deleted_count} 个文件")
        print(f"  最终保留: {len(keep_files)} 个文件")


if __name__ == "__main__":
    main()
