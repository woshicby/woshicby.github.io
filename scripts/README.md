# Scripts

本目录包含项目中使用的各类脚本工具，按功能分为子目录。

## 统一运行环境

所有 Python 脚本共用 `scripts/.venv-macos`(统一虚拟环境,不入 git):

```bash
# 首次创建:
scripts/.venv/bin/python -m venv scripts/.venv
scripts/.venv/bin/python -m pip install -r scripts/requirements.txt

# 统一入口(推荐):
./run.sh <脚本路径> [参数...]
# 例如:
./run.sh preview_server.py 8643
./run.sh sports-sync/sync_all.py --full
./run.sh fit/check_dup_runid.py
```

> `run.sh` 自动使用 `scripts/.venv-macos` 的 python,并把脚本所在目录加入 PYTHONPATH。
> `preview_server.py` 自动定位仓库根,从任何目录运行都能正确服务网站。
> 桌面快捷方式(`~/Desktop/*.command`)是指向 `scripts/shortcuts/` 的软链接,日常维护双击即可(运动同步/票据图片/网站预览)。

## 目录结构

```
scripts/
├── run.sh                  # 统一运行入口
├── .venv/                  # 统一虚拟环境(不入 git)
├── shortcuts/              # 桌面快捷方式本体(不入 git)
│   ├── 运动数据同步.command
│   ├── 票据图片更新.command
│   └── 网站预览.command
├── css/                    # CSS 样式工具
│   ├── unify_dark_hover_bg.py
│   └── unify_border_radius.py
├── fit/                    # FIT 文件处理工具
│   ├── check_dup_runid.py
│   ├── json_to_fit.py
│   ├── merge_fit_dup.py
│   └── merge_keep_fit.py
├── sports-sync/            # 运动数据同步工具
│   ├── config.py
│   ├── db.py
│   ├── detail_sync.py
│   ├── fit_sync.py
│   ├── fix_location.py
│   ├── gen_svg.py
│   ├── generator.py
│   ├── gpxtrackposter/
│   ├── polyline_processor.py
│   ├── sync_all.py
│   └── synced_data_file_logger.py
├── tickets/                # 票据收藏工具
│   ├── _merge_ticket.py
│   └── regen_ticket_images.py
├── _archive/               # 一次性脚本归档（已完成的临时任务）
│   ├── steam/              #   Steam 评论抓取与合并
│   ├── touken/             #   刀账图标下载
│   ├── tickets-import/     #   票据图片导入
│   ├── douban/             #   豆瓣 Excel 转换(convert-douban.py)
│   └── _check_empty.py     #   空值检查
├── preview_server.py       # 本地预览服务器（no-cache + Clear-Site-Data）
└── requirements.txt        # Python 依赖（全部脚本共用）
```

## 依赖安装

```bash
# 统一虚拟环境(推荐,所有脚本共用):
scripts/.venv/bin/python -m pip install -r scripts/requirements.txt
```

依赖包：arrow, colour, geopy, gpxpy, haversine, polyline, pytz, sqlalchemy, stravalib, svgwrite, garmin-fit-sdk
(gpxtrackposter 传递依赖 lxml/s2sphere/rich/tcxreader/timezonefinder 固定于 requirements)

---

## preview_server.py — 本地预览服务器

本地开发预览服务器（无需安装依赖，Python 自带 http.server）。

- **no-cache**：所有响应带 `Cache-Control: no-cache, no-store, must-revalidate`，刷新页面始终拿到最新文件
- **Clear-Site-Data**：响应带 `Clear-Site-Data: "cache"`，自动清除浏览器对该站点的旧缓存（解决 Safari 对 localhost 的顽固缓存）
- **守护模式**：直接前台运行，日志实时输出，Ctrl+C 即停止

```bash
python scripts/preview_server.py 8643   # 指定端口启动
```

桌面端「网站预览.command」双击即可自动启动服务器并打开浏览器。

---

## css/ — CSS 样式工具

### unify_border_radius.py

统一所有 CSS 文件中的 `border-radius` 为 `var(--border-radius-md)`。

```bash
python scripts/css/unify_border_radius.py
```

### unify_dark_hover_bg.py

统一夜间模式下所有悬停效果的 `background-color` 为 `var(--dark-primary-hover-bg-color)`。

```bash
python scripts/css/unify_dark_hover_bg.py
```

---

## fit/ — FIT 文件处理工具

这些脚本用于处理 Garmin FIT 格式的运动数据文件。

### check_dup_runid.py

扫描 FIT 目录中的文件，检测重复的 run_id（同一活动的多个文件）。

```bash
python scripts/fit/check_dup_runid.py
```

**读取**: `FIT/` 目录
**输出**: 控制台输出重复信息

### json_to_fit.py

将 Keep 运动数据（492728.json）转换为 FIT 文件格式。

```bash
python scripts/fit/json_to_fit.py
```

**读取**: `JSON/492728.json`
**输出**: `FIT_from_keep/` 目录

### merge_fit_dup.py

合并 FIT_raw 目录中属于同一活动的多个 FIT 文件，选择数据最丰富的版本并补充缺失字段。

```bash
python scripts/fit/merge_fit_dup.py              # 实际执行
python scripts/fit/merge_fit_dup.py --dry-run    # 仅预览，不修改文件
```

**读取**: `FIT_raw/` 目录
**输出**: `FIT_raw/`（合并后文件）、`FIT_raw_dup_list.json`（重复名单）

### merge_keep_fit.py

合并 FIT_keep 中的 FIT 文件与 Keep JSON 数据，生成包含最完整数据的新 FIT 文件。

```bash
python scripts/fit/merge_keep_fit.py
```

**读取**: `FIT_keep/` 目录、`JSON/492728.json`
**输出**: `FIT_merged/` 目录

---

## sports-sync/ — 运动数据同步工具

一体化运动数据同步系统，从 FIT 文件导入数据到 SQLite 数据库，进行逆地理编码，导出 JSON 和详情文件。

### sync_all.py（主入口）

完整的数据同步流程，包含四个步骤：

1. 扫描 FIT 目录，将新文件导入数据库
2. 对有轨迹的活动通过 Nominatim 获取详细地址
3. 从数据库导出 activities.json
4. 从 FIT 文件提取详细数据到 activities_detail/

```bash
python scripts/sports-sync/sync_all.py              # 增量同步
python scripts/sports-sync/sync_all.py --force-geo  # 强制重新获取地址
python scripts/sports-sync/sync_all.py --full       # 完整重建
```

**读取**: `FIT/` 目录、`data.db`
**输出**: `JSON/activities.json`、`activities_detail/`、`JSON/location_cache.json`

### fit_sync.py

从 FIT 目录读取文件，转换为 activities.json（简化版同步）。

```bash
python scripts/sports-sync/fit_sync.py
```

### detail_sync.py

从 FIT 文件提取详细运动数据（坐标、海拔、心率等），生成 activities_detail/RUN_ID.json。

```bash
python scripts/sports-sync/detail_sync.py
```

### fix_location.py

修复数据库中位置信息不完整的活动记录。

### gen_svg.py

根据运动数据生成 SVG 轨迹图。

### config.py

路径配置文件，定义 FIT 目录、JSON 文件、数据库等路径。其他脚本通过 `from config import` 引用。

### db.py

数据库模型定义（Activity 表）和操作函数，包含位置缓存和省份 GeoJSON 本地查询功能。

---

## tickets/ — 票据收藏工具

### regen_ticket_images.py

扫描 `images/tickets/` 目录，按文件名中的 `YYYYMMDD_标题` 分组，生成 `JSON/ticket-images.json` 映射文件。JS 端 (`tickets.js`) 运行时自动读取该映射，根据票据的 `date` + `title` 匹配对应图片。

```bash
python scripts/tickets/regen_ticket_images.py
```

**读取**: `images/tickets/` 目录
**输出**: `JSON/ticket-images.json`

**文件名格式**: `YYYYMMDD_电影名_序号_阶段.jpg`（如 `20260802_年会不能停2！_1_开场前.jpg`）

---

## _archive/ — 一次性脚本归档

以下脚本为已完成的一次性任务，归档保留以备参考。

### steam/ — Steam 评论相关

| 脚本 | 说明 |
|------|------|
| `_fetch_steam_reviews.py` | Steam 评论抓取 |
| `_merge_steam_reviews.py` | Steam 评论合并到 review-movies.json |
| `_verify_steam_merge.py` | 验证 Steam 合并结果 |
| `_fix_game_merge.py` | 修正 Steam 评价合并到 review-games.json |
| `_move_games_to_correct_file.py` | Steam 评价从 movies 移到 games |
| `_fix_montaro.py` | 修复 Montaro 重复问题 |
| `_steam_reviews.json` | Steam 评论原始数据 |

### touken/ — 刀账图标相关

| 脚本 | 说明 |
|------|------|
| `_download_touken_icons.py` | 从 biligame wiki 下载刀账图标 |
| `_fetch_touken_icons.py` | 从保存的 HTML 中提取并下载刀账图标 |

### tickets-import/ — 票据图片导入相关

| 脚本 | 说明 |
|------|------|
| `_get_movie_times.py` | 获取电影场次时间（用于匹配图片） |
| `_heic_converter.ps1` | HEIC 格式转换 |
| `_heic_exif.py` | HEIC EXIF 信息读取 |
| `_scan_heic.py` | 扫描 HEIC 文件匹配票据 |
| `_scan_photos.py` | 扫描照片文件匹配票据 |

### _check_empty.py

检查 movie-views.json 中的空值。

---

## convert-douban.py — 豆瓣数据转换工具

将豆瓣 Excel 导出文件转换为 JSON 格式,生成各分类的 review-*.json 文件。
存放于 `_archive/douban/`(一次性工具;新影评直接维护 JSON,一般不需要再转换)。

```bash
./run.sh _archive/douban/convert-douban.py
```

**读取**: `documents/豆伴(232919949).xlsx`
**输出**: `JSON/review-movies.json`、`JSON/review-games.json` 等

---

## 数据文件位置

所有数据文件位于项目根目录：

| 文件/目录 | 说明 |
|-----------|------|
| `FIT/` | Garmin FIT 运动数据文件 |
| `JSON/activities.json` | 运动活动汇总数据 |
| `JSON/492728.json` | Keep 运动数据 |
| `JSON/location_cache.json` | 逆地理编码缓存 |
| `JSON/china_provinces.json` | 中国省份 GeoJSON |
| `activities_detail/` | 活动详情 JSON 文件 |
| `data.db` | SQLite 数据库 |
| `imported.json` | 已导入文件记录 |
| `FIT_raw/` | 原始 FIT 文件（合并前） |
| `FIT_raw_dup_list.json` | 重复 FIT 文件名单 |
| `FIT_keep/` | Keep 来源的 FIT 文件 |
| `FIT_from_keep/` | 从 Keep JSON 生成的 FIT 文件 |
| `FIT_merged/` | 合并后的 FIT 文件 |
