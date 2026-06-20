# Running Page

个人运动数据可视化页面，基于 Garmin FIT 文件和 Keep 运动记录，展示运动轨迹、统计图表和详情。

## 目录结构

```
running_page/
├── FIT/                    # FIT 运动数据文件（核心数据源）
├── JSON/                   # 数据 JSON 文件
│   ├── activities.json     #   运动活动汇总（由脚本生成）
│   ├── location_cache.json #   Nominatim 逆地理编码缓存
│   ├── china_provinces.json#   中国省份地理数据
│   ├── china_cities.json   #   中国城市地理数据
│   ├── city_data.json      #   城市数据
│   └── world.zh.json       #   世界国家地理数据（中文）
├── activities_detail/      # 运动详情 JSON（由脚本生成）
├── CSS/                    # 样式文件
│   ├── common.css          #   公共样式
│   ├── home.css            #   首页样式
│   ├── activity.css        #   详情页样式
│   ├── active.css          #   活跃统计图样式
│   └── volume.css          #   运动量统计页样式
├── JS/                     # 前端 JavaScript
│   ├── common.js           #   共享代码（数据加载、地图、主题）
│   ├── home.js             #   首页（地图、路线动画、统计）
│   ├── activity.js         #   详情页（轨迹、图表）
│   ├── active.js           #   活跃统计图（GitHub 热力图）
│   └── volume.js           #   运动量统计（柱状图）
├── scripts/                # Python 脚本
├── index.html              # 首页
├── activity.html           # 运动详情页
├── summary-active.html     # 活跃统计图页
├── summary-volume.html     # 运动量统计页
├── data.db                 # SQLite 数据库（自动生成，.gitignore）
├── imported.json           # 已导入文件记录（自动生成，.gitignore）
└── requirements.txt        # Python 依赖
```

## 页面说明

| 页面 | 功能 |
|------|------|
| **首页** (`index.html`) | 地图展示所有运动轨迹、路线动画、城市/省份/国家统计、运动类型统计、年度统计卡片 |
| **详情页** (`activity.html`) | 单次运动的轨迹地图、海拔/心率/配速图表、运动数据面板 |
| **活跃统计图** (`summary-active.html`) | 类 GitHub 热力图的运动活跃统计度展示，支持按运动类型筛选 |
| **运动量统计** (`summary-volume.html`) | 按月/年/周统计运动量统计柱状图，支持按运动类型筛选 |

## 快速开始

### 1. 安装依赖

```bash
pip install -r requirements.txt
```

需要额外安装 Garmin FIT SDK（用于解析 FIT 文件）：

```bash
pip install garmin-fit-sdk
```

### 2. 放置 FIT 文件

将 FIT 文件放到 `FIT/` 目录中。

### 3. 同步数据

```bash
# 增量同步（仅处理新文件）
python scripts/sync_all.py

# 强制重新获取所有地址
python scripts/sync_all.py --force-geo

# 完整重建（重新导入所有 FIT + 强制获取地址）
python scripts/sync_all.py --full
```

### 4. 查看页面

用浏览器打开 `index.html` 即可。

## 数据流

```
FIT/ (原始运动文件)
  │
  ├── [sync_all.py] ── 解析 FIT，导入数据库
  │
  ├──> data.db (SQLite 数据库)
  │      │
  │      ├──> JSON/activities.json (前端数据源)
  │      │
  │      └──> activities_detail/*.json (运动详情)
  │
  └──> imported.json (已导入记录)

前端页面读取 JSON/activities.json + activities_detail/*.json + JSON/*.json
```

## 运动类型

运动类型根据 FIT 文件中的 sub_sport 字段确定（最详细级别），显示中文名：

| 类型 | 中文 | 说明 |
|------|------|------|
| running | 跑步 | 户外跑步 |
| treadmill | 跑步机 | 跑步机跑步 |
| trail | 越野跑 | 越野跑 |
| walking | 步行 | 户外步行 |
| hiking | 徒步 | 徒步 |
| cycling | 骑行 | 户外骑行 |
| road | 公路骑行 | 公路骑行 |
| indoor_cycling | 室内骑行 | 室内骑行 |
| commuting | 通勤骑行 | 通勤骑行 |
| strength_training | 力量训练 | 力量训练 |
| cardio_training | 有氧训练 | 有氧训练 |
| yoga | 瑜伽 | 瑜伽 |
| elliptical | 椭圆机 | 椭圆机 |
| bouldering | 抱石 | 抱石 |
| ... | ... | 更多类型见 sync_all.py |

## 辅助脚本

| 脚本 | 用途 |
|------|------|
| `json_to_fit.py` | 将 Keep JSON 运动记录转换为 FIT 文件 |
| `merge_keep_fit.py` | 合并 Keep FIT 文件与 Keep JSON 数据 |

## 技术栈

- **前端**：纯 HTML/CSS/JavaScript，Mapbox GL JS 地图，Chart.js 图表
- **后端**：Python 3，SQLAlchemy，garmin-fit-sdk
- **地理编码**：Nominatim（OpenStreetMap），带坐标网格缓存
- **数据格式**：Garmin FIT → SQLite → JSON
