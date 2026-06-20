# FIT 数据同步工具

一体化同步脚本 `sync_all.py`，完成从 FIT 文件到数据库、JSON、详情导出的全流程。

## 同步流程

```
FIT/ → [步骤1] 导入数据库 → [步骤2] Nominatim 逆地理编码 → [步骤3] 导出 activities.json → [步骤4] 导出活动详情
```

### 步骤 1：导入 FIT 文件到数据库

- 扫描 `FIT/` 目录，解析每个 FIT 文件的 session 消息
- 提取运动类型（优先 sub_sport，否则 sport）、距离、时间、心率、海拔等
- 运动类型存储为中文（如"跑步"、"步行"、"徒步"等）
- 生成 polyline 轨迹编码
- 使用 `imported.json` 跟踪已导入文件，支持增量同步

### 步骤 2：Nominatim 逆地理编码

- 对有轨迹的活动，通过 Nominatim 获取最详细的中文地址
- 使用 0.01° 坐标网格去重，同一网格只查询一次
- 查询结果缓存到 `JSON/location_cache.json`
- 限速 1 次/秒（Nominatim 使用策略）

### 步骤 3：导出 activities.json

- 从数据库导出所有活动到 `JSON/activities.json`
- 供前端页面读取展示

### 步骤 4：导出活动详情

- 从 FIT 文件提取逐点数据（坐标、海拔、心率、速度等）
- 输出到 `activities_detail/{run_id}.json`

## 用法

```bash
# 增量同步（仅处理新 FIT 文件 + 未获取地址的活动）
python scripts/sync_all.py

# 强制重新获取所有有轨迹活动的地址
python scripts/sync_all.py --force-geo

# 完整重建（重新导入所有 FIT + 强制获取地址）
python scripts/sync_all.py --full
```

## 数据库结构

Activity 表字段：

| 字段 | 类型 | 说明 |
|------|------|------|
| run_id | Integer (PK) | 活动ID（基于开始时间的毫秒时间戳） |
| name | String | 活动名称 |
| distance | Float | 距离（米） |
| moving_time | Interval | 移动时间 |
| elapsed_time | Interval | 总时间 |
| type | String | 运动类型（中文，如"跑步"、"步行"） |
| subtype | String | 详细运动类型（英文，如"treadmill"、"trail"） |
| start_date | String | UTC 开始时间 |
| start_date_local | String | 本地开始时间（UTC+8） |
| location_country | String | 位置信息（Nominatim 格式） |
| summary_polyline | String | 轨迹 polyline 编码 |
| average_heartrate | Float | 平均心率 |
| average_speed | Float | 平均速度（米/秒） |
| elevation_gain | Float | 爬升（米） |

## 运动类型映射

运动类型优先使用 FIT 文件中的 `sub_sport` 字段（最详细级别），若为 generic 则回退到 `sport` 字段。所有类型存储为中文，映射表见 `scripts/sync_all.py` 中的 `SPORT_CN` 字典。

## 配置

路径配置在 `scripts/config.py` 中：

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| FIT_FOLDER | `../FIT` | FIT 文件目录 |
| JSON_FILE | `../JSON/activities.json` | 输出 JSON 路径 |
| SQL_FILE | `../data.db` | 数据库路径 |
| IMPORTED_FILE | `../imported.json` | 已导入记录路径 |

## 辅助脚本

| 脚本 | 用途 |
|------|------|
| `json_to_fit.py` | 将 Keep JSON 运动记录转换为 FIT 文件，设备标记为 Garmin 标准 |
| `merge_keep_fit.py` | 合并 Keep FIT 文件与 Keep JSON 数据，优先使用有实际数据的来源 |
| `fix_location.py` | 使用 Nominatim 将省份级位置升级到城市级别 |
| `gen_svg.py` | 从 activities.json 生成统计 SVG 图表 |
| `detail_sync.py` | 独立的详情同步脚本（已被 sync_all.py 步骤4取代） |
