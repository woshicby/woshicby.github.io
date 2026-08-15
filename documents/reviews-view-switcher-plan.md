# 书影音游剧记录页面 - 视图切换功能

## 背景

当前 reviews 页面（书影音游剧记录）所有评论卡片直接以瀑布流排列，没有时间分组。用户希望增加一种"时间轴+瀑布流"的视图样式（类似票据收藏页面的布局），按年/月分组后组内瀑布流排列，并能在两种视图间切换。

## 方案

在分类标签行（电影/书籍/音乐/游戏/剧场演出）右侧添加视图切换按钮，切换"列表视图"（当前样式）和"时间轴视图"（按年/月分组+组内瀑布流）。两种视图展示同一批数据，仅布局不同。

### 修改文件

#### 1. [reviews.html](file:///c:/工程文件/Git%20Repository/woshicby.github.io/reviews.html#L76-L82)

在 `.category-tabs` 的 div 内，最后一个 button 后面添加视图切换按钮组：

```html
<div class="view-switcher">
    <button class="view-tab active" data-view="list">📝 列表</button>
    <button class="view-tab" data-view="timeline">📅 时间轴</button>
</div>
```

用 flex 布局让 category-tabs 和 view-switcher 分居左右两端。

#### 2. [JS/reviews.js](file:///c:/工程文件/Git%20Repository/woshicby.github.io/JS/reviews.js)

**新增属性**（构造函数）：
- `this.currentView = 'list'` — 当前视图模式
- `this.masonryDestroys = []` — 多个瀑布流实例的销毁函数数组（时间轴视图每组一个）

**新增方法**：

- `bindViewSwitcher()` — 绑定视图切换按钮事件，调用 `switchView(view)`
- `switchView(view)` — 切换视图，更新按钮 active 状态，重新渲染当前数据
- `renderTimelineList(items)` — 时间轴渲染：
  - 按 `createdAt` 的年/月分组（与 tickets.js 的 renderList 逻辑一致）
  - 生成时间线 HTML（timeline-year > timeline-month > masonry容器）
  - 每个分组内调用 `MasonryLayout`，销毁函数存入 `masonryDestroys`
  - 复用 `createReviewElement(item)` 创建卡片
  - 调用 `bindReviewEvents()` 绑定事件

**修改方法**：

- `applyFilters()` — 渲染时根据 `this.currentView` 选择调用 `renderReviewsList` 或 `renderTimelineList`
- `renderReviewsList()` — 渲染前先销毁所有时间轴瀑布流实例（`this.masonryDestroys.forEach(d => d())`）

**关键代码模式**（参考 [tickets.js:120-185](file:///c:/工程文件/Git%20Repository/woshicby.github.io/JS/tickets.js#L120-L185) 的 renderList）：

```javascript
renderTimelineList(items) {
    const container = document.getElementById('reviews-list');
    // 销毁所有瀑布流实例
    if (this.masonryDestroy) this.masonryDestroy();
    this.masonryDestroys.forEach(d => { if (d) d(); });
    this.masonryDestroys = [];

    if (items.length === 0) {
        container.innerHTML = '<div class="no-reviews">没有找到相关记录</div>';
        return;
    }

    // 按年→月分组（依据 createdAt）
    const yearGroups = {};
    items.forEach(item => {
        const date = item.createdAt || '';
        const year = date.substring(0, 4) || '未知';
        const month = date.substring(5, 7) || '??';
        if (!yearGroups[year]) yearGroups[year] = {};
        if (!yearGroups[year][month]) yearGroups[year][month] = [];
        yearGroups[year][month].push(item);
    });

    // 生成时间线HTML + 每组瀑布流（同 tickets.js 逻辑）
    // ...
    // 每个分组：
    const elements = monthItems.map(item => this.createReviewElement(item));
    const destroy = MasonryLayout({
        container: masonryContainer,
        items: elements,
        columnMinWidth: 340,
        columnGap: 30
    });
    this.masonryDestroys.push(destroy);

    this.bindReviewEvents();
}
```

#### 3. [CSS/reviews.css](file:///c:/工程文件/Git%20Repository/woshicby.github.io/CSS/reviews.css)

添加以下样式：

- **视图切换按钮**：`.view-switcher` 样式（flex布局，与 category-tabs 同行，靠右对齐）
- **时间线结构**：参考 [tickets.css:116-234](file:///c:/工程文件/Git%20Repository/woshicby.github.io/CSS/tickets.css#L116-L234) 的时间线样式，添加：
  - `.reviews-page .tickets-timeline` — 时间线容器
  - `.reviews-page .timeline-year` / `.timeline-year-label` / `.timeline-year-text` / `.timeline-year-count` — 年份标题
  - `.reviews-page .timeline-month` / `.timeline-month-label` / `.timeline-month-text` / `.timeline-month-count` — 月份标题
  - `.reviews-page .timeline-masonry` — 瀑布流容器

category-tabs 布局调整：
```css
.reviews-page .category-tabs {
    display: flex;
    align-items: center;
    gap: var(--spacing-xs);
    flex-wrap: wrap;
}
.reviews-page .view-switcher {
    margin-left: auto;  /* 推到右侧 */
    display: flex;
    gap: var(--spacing-xs);
}
```

### 不涉及的内容

- 不修改评论卡片本身的样式和内容（`createReviewElement` 保持不变）
- 不修改数据加载逻辑
- 不修改筛选/搜索逻辑（两种视图共享同一套筛选）
- 不添加详情查看功能（评论卡片本身已有完整内容）

## 验证方式

1. 打开 reviews.html，分类标签行右侧应出现"📝 列表"和"📅 时间轴"两个按钮
2. 默认显示列表视图（当前样式），点击"时间轴"切换到按年/月分组+瀑布流布局
3. 切换分类（电影/书籍等）后，时间轴视图应按新分类数据重新分组渲染
4. 使用搜索/筛选后，时间轴视图应只显示匹配的记录
5. 切回列表视图时，时间轴的瀑布流实例应被正确销毁
