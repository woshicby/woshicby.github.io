# 票据收藏页面实现计划

## Context

用户希望创建一个独立的票据收藏页面，展示各类票据（电影票、演出票、火车票、飞机票、门票等）的图片和信息。页面采用**方案A：时间线 + 类型筛选**布局。现有的 `movie-views.json` 数据（63部电影、72条观影记录、49条有图片）将整合到新的 `tickets.json` 中，实现统一数据源。

## 数据迁移

### 1. 创建 `JSON/tickets.json`

将 `movie-views.json` 的每条观影记录展开为独立的票据条目：

```json
[
  {
    "type": "movie",
    "title": "年会不能停2！",
    "date": "2026-08-02 20:40:00",
    "location": "万达影城(城阳万达广场IMAX店)",
    "hall": "2号-儿童厅",
    "seat": ["4排5座"],
    "price": null,
    "platform": "",
    "images": ["images/tickets/20260802_年会不能停2！_1.jpg"],
    "note": "",
    "refId": "36850814"
  }
]
```

转换规则：
- `type` 统一设为 `"movie"`
- `location` 取 `cinema` 字段
- `hall` 保留（电影票特有字段）
- `seat` 保持数组格式
- `images` 从 `ticketImage` 转换：逗号分隔字符串 → 数组；空字符串 → 空数组
- `refId` 取 `doubanId`
- 同一部电影的多次观影记录展开为多条独立票据

### 2. 图片目录迁移

`images/movie_tickets/` → `images/tickets/`，更新 `tickets.json` 中的路径。

### 3. 清理旧文件

迁移完成后删除：`JSON/movie-views.json`、`_movie_views_pending.md`、`_movie_views_export.md`

## 新建文件

### 1. `tickets.html`

参照 [reviews.html](file:///c:/工程文件/Git%20Repository/woshicby.github.io/reviews.html) 的结构：
- head 引用 `CSS/common.css`、`CSS/tickets.css`、`JS/background-lazy-load.js`、`JS/common.js`、`JS/tickets.js`
- body class: `tickets-page`
- header: `<h1>票据收藏</h1>` + 主题切换
- mainbox:
  - 类型筛选 tabs: `全部 | 🎬电影 | 🎭演出 | 🚄火车 | ✈️飞机 | 🎫门票 | 📦其他`
  - 搜索框
  - 统计信息（当前/总计）
  - 时间线列表区域 `#tickets-list`

### 2. `JS/tickets.js`

`TicketsManager` 继承 `FilterableListManager`（定义在 [common.js](file:///c:/工程文件/Git%20Repository/woshicby.github.io/JS/common.js)），复用搜索和 URL 参数管理。

核心方法：
- `loadData()` — 加载 `JSON/tickets.json`
- `applyFilters()` — 按类型 + 搜索关键词筛选，调用 `renderList()`
- `renderList(items)` — 按年份分组渲染时间线
- `createTicketElement(ticket)` — 创建单条票据 DOM（缩略图 + 日期 + 标题 + 关键信息）
- `openLightbox(images, index)` — 点击缩略图弹出全屏大图查看

时间线渲染结构：
```
2026 ─────────────
  │  [缩略图] 08-02  年会不能停2！  万达IMAX 4排5座
  │  [缩略图] 07-31  蜘蛛侠        万达IMAX 6排10座
2025 ─────────────
  │  ...
```

Lightbox 实现：全屏遮罩 + 居中大图 + 左右箭头切换 + ESC/点击关闭，支持多图浏览。

### 3. `CSS/tickets.css`

参照 [reviews.css](file:///c:/工程文件/Git%20Repository/woshicby.github.io/CSS/reviews.css) 的风格变量，定义：
- `.tickets-toolbar` — 工具栏（类型 tabs + 搜索框 + 统计）
- `.tickets-timeline` — 时间线容器
- `.timeline-year` — 年份分组（左侧年份标签 + 竖线 + 右侧条目）
- `.ticket-item` — 单条票据（flex 布局：缩略图 + 信息区）
- `.ticket-thumbnail` — 缩略图（80px 高，圆角，hover 放大）
- `.ticket-info` — 标题 + 元数据（影院/座位/票价等）
- `.lightbox-overlay` — 全屏大图遮罩
- `.lightbox-image` — 居中大图
- `.lightbox-nav` — 左右导航箭头
- 响应式：移动端缩略图缩小，年份标签变为顶部

## 修改文件

### `index.html`

在 [nav-cards 区域](file:///c:/工程文件/Git%20Repository/woshicby.github.io/index.html#L96-L128) 末尾添加导航卡片：

```html
<a href="./tickets.html" class="nav-card">
    <div class="nav-icon">🎫</div>
    <strong>票据收藏</strong>
    <p>留住每一次出发与赴约</p>
</a>
```

## 实现顺序

1. 用 Python 脚本将 `movie-views.json` 转换为 `tickets.json`（含图片路径更新）
2. 移动 `images/movie_tickets/` → `images/tickets/`
3. 创建 `tickets.html`
4. 创建 `CSS/tickets.css`
5. 创建 `JS/tickets.js`
6. 在 `index.html` 添加导航卡片
7. 删除旧文件（`movie-views.json`、`_movie_views_pending.md`、`_movie_views_export.md`）

## 验证

1. 本地打开 `tickets.html`，确认：
   - 72条电影票记录全部正确显示
   - 时间线按年份分组、日期倒序排列
   - 类型筛选"电影"显示全部，其他类型为空（暂无数据）
   - 搜索功能正常
   - 点击缩略图弹出大图 lightbox
   - 多图记录可左右切换
2. 打开 `index.html`，确认导航卡片存在且可跳转
3. 确认 `images/tickets/` 中 56 张图片路径正确加载
4. 确认 JSON 格式有效（`python -c "import json; json.load(...)"`）
