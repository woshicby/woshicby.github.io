# Scripts

本目录包含项目中使用的各类脚本工具，按功能分为三个子目录。

## 目录结构

```
scripts/
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
└── convert-douban.js       # 豆瓣数据转换工具
```

## 依赖安装

```bash
pip install -r requirements.txt
```

依赖包：arrow, colour, geopy, haversine, polyline, pytz, sqlalchemy, stravalib, svgwrite, garmin-fit-sdk

---

## css/ — CSS 样式工具

### unify_border_radius.py

统一所有 CSS 文件中的 `border-radius` 为 `var(--border-radius-md)`。

```bash
python scripts/css/unify_border_radius.py
```

### unify_dark_hover_bg.py

统一夜间模式下所有悬停效果的 `background-color` 为 `var(--dark-primary-hover-color)`。

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
