"""
从 activities.json 生成统计 SVG 图表
基于 running_page 项目的 gpxtrackposter 模块
"""

import calendar
import datetime
import json
import math
import os
import sys
from collections import defaultdict

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import (
    JSON_FILE, ASSETS_DIR,
    SVG_SPECIAL_DISTANCE, SVG_SPECIAL_DISTANCE2, SVG_COLORS,
    INDOOR_SUBTYPES, POLYLINE_PRECISION,
    MARATHON_DISTANCE_M, HALF_MARATHON_DISTANCE_M, TEN_K_DISTANCE_M,
)

# 尝试导入 svgwrite，如果没有则提示安装
try:
    import svgwrite
except ImportError:
    print("请先安装 svgwrite: pip install svgwrite")
    sys.exit(1)

# 尝试导入 colour 用于颜色插值
try:
    from colour import Color
    HAS_COLOUR = True
except ImportError:
    HAS_COLOUR = False


def interpolate_color(color1, color2, ratio):
    """在两个颜色之间插值"""
    if ratio < 0:
        ratio = 0
    elif ratio > 1:
        ratio = 1
    if HAS_COLOUR:
        c1 = Color(color1)
        c2 = Color(color2)
        c3 = Color(
            hue=((1 - ratio) * c1.hue + ratio * c2.hue),
            saturation=((1 - ratio) * c1.saturation + ratio * c2.saturation),
            luminance=((1 - ratio) * c1.luminance + ratio * c2.luminance),
        )
        return c3.hex_l
    else:
        # 简单的 RGB 插值
        def hex_to_rgb(h):
            h = h.lstrip('#')
            return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))
        def rgb_to_hex(rgb):
            return '#{:02x}{:02x}{:02x}'.format(*rgb)
        rgb1 = hex_to_rgb(color1)
        rgb2 = hex_to_rgb(color2)
        rgb = tuple(int(rgb1[i] + (rgb2[i] - rgb1[i]) * ratio) for i in range(3))
        return rgb_to_hex(rgb)


def format_float(f):
    """格式化浮点数"""
    return f"{f:.1f}"


def decode_polyline(encoded):
    """解码 Google 编码的 polyline"""
    if not encoded:
        return []
    index = 0
    lat = 0
    lng = 0
    coordinates = []
    while index < len(encoded):
        byte = None
        shift = 0
        result = 0
        while True:
            byte = ord(encoded[index]) - 63
            index += 1
            result |= (byte & 0x1f) << shift
            shift += 5
            if byte < 0x20:
                break
        latitude_change = ~(result >> 1) if (result & 1) else (result >> 1)
        shift = result = 0
        while True:
            byte = ord(encoded[index]) - 63
            index += 1
            result |= (byte & 0x1f) << shift
            shift += 5
            if byte < 0x20:
                break
        longitude_change = ~(result >> 1) if (result & 1) else (result >> 1)
        lat += latitude_change
        lng += longitude_change
        coordinates.append((lat / POLYLINE_PRECISION, lng / POLYLINE_PRECISION))
    return coordinates


def load_activities(json_path):
    """从 activities.json 加载活动数据"""
    with open(json_path, 'r', encoding='utf-8') as f:
        return json.load(f)


def get_years(activities):
    """获取所有活动年份"""
    years = set()
    for a in activities:
        date_str = a.get('start_date_local', '')
        if date_str:
            years.add(int(date_str[:4]))
    return sorted(years)


def m2u(meters):
    """米转公里"""
    return 0.001 * meters


def u():
    """单位"""
    return "km"


# ============ GitHub 热力图 ============

def draw_github_svg(activities, output_path, year="all", colors=None, special_distance=None, special_distance2=None):
    """绘制 GitHub 风格的热力图 SVG"""
    if colors is None:
        colors = SVG_COLORS
    if special_distance is None:
        special_distance = SVG_SPECIAL_DISTANCE
    if special_distance2 is None:
        special_distance2 = SVG_SPECIAL_DISTANCE2

    empty_color = colors.get("empty", "#444444")

    # 按日期分组
    tracks_by_date = defaultdict(list)
    for a in activities:
        date_str = a.get('start_date_local', '')[:10]
        if date_str:
            tracks_by_date[date_str].append(a)

    # 按日期计算总距离
    length_by_date = {}
    for date, acts in tracks_by_date.items():
        length_by_date[date] = sum(a.get('distance', 0) for a in acts)

    # 计算距离范围
    lengths = list(length_by_date.values())
    if lengths:
        min_length = min(lengths)
        max_length = max(lengths)
    else:
        min_length = 0
        max_length = 0

    # 按年计算总距离
    total_length_year_dict = defaultdict(float)
    for a in activities:
        date_str = a.get('start_date_local', '')
        if date_str:
            y = int(date_str[:4])
            total_length_year_dict[y] += a.get('distance', 0)

    # 确定要绘制的年份
    if year == "all":
        all_years = get_years(activities)
    else:
        all_years = [int(year)]

    num_years = len(all_years)
    svg_width = 200
    year_size = 200 * 4.0 / 80.0
    svg_height = 55 + num_years * 43

    dr = svgwrite.Drawing(output_path, (f"{svg_width}mm", f"{svg_height}mm"))
    dr.viewbox(0, 0, svg_width, svg_height)
    dr.add(dr.rect((0, 0), (svg_width, svg_height), fill=colors["background"]))

    month_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
                   "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

    offset_y = 5.0
    for yr in reversed(all_years):
        year_length = m2u(total_length_year_dict.get(yr, 0))
        year_length_str = format_float(year_length)

        if year_length_str == "0.0":
            continue

        year_style = f"font-size:{year_size}px; font-family:Arial;"
        year_length_style = f"font-size:{110 * 3.0 / 80.0}px; font-family:Arial;"
        month_names_style = "font-size:2.5px; font-family:Arial"

        dr.add(dr.text(f"{yr}", insert=(10, offset_y), fill=colors["text"],
                       dominant_baseline="hanging", style=year_style))
        dr.add(dr.text(f"{year_length_str} {u()}", insert=(175, offset_y + 5),
                       fill=colors["text"], dominant_baseline="hanging",
                       style=year_length_style))

        for num, name in enumerate(month_names):
            dr.add(dr.text(name, insert=(10 + 15.5 * num, offset_y + 14),
                           fill=colors["text"], style=month_names_style))

        rect_x = 10.0
        dom = (2.6, 2.6)
        first_day_weekday = datetime.date(yr, 1, 1).weekday()
        github_rect_day = datetime.date(yr, 1, 1)

        for i in range(54):
            if i == 0:
                rect_y = offset_y + year_size + 2 + 3.5 * first_day_weekday
            else:
                first_day_weekday = 0
                rect_y = offset_y + year_size + 2

            for j in range(7 - first_day_weekday):
                if github_rect_day.year > yr:
                    break
                rect_y += 3.5
                color = empty_color
                date_title = str(github_rect_day)

                if date_title in tracks_by_date:
                    length = length_by_date[date_title]
                    dist_km = m2u(length)
                    has_special = special_distance < dist_km < special_distance2

                    if max_length > min_length:
                        ratio = (length - min_length) / (max_length - min_length)
                    else:
                        ratio = 0

                    if dist_km >= special_distance2:
                        color = colors.get("special2", colors.get("special"))
                    elif has_special:
                        color = colors.get("special")
                    else:
                        color = interpolate_color(
                            colors["track"], colors["track2"], ratio
                        )

                    str_length = format_float(dist_km)
                    date_title = f"{date_title} {str_length} {u()}"

                rect = dr.rect((rect_x, rect_y), dom, fill=color)
                rect.set_desc(title=date_title)
                dr.add(rect)
                github_rect_day += datetime.timedelta(1)
            rect_x += 3.5

        offset_y += 3.5 * 9 + year_size + 1.0

    dr.save()
    print(f"GitHub SVG saved: {output_path}")


# ============ Grid 路线图 ============

def draw_grid_svg(activities, output_path, year="all", colors=None, special_distance=None, special_distance2=None):
    """绘制 Grid 风格的路线缩略图 SVG"""
    if colors is None:
        colors = SVG_COLORS
    if special_distance is None:
        special_distance = SVG_SPECIAL_DISTANCE
    if special_distance2 is None:
        special_distance2 = SVG_SPECIAL_DISTANCE2

    # 过滤活动
    if year != "all":
        filtered = [a for a in activities if a.get('start_date_local', '')[:4] == str(year)]
    else:
        filtered = activities

    # 只保留有路线数据的活动
    tracks_with_polyline = []
    for a in filtered:
        if a.get('summary_polyline'):
            coords = decode_polyline(a['summary_polyline'])
            if len(coords) >= 2:
                tracks_with_polyline.append((a, coords))

    if not tracks_with_polyline:
        print(f"No tracks with polyline data for grid SVG")
        return

    # 计算网格
    count = len(tracks_with_polyline)
    svg_width = 200
    svg_height = 300

    # 计算网格布局
    best_size = None
    best_counts = None
    min_waste = -1.0
    for cx in range(1, count + 1):
        sx = svg_width / cx
        for cy in range(1, count + 1):
            if cx * cy >= count:
                sy = svg_height / cy
                size = min(sx, sy)
                waste = svg_width * svg_height - count * size * size
                if waste < 0:
                    continue
                elif best_size is None or waste < min_waste:
                    best_size = size
                    best_counts = (cx, cy)
                    min_waste = waste

    if best_size is None:
        print("Unable to compute grid layout")
        return

    count_x, count_y = best_counts
    cell_size = best_size * 0.9
    spacing_x = 0 if count_x <= 1 else (svg_width - best_size * count_x) / (count_x - 1)
    spacing_y = 0 if count_y <= 1 else (svg_height - best_size * count_y) / (count_y - 1)

    dr = svgwrite.Drawing(output_path, (f"{svg_width}mm", f"{svg_height}mm"))
    dr.viewbox(0, 0, svg_width, svg_height)
    dr.add(dr.rect((0, 0), (svg_width, svg_height), fill=colors["background"]))

    # 距离范围
    distances = [a.get('distance', 0) for a, _ in tracks_with_polyline]
    min_dist = min(distances) if distances else 0
    max_dist = max(distances) if distances else 0

    for index, (activity, coords) in enumerate(reversed(tracks_with_polyline)):
        px = (index % count_x) * (best_size + spacing_x)
        py = (index // count_x) * (best_size + spacing_y)
        offset_x = px + best_size * 0.05
        offset_y = py + best_size * 0.05
        draw_size = cell_size

        # 计算颜色
        length = activity.get('distance', 0)
        dist_km = m2u(length)
        has_special = special_distance < dist_km < special_distance2

        if max_dist > min_dist:
            ratio = (length - min_dist) / (max_dist - min_dist)
        else:
            ratio = 0

        if dist_km >= special_distance2:
            color = colors.get("special2", colors.get("special"))
        elif has_special:
            color = colors.get("special")
        else:
            color = interpolate_color(colors["track"], colors["track2"], ratio)

        # 投影路线到单元格
        lats = [c[0] for c in coords]
        lngs = [c[1] for c in coords]
        min_lat, max_lat = min(lats), max(lats)
        min_lng, max_lng = min(lngs), max(lngs)

        d_lat = max_lat - min_lat if max_lat != min_lat else 1
        d_lng = max_lng - min_lng if max_lng != min_lng else 1

        # 保持宽高比
        scale = draw_size / max(d_lat, d_lng) * 0.9

        points = []
        for lat, lng in coords:
            x = offset_x + (lng - min_lng) / d_lng * draw_size * 0.9 + draw_size * 0.05
            y = offset_y + draw_size - (lat - min_lat) / d_lat * draw_size * 0.9 - draw_size * 0.05
            points.append((x, y))

        if len(points) >= 2:
            date_str = activity.get('start_date_local', '')[:10]
            str_length = format_float(dist_km)
            date_title = f"{date_str} {str_length}{u()}"

            is_indoor = activity.get('subtype') in INDOOR_SUBTYPES
            polyline = dr.polyline(
                points=points,
                stroke=color,
                fill="none",
                stroke_width=0.5,
                stroke_linejoin="round",
                stroke_linecap="round",
                stroke_dasharray="1,0.5" if is_indoor else "none",
                opacity=0.5 if is_indoor else 1,
            )
            polyline.set_desc(title=date_title, desc=str(activity.get('run_id', '')))
            dr.add(polyline)

    dr.save()
    print(f"Grid SVG saved: {output_path}")


# ============ Year Summary 年度总结 ============

def draw_year_summary_svg(activities, output_path, year, colors=None, special_distance=None, special_distance2=None):
    """绘制年度总结 SVG"""
    if colors is None:
        colors = SVG_COLORS
    if special_distance is None:
        special_distance = SVG_SPECIAL_DISTANCE
    if special_distance2 is None:
        special_distance2 = SVG_SPECIAL_DISTANCE2

    dim_color = colors.get("dim", "#555555")
    text_color = colors.get("text", "#FFFFFF")
    track_color = colors.get("track", "#4DD2FF")
    special_color = colors.get("special", "#f7d02c")

    # 过滤该年份活动
    year_tracks = [a for a in activities if a.get('start_date_local', '')[:4] == str(year)]
    if not year_tracks:
        print(f"No activities for year {year}")
        return

    # 计算统计
    total_runs = len(year_tracks)
    total_distance_m = sum(a.get('distance', 0) for a in year_tracks)
    total_distance_km = m2u(total_distance_m)

    # 计算总时间
    total_time_s = 0
    for a in year_tracks:
        moving_time = a.get('moving_time', '')
        if moving_time:
            parts = moving_time.split(':')
            if len(parts) == 3:
                total_time_s += int(parts[0]) * 3600 + int(parts[1]) * 60 + int(parts[2])
            elif len(parts) == 2:
                total_time_s += int(parts[0]) * 60 + int(parts[1])

    # 计算配速
    avg_pace = "0'00\""
    if total_distance_m > 0 and total_time_s > 0:
        pace_s_per_km = total_time_s / total_distance_km
        pace_min = int(pace_s_per_km // 60)
        pace_sec = int(pace_s_per_km % 60)
        avg_pace = f"{pace_min}'{pace_sec:02d}\""

    # 计算最长跑步
    longest_run_km = m2u(max(a.get('distance', 0) for a in year_tracks))

    # 计算连续跑步天数
    dates = sorted(set(a.get('start_date_local', '')[:10] for a in year_tracks))
    max_streak = 1
    current_streak = 1
    for i in range(1, len(dates)):
        d1 = datetime.datetime.strptime(dates[i-1], "%Y-%m-%d").date()
        d2 = datetime.datetime.strptime(dates[i], "%Y-%m-%d").date()
        if (d2 - d1).days == 1:
            current_streak += 1
            max_streak = max(max_streak, current_streak)
        else:
            current_streak = 1

    # 计算马拉松/半马/10K次数
    marathon_count = sum(1 for a in year_tracks if a.get('distance', 0) >= MARATHON_DISTANCE_M)
    half_marathon_count = sum(1 for a in year_tracks if HALF_MARATHON_DISTANCE_M <= a.get('distance', 0) < MARATHON_DISTANCE_M)
    ten_k_count = sum(1 for a in year_tracks if TEN_K_DISTANCE_M <= a.get('distance', 0) < HALF_MARATHON_DISTANCE_M)

    total_hours = int(total_time_s // 3600)

    # SVG 布局
    svg_width = 200
    svg_height = 300

    dr = svgwrite.Drawing(output_path, (f"{svg_width}mm", f"{svg_height}mm"))
    dr.viewbox(0, 0, svg_width, svg_height)
    dr.add(dr.rect((0, 0), (svg_width, svg_height), fill=colors["background"]))

    left_margin = 11
    left_width = svg_width * 0.40
    right_section_start = left_width

    # 计算首次跑步日期
    all_dates = [a.get('start_date_local', '')[:10] for a in activities if a.get('start_date_local')]
    if all_dates:
        first_run = min(all_dates)
        first_run_date = datetime.datetime.strptime(first_run, "%Y-%m-%d")
        days_ago = (datetime.datetime.now() - first_run_date).days
        header_text = f"Running for {days_ago} Days"
    else:
        header_text = f"Year {year}"

    dr.add(dr.text(header_text, insert=(left_margin, 19), fill=dim_color,
                   style="font-size:6px; font-family:Arial;"))

    # Race categories
    dr.add(dr.text("Races", insert=(left_margin, 39), fill=dim_color,
                   style="font-size:6px; font-family:Arial;"))

    race_categories = [
        ("Full", marathon_count),
        ("Half", half_marathon_count),
        ("10K", ten_k_count),
    ]

    y_pos = 59
    race_num = 1
    race_count = 0
    for name, count in race_categories:
        if count > 0:
            dr.add(dr.text(str(race_num), insert=(left_margin, y_pos), fill=dim_color,
                           style="font-size:8px; font-family:Arial;"))
            dr.add(dr.text(name, insert=(left_margin + 12, y_pos), fill=text_color,
                           style="font-size:10px; font-family:Arial; font-weight:bold;"))
            dr.add(dr.text(f"{count}x", insert=(left_margin + 38, y_pos), fill=dim_color,
                           style="font-size:6px; font-family:Arial;"))
            y_pos += 18
            race_num += 1
            race_count += 1

    # Stats
    if race_count == 0:
        stats_start_y = 77
    else:
        stats_start_y = 59 + race_count * 18 + 26

    dr.add(dr.text("Stats", insert=(left_margin, stats_start_y - 6), fill=dim_color,
                   style="font-size:6px; font-family:Arial;"))

    stat_items = [
        ("Distance", f"{int(total_distance_km)}", u()),
        ("Runs", f"{total_runs}", ""),
        ("Avg Pace", avg_pace, ""),
        ("Streak", f"{max_streak}", "d"),
        ("Time", f"{total_hours}", "h"),
        ("Longest", f"{longest_run_km:.1f}", ""),
    ]

    col1_x = left_margin
    col2_x = left_margin + 42

    for i, (label, value, unit) in enumerate(stat_items):
        x = col1_x if i % 2 == 0 else col2_x
        y = stats_start_y + (i // 2) * 28

        dr.add(dr.text(label, insert=(x, y), fill=dim_color,
                       style="font-size:5px; font-family:Arial;"))
        dr.add(dr.text(value, insert=(x, y + 11), fill=text_color,
                       style="font-size:10px; font-family:Arial; font-weight:bold;"))
        if unit:
            value_width = len(value) * 6
            dr.add(dr.text(unit, insert=(x + value_width, y + 11), fill=dim_color,
                           style="font-size:6px; font-family:Arial;"))

    # 按月按日分组
    month_data = defaultdict(lambda: defaultdict(float))
    for a in year_tracks:
        date_str = a.get('start_date_local', '')
        if date_str:
            parts = date_str[:10].split('-')
            month = int(parts[1])
            day = int(parts[2])
            month_data[month][day] += m2u(a.get('distance', 0))

    # 绘制月度点阵
    x_start = right_section_start
    y_start = 13
    width = svg_width - right_section_start - 8
    height = svg_height - 26

    cols = 12
    rows = 31
    spacing_x = width / cols
    spacing_y = height / rows
    radius = min(spacing_x, spacing_y) / 2 * 0.75

    max_dist = 1
    for month_days in month_data.values():
        for dist in month_days.values():
            max_dist = max(max_dist, dist)

    for month in range(1, 13):
        for day in range(1, 32):
            try:
                datetime.date(year, month, day)
            except ValueError:
                continue

            cx = x_start + (month - 1) * spacing_x + spacing_x / 2
            cy = y_start + (day - 1) * spacing_y + spacing_y / 2

            dist = month_data[month].get(day, 0)

            if dist > 0:
                if dist >= special_distance:
                    color = special_color
                else:
                    intensity = min(dist / special_distance, 1.0)
                    color = interpolate_color(dim_color, track_color, intensity)
            else:
                color = dim_color

            circle = dr.circle(center=(cx, cy), r=radius, fill=color)
            title = f"{year}-{month:02d}-{day:02d}"
            if dist > 0:
                title += f": {int(dist) if dist >= 1 else round(dist, 1)} {u()}"
            circle.set_desc(title=title)
            dr.add(circle)

    # Footer
    dr.add(dr.text(f"running_page/{year}", insert=(left_margin, svg_height - 5),
                   fill=dim_color, style="font-size:7px; font-family:Arial;"))

    dr.save()
    print(f"Year summary SVG saved: {output_path}")


def main():
    """主函数：从 activities.json 生成所有 SVG"""
    # 确定路径
    json_path = JSON_FILE
    assets_dir = ASSETS_DIR

    # 确保 assets 目录存在
    os.makedirs(assets_dir, exist_ok=True)

    # 加载数据
    if not os.path.exists(json_path):
        print(f"activities.json not found: {json_path}")
        sys.exit(1)

    activities = load_activities(json_path)
    print(f"Loaded {len(activities)} activities")

    if not activities:
        print("No activities to generate SVGs")
        return

    # 生成 GitHub 热力图（全部年份）
    github_path = os.path.join(assets_dir, 'github.svg')
    draw_github_svg(activities, github_path, year="all")

    # 生成 Grid 路线图（全部年份）
    grid_path = os.path.join(assets_dir, 'grid.svg')
    draw_grid_svg(activities, grid_path, year="all")

    # 为每个年份生成 GitHub SVG
    years = get_years(activities)
    for yr in years:
        year_github_path = os.path.join(assets_dir, f'github_{yr}.svg')
        draw_github_svg(activities, year_github_path, year=yr)

    # 为每个年份生成年度总结
    for yr in years:
        year_summary_path = os.path.join(assets_dir, f'year_summary_{yr}.svg')
        draw_year_summary_svg(activities, year_summary_path, year=yr)

    print(f"\nAll SVGs generated in {assets_dir}")
    print(f"Total: github.svg, grid.svg, {len(years)} year github SVGs, {len(years)} year summary SVGs")


if __name__ == "__main__":
    main()
