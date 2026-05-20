# woshicby.github.io

## 语言切换 / Language Switch / 言語切り替え

[![中文](https://img.shields.io/badge/中文-Chinese-red)](#chinese)
[![English](https://img.shields.io/badge/English-%E8%8B%B1%E6%96%87-blue)](#english)
[![日本語](https://img.shields.io/badge/日本語-Japanese-green)](#japanese)

> **注意：英文和日语版本内容由AI生成，可能存在翻译误差，请以中文版本为准。**
> 
> **Note: English and Japanese versions are AI-generated and may contain translation errors. Please refer to the Chinese version for accuracy.**
> 
> **注意：英語版と日本語版はAIによって生成されており、翻訳エラーが含まれている可能性があります。正確性については、中国語版を参照してください。**

---

## <a id="chinese"></a>中文版本

个人网站项目 - 用于展示和实践Web前端开发技能

## 项目概述

这是一个基于HTML、CSS和JavaScript构建的个人网站，旨在展示前端开发能力并提供多个实用工具和功能页面。网站采用响应式设计，适配不同屏幕尺寸，提供良好的用户体验。

## 主要功能

### 1. 计算器工具
- **配速计算器** (pace-calculator.html): 用于跑步和运动的配速计算工具
- **时间计算器** (time-calculator.html): 时间间隔计算工具
- **生命灵数计算器** (life-path-calculator.html): 基于生日的灵数计算与解读工具

### 2. 游戏相关
- **刀剑乱舞锻刀模拟器** (touken-forge.html): 模拟游戏中的锻刀系统
- **多文明演化模拟器** (civilization-evolution.html): 自动模拟多个文明的发展历程，展示文明间的交流、冲突与兴衰
- **武林外传接台词游戏** (wulin-quotes.html): 武林外传台词猜测游戏，支持多难度模式和台词查询

### 3. 媒体展示
- **视频播放器** (video.html): 视频内容展示和播放
- **灵感碎片** (moments.html): 记录文字、图片、音频、视频等多种形式的灵感碎片，支持Markdown渲染和标签筛选

### 4. 体育相关
- **跑步记录** (sports.html): 展示个人跑步记录，支持赛季最佳(SB)和个人最佳(PB)标记，可折叠的赛季记录展示，完赛证书采用多列瀑布流布局展示，支持在certification字段添加"不计入PB/SB"标签排除特定赛事，比赛记录中显示比赛类型，越野跑支持raceScore和ITRA表现指数
- **成绩变化对比** (sports.html): 支持同一项目成绩变化对比和同一赛事成绩变化对比，显示全部平均成绩、最佳成绩、最差成绩、变化趋势和上次参赛天数
- **赛事日历** (sports.html): 展示不同类型的跑步比赛，支持按月/年切换视图，过去赛事显示成绩，未来赛事显示起跑时间，鼠标悬停显示详情提示框，包含赛事类型图例，支持待抽签赛事分区展示与出签日期显示

### 5. 学习资源
- **学习页面** (study.html): 学习资料和笔记，支持动态加载与筛选

### 6. 博客/文章
- **文章列表** (posts.html): 博客文章列表展示，支持系列分类、时间线归档视图、无限滚动加载
- **文章详情** (post-detail.html): 文章详细内容展示，支持Markdown格式

### 7. 实用工具
- **工具集** (tools.html): 各种实用小工具集合
- **样式比较器** (style-comparison.html): 样式对比工具
- **Markdown转换工具** (convert-md-to-json.html): 将Markdown文件转换为JSON格式
- **SEO元数据检查器** (seo-checker.html): 检查网页SEO元数据
- **随机决策器** (random-decision.html): 随机选择决策工具
- **骰子工具** (dice-tool.html): 虚拟骰子投掷工具
- **本地大模型API对话** (local-llm-api-chat.html): 与LM Studio等本地大模型服务交互

### 8. 技术功能
- **MathJax支持**: 数学公式渲染
- **代码高亮**: 支持代码语法高亮显示

## 技术栈

- **HTML5**: 页面结构和语义化标记
- **CSS3**: 样式和响应式设计
- **JavaScript**: 交互功能和动态内容
- **响应式设计**: 适配移动设备和桌面设备
- **外部API**: 集成B站API等第三方服务
- **主题切换**: 支持深色/浅色模式切换功能
- **Markdown支持**: 文章内容的Markdown格式渲染
- **MathJax**: 数学公式渲染
- **代码高亮**: highlight.js实现代码语法高亮

## 项目结构

```
woshicby.github.io/
├── CSS/             # 样式文件目录
│   ├── common/      # 公共样式子目录（深色主题、响应式、选择器）
│   ├── index/       # 首页样式子目录（深色主题、响应式、选择器）
│   ├── calendar.css       # 赛事日历样式
│   ├── charts.css         # 成绩图表样式
│   ├── civilization-evolution.css  # 多文明演化模拟器样式
│   ├── common.css         # 公共样式
│   ├── convert-md-to-json.css  # Markdown转换工具样式
│   ├── dice-tool.css      # 骰子工具样式
│   ├── github.min.css     # GitHub风格代码高亮样式
│   ├── index.css          # 首页样式
│   ├── life-path-calculator.css  # 生命灵数计算器样式
│   ├── local-llm-api-chat.css    # 本地大模型对话样式
│   ├── moments.css        # 灵感碎片样式
│   ├── pace-calculator.css  # 配速计算器样式
│   ├── post-detail.css    # 文章详情样式
│   ├── posts.css          # 文章列表样式
│   ├── random-decision.css  # 随机决策器样式
│   ├── seo-checker.css    # SEO检查器样式
│   ├── sports.css         # 跑步记录样式
│   ├── study.css          # 学习页面样式
│   ├── style-comparison.css  # 样式比较器样式
│   ├── time-calculator.css  # 时间计算器样式
│   ├── tools-common.css   # 工具公共样式
│   ├── tools.css          # 工具集样式
│   ├── touken-forge.css   # 刀剑乱舞样式
│   ├── video.css          # 视频播放器样式
│   └── wulin-quotes.css   # 武林外传样式
├── JS/              # JavaScript文件目录
│   ├── MathJax-3.2.2es5/  # MathJax数学公式库
│   ├── civilization-evolution/  # 多文明演化模拟器
│   │   ├── civilization.js
│   │   ├── main.js
│   │   ├── map.js
│   │   ├── simulator.js
│   │   ├── tech-tree.json
│   │   └── ui.js
│   ├── markdown/     # Markdown相关功能
│   │   ├── markdown-it.min.js
│   │   ├── markdown-it-footnote.min.js
│   │   ├── markdown-it-mark.min.js
│   │   ├── markdown-it-sub.min.js
│   │   ├── markdown-it-sup.min.js
│   │   └── markdown-utils.js  # Markdown解析共享工具
│   ├── background-lazy-load.js  # 背景图懒加载
│   ├── bilibili-api.js    # B站API
│   ├── calendar.js        # 赛事日历功能
│   ├── charts.js          # 成绩图表功能
│   ├── convert-md-to-json.js  # Markdown转换工具
│   ├── dice-tool.js       # 骰子工具
│   ├── highlight.min.js   # 代码高亮
│   ├── life-path-calculator.js  # 生命灵数计算器
│   ├── local-llm-api-chat.js    # 本地大模型对话
│   ├── moments.js         # 灵感碎片
│   ├── navigation.js      # 导航功能
│   ├── pace-calculator.js # 配速计算器
│   ├── post-detail.js     # 文章详情功能
│   ├── posts.js           # 文章列表功能
│   ├── random-decision.js # 随机决策器
│   ├── seo-checker.js     # SEO检查器
│   ├── sports.js          # 跑步记录功能
│   ├── study.js           # 学习页面功能
│   ├── theme-toggle.js    # 主题切换
│   ├── time-calculator.js # 时间计算器
│   ├── tool-tabs.js       # 工具页标签导航
│   ├── tools.js           # 工具集
│   ├── touken-forge.js    # 刀剑乱舞
│   └── wulin-quotes.js    # 武林外传
├── JSON/              # JSON数据文件目录
│   ├── games.json        # 游戏数据
│   ├── moments.json      # 灵感碎片数据
│   ├── posts.json        # 博客文章数据（已废弃，向后兼容）
│   ├── posts-list.json   # 博客文章列表配置文件
│   ├── posts-series.json # 博客系列配置文件
│   ├── race-records.json # 跑步记录数据
│   ├── seo-pages.json    # SEO页面配置
│   ├── study-data.json   # 学习页面数据
│   └── tools.json        # 工具数据
├── posts/           # 博客文章目录
│   └── *.md        # Markdown格式博文
├── images/          # 图片资源目录
│   ├── finisher_certificates/  # 完赛证书图片
│   ├── moments/     # 灵感碎片图片
│   ├── post.*/      # 博文配图子目录
│   ├── bilibili-icon.png
│   ├── body_backgrond.jpg
│   ├── b站头像.gif
│   ├── favicon.ico
│   ├── github-icon.svg
│   └── menu-icon.svg
├── audios/          # 音频资源目录
│   └── moments/     # 灵感碎片音频
├── videos/          # 视频资源目录
├── documents/       # 项目文档目录
│   ├── resize.txt
│   ├── resized_files_list.txt
│   ├── 时间距离配速距离计算逻辑.txt
│   └── 武林外传剧本全.md
├── index.html       # 网站首页
├── pace-calculator.html
├── time-calculator.html
├── life-path-calculator.html
├── sports.html
├── study.html
├── style-comparison.html
├── tools.html
├── touken-forge.html
├── civilization-evolution.html
├── wulin-quotes.html
├── video.html
├── moments.html
├── posts.html
├── post-detail.html
├── convert-md-to-json.html
├── seo-checker.html
├── random-decision.html
├── dice-tool.html
├── local-llm-api-chat.html
└── README.md        # 项目说明文档
```

## 网站特色

- **响应式导航**: 适配移动设备的汉堡菜单导航
- **模块化设计**: 公共组件和样式的复用
- **主题切换**: 支持深色/浅色模式，提升用户体验
- **交互体验**: 动态效果和用户交互
- **资源优化**: 图片和媒体资源的合理组织
- **文档完善**: 每个目录都有详细的README文档说明

## 更新记录

| 日期 | 更新内容 |
|------|----------|
| 2023.02.22 | 项目初始化 |
| 2025.07.18 | 添加样式比较器工具 |
| 2025.07.19 | 完善项目文档结构，优化图片资源管理 |
| 2025.07.20 | 更新响应式导航系统 |
| 2025.11.20 | 添加主题切换功能 (theme-toggle.js) |
| 2025.11.21 | 增强用户体验和交互功能 |
| 2025.11.23 | 重构CSS和JS目录结构，添加子目录管理，更新HTML文件位置到根目录 |
| 2025.11.27 | 实现博客文章功能 (posts.html, post-detail.html)，添加Markdown支持和数学公式渲染，实现代码高亮功能，添加Markdown转换工具 (convert-md-to-json.html) |
| 2025.12.14 | 添加跑步记录功能 (sports.html)，支持赛季最佳和个人最佳标记 |
| 2025.12.15 | 完赛证书采用多列瀑布流布局展示，调整个人简介区域的HTML和CSS布局，优化标题和内容排列 |
| 2025.12.16 | 修复夜间模式下nav-card和skill-card悬停效果的不一致问题，统一夜间模式悬停效果的视觉一致性 |
| 2026.01.14 | 优化赛事日历功能，添加场地跑配色支持，实现数据驱动的动态配色方案，添加赛事类型图例，实现鼠标悬停提示框，支持长赛事名称自动换行，过去赛事显示成绩，未来赛事显示起跑时间 |
| 2026.01.19 | 优化成绩变化对比功能，添加同一项目和同一赛事的成绩变化趋势分析，显示上次参赛多少天前；优化个人最佳成绩(PB)统计逻辑，支持在certification字段添加"不计入PB/SB"标签排除特定赛事；在比赛记录中添加比赛类型显示 |
| 2026.01.22-23 | 实现多文明演化模拟器(civilization-evolution.html)，自动模拟多个文明的发展历程；优化模拟器性能，添加文明颜色图例和文明卡片颜色指示器，提升用户体验 |
| 2026.02.06 | 修正运动页面赛事日历图例的显示逻辑；删除博文文章H2标题的下划线；修正博文文章中图片的显示效果；修正博文详情页面中分类和标签的链接；博文列表页面分类和标签使用统一的badge样式；添加过滤信息显示和"清除所有"按钮；支持同时筛选多个分类和多个标签（OR逻辑）；优化跑步记录功能，为越野跑添加raceScore字段 |
| 2026.02.20-21 | 实现博文自动化系统，支持直接读取Markdown文件并自动渲染；修复posts.html页面响应式问题；整理和统一各篇博文的categories和tags；优化表格斑马纹效果；修复图片404错误；给代码块添加行号显示；添加脚注功能支持 |
| 2026.02.24 | 实现study.html页面的动态加载和筛选功能；优化全站动画性能；统一全站标题样式(h2, h3)，优化段落间距和行高 |
| 2026.02.25 | 修复B站API CORS问题，替换为静态用户数据；更新B站用户头像为本地图片；添加获赞数和播放数到用户统计信息；优化用户卡片布局 |
| 2026.03.10 | 为博客系统添加update_date字段支持，在文章元数据中新增更新日期字段；修改首页技能卡片，添加链接引导到对应页面 |
| 2026.03.13 | 新增SEO元数据检查工具(seo-checker.html)；新增随机决策器(random-decision.html)；新增骰子工具(dice-tool.html) |
| 2026.03.14 | 统一所有工具页面的section类名命名规范；合并配速计算器的分模块CSS文件；为所有工具页面添加动态tabs导航模块；完善sitemap.xml，添加所有工具和游戏页面 |
| 2026.03.16 | 多文明演化模拟器：添加运行日志记录系统，支持导出JSON格式日志；优化文明分裂机制，添加冷却期和稳定性修正；调整稳定性计算公式，平衡大文明惩罚；优化战争概率计算，增加实力差距和领土竞争因素 |
| 2026.03.17 | 多文明演化模拟器核心重构：新增运行日志系统、文明行为系统、稳定性修正机制；优化分裂/合并/灭亡/复兴判定；删除科技树模块。全站样式统一：统一表单元素样式，新增CSS变量。新增Markdown转JSON工具，优化工具页面导航结构 |
| 2026.03.28 | 优化全站下载功能：统一文件名为中文命名，日期时间格式统一为yyyyMMdd.hhmmss；涉及骰子工具、随机决策器、刀剑锻造、文明演化模拟器、运动成绩图表等。博文系统增强：post-detail.js支持通过file参数直接访问博文文件；新增详细错误页面，支持FILE_NOT_FOUND、ID_NOT_FOUND、PARSE_ERROR、NETWORK_ERROR等错误类型显示 |
| 2026.03.30 | 新增灵感碎片功能：（moments.html）支持记录文字、图片、音频、视频等多种形式的灵感碎片；支持Markdown格式渲染；支持标签筛选功能 |
| 2026.04.17 | 添加本地大模型API对话工具(local-llm-api-chat.html)，支持与LM Studio服务器进行交互；重构Markdown解析逻辑，提取上下标处理为共享函数(markdown-utils.js)，优化上下标处理避免与数学公式冲突 |
| 2026.04.20 | 添加时间计算器工具(time-calculator.html)；更新用户信息和比赛记录数据 |
| 2026.04.23 | 新增生命灵数计算器(life-path-calculator.html)，支持生日输入、逐位相加计算过程展示、大师数识别及灵数含义说明 |
| 2026.05.04 | 添加博文系列功能并优化博文列表页面：新增系列分类展示、时间线归档视图、无限滚动加载、回到顶部按钮，更新相关JSON和样式 |
| 2026.05.08 | 添加武林外传接台词游戏(wulin-quotes.html)和台词查询工具，支持多难度模式、角色筛选、台词搜索功能 |
| 2026.05.20 | 添加待抽签赛事管理与展示功能：新增待抽签赛事状态判断逻辑与日历样式；过滤已完赛赛事用于PB/SB计算和图表统计；补全赛事数据的status字段并新增待抽签赛事 |

## 使用方法

直接访问 [woshicby.github.io](https://woshicby.github.io) 即可浏览网站内容。

## 开发说明

### 响应式导航

网站采用了响应式导航系统，在移动设备上会自动转换为汉堡菜单。导航功能通过`JS/navigation.js`实现，相关样式定义在`CSS/common.css`中。

### 主题切换

网站支持深色/浅色主题切换功能，通过`JS/theme-toggle.js`实现，用户可以根据自己的偏好和环境切换不同的显示模式。

### 页面开发

如需添加新页面，请遵循现有的文件结构和命名规范，并确保引入公共样式和导航功能。新页面应支持响应式设计和主题切换功能。

---

## <a id="english"></a>English Version (AI Generated)

Personal website project - showcasing and practicing Web frontend development skills

## Project Overview

This is a personal website built with HTML, CSS, and JavaScript, designed to demonstrate frontend development capabilities and provide multiple practical tools and feature pages. The website employs responsive design to adapt to different screen sizes, offering an excellent user experience.

## Main Features

### 1. Calculator Tools
- **Pace Calculator** (pace-calculator.html): A tool for calculating running and sports pace
- **Time Calculator** (time-calculator.html): Time interval calculation tool
- **Life Path Number Calculator** (life-path-calculator.html): Life path number calculation and interpretation tool based on birthday

### 2. Game-related
- **Touken Ranbu Sword Forging Simulator** (touken-forge.html): Simulates the sword forging system in the game
- **Civilization Evolution Simulator** (civilization-evolution.html): Automatically simulates the development process of multiple civilizations, showing exchanges, conflicts, and rises and falls between civilizations
- **My Own Swordsman Quote Game** (wulin-quotes.html): Quote guessing game for the TV show "My Own Swordsman", supporting multiple difficulty modes and dialogue search

### 3. Media Display
- **Video Player** (video.html): Video content display and playback
- **Inspiration Moments** (moments.html): Record inspiration moments in various formats including text, images, audio, and video, with Markdown rendering and tag filtering support

### 4. Sports-related
- **Running Records** (sports.html): Displays personal running records with Season Best (SB) and Personal Best (PB) markers, featuring collapsible season records and multi-column waterfall layout for finisher certificates, supports adding "不计入PB/SB" tag in certification field to exclude specific races from PB calculation, shows race type in race records, trail running supports raceScore and ITRA performance index
- **Race Performance Comparison** (sports.html): Supports same project performance comparison and same event series performance comparison, displays all-time average, best performance, worst performance, trend, and days since last race
- **Race Calendar** (sports.html): Displays different types of running races, supports monthly/yearly view switching, shows results for past races and start times for future races, displays detailed tooltips on mouse hover, includes race type legend, supports pending lottery race section display with draw date

### 5. Learning Resources
- **Study Page** (study.html): Learning materials and notes, with dynamic loading and filtering support

### 6. Blog/Articles
- **Article List** (posts.html): Blog article list display, supporting series classification, timeline archive view, and infinite scroll loading
- **Article Detail** (post-detail.html): Article content display with Markdown support

### 7. Utility Tools
- **Tools Collection** (tools.html): A collection of various practical small tools
- **Style Comparator** (style-comparison.html): Style comparison tool
- **Markdown to JSON Converter** (convert-md-to-json.html): Converts Markdown files to JSON format
- **SEO Metadata Checker** (seo-checker.html): Web page SEO metadata checking tool
- **Random Decision Maker** (random-decision.html): Random selection decision tool
- **Dice Tool** (dice-tool.html): Virtual dice rolling tool
- **Local LLM API Chat** (local-llm-api-chat.html): Interact with local LLM services like LM Studio

### 8. Technical Features
- **MathJax Support**: Mathematical formula rendering
- **Code Highlighting**: Supports syntax highlighting for code

## Technology Stack

- **HTML5**: Page structure and semantic markup
- **CSS3**: Styling and responsive design
- **JavaScript**: Interactive functionality and dynamic content
- **Responsive Design**: Adapting to mobile and desktop devices
- **External APIs**: Integration with third-party services like Bilibili API
- **Theme Switching**: Supporting dark/light mode switching functionality
- **Markdown Support**: Markdown format rendering for article content
- **MathJax**: Mathematical formula rendering
- **Code Highlighting**: Syntax highlighting with highlight.js

## Project Structure

```
woshicby.github.io/
├── CSS/             # CSS files directory
│   ├── common/      # Common styles subdirectory (dark theme, responsive, selectors)
│   ├── index/       # Homepage styles subdirectory (dark theme, responsive, selectors)
│   ├── calendar.css       # Race calendar styles
│   ├── charts.css         # Performance chart styles
│   ├── civilization-evolution.css  # Civilization Evolution Simulator styles
│   ├── common.css         # Common styles
│   ├── convert-md-to-json.css  # Markdown converter styles
│   ├── dice-tool.css      # Dice tool styles
│   ├── github.min.css     # GitHub style code highlighting
│   ├── index.css          # Homepage styles
│   ├── life-path-calculator.css  # Life path calculator styles
│   ├── local-llm-api-chat.css    # Local LLM chat styles
│   ├── moments.css        # Inspiration Moments styles
│   ├── pace-calculator.css  # Pace calculator styles
│   ├── post-detail.css    # Article detail styles
│   ├── posts.css          # Article list styles
│   ├── random-decision.css  # Random decision maker styles
│   ├── seo-checker.css    # SEO checker styles
│   ├── sports.css         # Running records styles
│   ├── study.css          # Study page styles
│   ├── style-comparison.css  # Style comparator styles
│   ├── time-calculator.css  # Time calculator styles
│   ├── tools-common.css   # Tools common styles
│   ├── tools.css          # Tools collection styles
│   ├── touken-forge.css   # Touken Ranbu styles
│   ├── video.css          # Video player styles
│   └── wulin-quotes.css   # My Own Swordsman styles
├── JS/              # JavaScript files directory
│   ├── MathJax-3.2.2es5/  # MathJax library
│   ├── civilization-evolution/  # Civilization Evolution Simulator
│   │   ├── civilization.js
│   │   ├── main.js
│   │   ├── map.js
│   │   ├── simulator.js
│   │   ├── tech-tree.json
│   │   └── ui.js
│   ├── markdown/     # Markdown related functionality
│   │   ├── markdown-it.min.js
│   │   ├── markdown-it-footnote.min.js
│   │   ├── markdown-it-mark.min.js
│   │   ├── markdown-it-sub.min.js
│   │   ├── markdown-it-sup.min.js
│   │   └── markdown-utils.js  # Markdown parsing shared utilities
│   ├── background-lazy-load.js  # Background image lazy loading
│   ├── bilibili-api.js    # Bilibili API
│   ├── calendar.js        # Race calendar functionality
│   ├── charts.js          # Performance chart functionality
│   ├── convert-md-to-json.js  # Markdown converter
│   ├── dice-tool.js       # Dice tool
│   ├── highlight.min.js   # Code highlighting
│   ├── life-path-calculator.js  # Life path calculator
│   ├── local-llm-api-chat.js    # Local LLM chat
│   ├── moments.js         # Inspiration Moments
│   ├── navigation.js      # Navigation functionality
│   ├── pace-calculator.js # Pace calculator
│   ├── post-detail.js     # Article detail functionality
│   ├── posts.js           # Article list functionality
│   ├── random-decision.js # Random decision maker
│   ├── seo-checker.js     # SEO checker
│   ├── sports.js          # Running records functionality
│   ├── study.js           # Study page functionality
│   ├── theme-toggle.js    # Theme switching
│   ├── time-calculator.js # Time calculator
│   ├── tool-tabs.js       # Tool page tab navigation
│   ├── tools.js           # Tools collection
│   ├── touken-forge.js    # Touken Ranbu
│   └── wulin-quotes.js    # My Own Swordsman
├── JSON/              # JSON data files directory
│   ├── games.json        # Game data
│   ├── moments.json      # Inspiration Moments data
│   ├── posts.json        # Blog posts data (deprecated, backward compatible)
│   ├── posts-list.json   # Blog posts list configuration file
│   ├── posts-series.json # Blog series configuration file
│   ├── race-records.json  # Running records data
│   ├── seo-pages.json    # SEO page configuration
│   ├── study-data.json   # Study page data
│   └── tools.json        # Tools data
├── posts/           # Blog articles directory
│   └── *.md        # Markdown format blog posts
├── images/          # Image resources directory
│   ├── finisher_certificates/  # Finisher certificate images
│   ├── moments/     # Inspiration Moments images
│   ├── post.*/      # Blog post image subdirectories
│   ├── bilibili-icon.png
│   ├── body_backgrond.jpg
│   ├── b站头像.gif
│   ├── favicon.ico
│   ├── github-icon.svg
│   └── menu-icon.svg
├── audios/          # Audio resources directory
│   └── moments/     # Inspiration Moments audio
├── videos/          # Video resources directory
├── documents/       # Project documents directory
│   ├── resize.txt
│   ├── resized_files_list.txt
│   ├── 时间距离配速距离计算逻辑.txt (Time-Distance-Pace Calculation Logic)
│   └── 武林外传剧本全.md (My Own Swordsman Script)
├── index.html       # Website homepage
├── pace-calculator.html
├── time-calculator.html
├── life-path-calculator.html
├── sports.html
├── study.html
├── style-comparison.html
├── tools.html
├── touken-forge.html
├── civilization-evolution.html
├── wulin-quotes.html
├── video.html
├── moments.html
├── posts.html
├── post-detail.html
├── convert-md-to-json.html
├── seo-checker.html
├── random-decision.html
├── dice-tool.html
├── local-llm-api-chat.html
└── README.md        # Project documentation
```

## Website Features

- **Responsive Navigation**: Mobile-adapted hamburger menu navigation
- **Modular Design**: Reuse of common components and styles
- **Theme Switching**: Support for dark/light modes, enhancing user experience
- **Interactive Experience**: Dynamic effects and user interactions
- **Resource Optimization**: Reasonable organization of image and media resources
- **Comprehensive Documentation**: Detailed README documentation for each directory

## Update History

| Date | Update Content |
|------|----------------|
| 2023.02.22 | Project initialization |
| 2025.07.18 | Added style comparator tool |
| 2025.07.19 | Improved project documentation structure, optimized image resource management |
| 2025.07.20 | Updated responsive navigation system |
| 2025.11.20 | Added theme switching functionality (theme-toggle.js) |
| 2025.11.21 | Enhanced user experience and interactive features |
| 2025.11.23 | Refactored CSS and JS directory structure with subdirectories, updated HTML file locations to root directory |
| 2025.11.27 | Implemented blog article functionality (posts.html, post-detail.html), added Markdown support and mathematical formula rendering, implemented code highlighting functionality, added Markdown to JSON converter (convert-md-to-json.html) |
| 2025.12.14 | Added running records feature (sports.html) with SB and PB markers |
| 2025.12.15 | Implemented multi-column waterfall layout for finisher certificates, adjusted HTML and CSS layout of "About Me" section |
| 2025.12.16 | Fixed inconsistent hover effects between nav-card and skill-card in dark mode, unified visual consistency of hover effects in dark mode |
| 2026.01.14 | Optimized race calendar functionality, added track run color support, implemented data-driven dynamic color scheme, added race type legend, implemented mouse hover tooltips, supported auto-wrapping for long race names, showed results for past races and start times for future races |
| 2026.01.19 | Optimized race performance comparison functionality, added performance trend analysis for same project and same event, displayed days since last race; optimized Personal Best (PB) calculation logic, supported adding "不计入PB/SB" tag in certification field; added race type display in race records |
| 2026.01.22-23 | Implemented Civilization Evolution Simulator (civilization-evolution.html), optimized simulator performance, added civilization color legend and civilization card color indicators |
| 2026.02.06 | Fixed race calendar legend display logic on sports page; removed underline from blog post H2 titles; fixed image display effects in blog posts; fixed category and tag links in blog detail page; unified badge style for categories and tags; added filter info display and "Clear All" button; supported filtering multiple categories and tags simultaneously (OR logic); optimized running records functionality, added raceScore field for trail running |
| 2026.02.20-21 | Implemented blog automation system, supports direct reading of Markdown files and automatic rendering; fixed posts.html page responsiveness issue; organized and unified categories and tags across blog posts; optimized table zebra stripe effect; fixed image 404 errors; added line number display to code blocks; added footnote functionality support |
| 2026.02.24 | Implemented dynamic loading and filtering functionality for study.html page; optimized site-wide animation performance; unified site-wide title styles (h2, h3), optimized paragraph spacing and line height |
| 2026.02.25 | Fixed Bilibili API CORS issues, replaced with static user data; updated Bilibili user avatar to local image; added likes and plays counts to user statistics; optimized user card layout |
| 2026.03.10 | Added update_date field support to the blog system, added update date field in article metadata; modified homepage skill cards, added links to corresponding pages |
| 2026.03.13 | Added SEO metadata checker tool (seo-checker.html); added random decision maker (random-decision.html); added dice tool (dice-tool.html) |
| 2026.03.14 | Unified section class naming convention across all tool pages; merged pace calculator modular CSS files; added dynamic tabs navigation module to all tool pages; enhanced sitemap.xml with all tools and games pages |
| 2026.03.16 | Civilization Evolution Simulator: Added simulation log recording system with JSON export support; optimized civilization split mechanism with cooldown period and stability correction; adjusted stability calculation formula to balance large civilization penalties; optimized war probability calculation with strength gap and territory competition factors |
| 2026.03.17 | Civilization Evolution Simulator core refactoring: Added simulation log system, civilization behavior system, stability correction mechanism; optimized split/merge/extinction/revival conditions; removed tech tree module. Site-wide style unification: Unified form element styles, added CSS variables. Added Markdown to JSON tool, optimized tool page navigation structure |
| 2026.03.28 | Optimized site-wide download functionality: Unified filenames to Chinese, standardized datetime format to yyyyMMdd.hhmmss; affected dice tool, random decision maker, sword forging, civilization evolution simulator, sports charts. Blog system enhancement: post-detail.js now supports direct access to blog files via file parameter; added detailed error page with FILE_NOT_FOUND, ID_NOT_FOUND, PARSE_ERROR, NETWORK_ERROR error types |
| 2026.03.30 | Added Inspiration Moments feature (moments.html): Supports recording text, images, audio, video and other forms of inspiration moments; supports Markdown format rendering; supports tag filtering |
| 2026.04.17 | Added local LLM API chat tool (local-llm-api-chat.html), supporting interaction with LM Studio servers; refactored Markdown parsing logic, extracted subscript/superscript handling into a shared function (markdown-utils.js), optimized subscript/superscript processing to avoid conflicts with mathematical formulas |
| 2026.04.20 | Added time calculator tool (time-calculator.html); updated user information and race records data |
| 2026.04.23 | Added life path number calculator (life-path-calculator.html), supporting birthday input, step-by-step digit addition display, master number identification, and number meaning descriptions |
| 2026.05.04 | Added blog series feature and optimized posts list page: series classification, timeline archive view, infinite scroll loading, back-to-top button, updated related JSON and styles |
| 2026.05.08 | Added My Own Swordsman quote guessing game (wulin-quotes.html) and dialogue search tool, supporting multiple difficulty modes, character filtering, and dialogue search |
| 2026.05.20 | Added pending lottery race management and display: new pending lottery status logic and calendar styles; filter finished races for PB/SB calculation and chart statistics; added status field to all race records and new pending lottery races |

## Usage

Directly visit [woshicby.github.io](https://woshicby.github.io) to browse the website content.

## Development Notes

### Responsive Navigation

The website adopts a responsive navigation system that automatically converts to a hamburger menu on mobile devices. Navigation functionality is implemented through `JS/navigation.js`, with related styles defined in `CSS/common.css`.

### Theme Switching

The website supports dark/light theme switching functionality, implemented through `JS/theme-toggle.js`, allowing users to switch between different display modes according to their preferences and environment.

### Page Development

When adding new pages, please follow the existing file structure and naming conventions, and ensure that common styles and navigation functionality are properly included. New pages should support responsive design and theme switching functionality.

---

## <a id="japanese"></a>日本語バージョン (AI生成)

パーソナルウェブサイトプロジェクト - Webフロントエンド開発スキルの展示と実践

## プロジェクト概要

これはHTML、CSS、JavaScriptを使用して構築されたパーソナルウェブサイトであり、フロントエンド開発能力を示し、複数の実用的なツールと機能ページを提供することを目的としています。ウェブサイトはレスポンシブデザインを採用しており、さまざまな画面サイズに適応し、優れたユーザーエクスペリエンスを提供します。

## 主な機能

### 1. 計算ツール
- **ペース計算機** (pace-calculator.html): ランニングやスポーツのペース計算ツール
- **時間計算機** (time-calculator.html): 時間間隔計算ツール
- **ライフパスナンバー計算機** (life-path-calculator.html): 誕生日に基づくライフパスナンバー計算・解釈ツール

### 2. ゲーム関連
- **刀剣乱舞刀鍛冶シミュレーター** (touken-forge.html): ゲーム内の刀鍛冶システムをシミュレート
- **多文明演化シミュレーター** (civilization-evolution.html): 複数の文明の発展プロセスを自動的にシミュレートし、文明間の交流、対立、盛衰を示す
- **武林外伝セリフ当てゲーム** (wulin-quotes.html): ドラマ「武林外伝」のセリフ当てゲーム、複数難易度モードとセリフ検索をサポート

### 3. メディア表示
- **ビデオプレイヤー** (video.html): ビデオコンテンツの表示と再生
- **インスピレーション Moments** (moments.html): テキスト、画像、音声、動画など様々な形式のインスピレーションを記録、Markdownレンダリングとタグフィルタリングをサポート

### 4. スポーツ関連
- **ランニング記録** (sports.html): 個人のランニング記録を表示し、シーズンベスト(SB)とパーソナルベスト(PB)のマーカーをサポート、折りたたみ可能なシーズン記録機能を搭載、完走証明書は多列のウォーターフォールレイアウトで表示、特定のレースをPB計算から除外するためにcertificationフィールドに「不计入PB/SB」タグを追加できる、レース記録にレースタイプを表示、トレイルランはraceScoreとITRAパフォーマンス指数をサポート
- **レース成績比較** (sports.html): 同一プロジェクトの成績変化比較と同一イベントシリーズの成績変化比較をサポート、全期間平均成績、最高成績、最低成績、傾向、および前回レースからの日数を表示
- **レースカレンダー** (sports.html): 異なるタイプのランニングレースを表示、月/年ビュー切り替えに対応、過去のレースには結果を表示、未来のレースにはスタート時間を表示、マウスホバーで詳細ツールチップを表示、レースタイプの凡例を含む、抽選待ちレースのセクション表示と抽選日表示をサポート

### 5. 学習リソース
- **学習ページ** (study.html): 学習資料とノート、動的読み込みとフィルタリングをサポート

### 6. ブログ/記事
- **記事一覧** (posts.html): ブログ記事一覧表示、シリーズ分類、タイムラインアーカイブビュー、無限スクロール読み込みをサポート
- **記事詳細** (post-detail.html): Markdown形式で記事内容を表示

### 7. 便利ツール
- **ツールコレクション** (tools.html): 様々な実用的な小さなツールの集合
- **スタイル比較ツール** (style-comparison.html): スタイル比較ツール
- **MarkdownからJSONへの変換ツール** (convert-md-to-json.html): MarkdownファイルをJSON形式に変換
- **SEOメタデータチェッカー** (seo-checker.html): ウェブページSEOメタデータチェックツール
- **ランダム決定メーカー** (random-decision.html): ランダム選択決定ツール
- **ダイスツール** (dice-tool.html): バーチャルダイス投擲ツール
- **ローカルLLM APIチャット** (local-llm-api-chat.html): LM StudioなどのローカルLLMサービスと対話

### 8. 技術機能
- **MathJaxサポート**: 数式のレンダリング
- **コードハイライト**: コードの構文ハイライト表示をサポート

## 技術スタック

- **HTML5**: ページ構造と意味的なマークアップ
- **CSS3**: スタイリングとレスポンシブデザイン
- **JavaScript**: インタラクティブな機能と動的コンテンツ
- **レスポンシブデザイン**: モバイルデバイスとデスクトップデバイスへの適応
- **外部API**: Bilibili APIなどのサードパーティサービスとの統合
- **テーマ切り替え**: ダーク/ライトモード切り替え機能のサポート
- **Markdownサポート**: 記事コンテンツのMarkdown形式レンダリング
- **MathJax**: 数式のレンダリング
- **コードハイライト**: highlight.jsによる構文ハイライト

## プロジェクト構造

```
woshicby.github.io/
├── CSS/             # CSSファイルディレクトリ
│   ├── common/      # 共通スタイルサブディレクトリ（ダークテーマ、レスポンシブ、セレクタ）
│   ├── index/       # ホームページスタイルサブディレクトリ（ダークテーマ、レスポンシブ、セレクタ）
│   ├── calendar.css       # レースカレンダースタイル
│   ├── charts.css         # 成績チャートスタイル
│   ├── civilization-evolution.css  # 多文明演化シミュレータースタイル
│   ├── common.css         # 共通スタイル
│   ├── convert-md-to-json.css  # Markdown変換ツールスタイル
│   ├── dice-tool.css      # ダイスツールスタイル
│   ├── github.min.css     # GitHubスタイルコードハイライト
│   ├── index.css          # ホームページスタイル
│   ├── life-path-calculator.css  # ライフパスナンバー計算機スタイル
│   ├── local-llm-api-chat.css    # ローカルLLMチャットスタイル
│   ├── moments.css        # インスピレーションMomentsスタイル
│   ├── pace-calculator.css  # ペース計算機スタイル
│   ├── post-detail.css    # 記事詳細スタイル
│   ├── posts.css          # 記事一覧スタイル
│   ├── random-decision.css  # ランダム決定メーカースタイル
│   ├── seo-checker.css    # SEOチェッカースタイル
│   ├── sports.css         # ランニング記録スタイル
│   ├── study.css          # 学習ページスタイル
│   ├── style-comparison.css  # スタイル比較ツールスタイル
│   ├── time-calculator.css  # 時間計算機スタイル
│   ├── tools-common.css   # ツール共通スタイル
│   ├── tools.css          # ツールコレクションスタイル
│   ├── touken-forge.css   # 刀剣乱舞スタイル
│   ├── video.css          # ビデオプレイヤースタイル
│   └── wulin-quotes.css   # 武林外伝スタイル
├── JS/              # JavaScriptファイルディレクトリ
│   ├── MathJax-3.2.2es5/  # MathJaxライブラリ
│   ├── civilization-evolution/  # 多文明演化シミュレーター
│   │   ├── civilization.js
│   │   ├── main.js
│   │   ├── map.js
│   │   ├── simulator.js
│   │   ├── tech-tree.json
│   │   └── ui.js
│   ├── markdown/     # Markdown関連機能
│   │   ├── markdown-it.min.js
│   │   ├── markdown-it-footnote.min.js
│   │   ├── markdown-it-mark.min.js
│   │   ├── markdown-it-sub.min.js
│   │   ├── markdown-it-sup.min.js
│   │   └── markdown-utils.js  # Markdown解析共有ユーティリティ
│   ├── background-lazy-load.js  # 背景画像遅延読み込み
│   ├── bilibili-api.js    # Bilibili API
│   ├── calendar.js        # レースカレンダー機能
│   ├── charts.js          # 成績チャート機能
│   ├── convert-md-to-json.js  # Markdown変換ツール
│   ├── dice-tool.js       # ダイスツール
│   ├── highlight.min.js   # コードハイライト
│   ├── life-path-calculator.js  # ライフパスナンバー計算機
│   ├── local-llm-api-chat.js    # ローカルLLMチャット
│   ├── moments.js         # インスピレーションMoments
│   ├── navigation.js      # ナビゲーション機能
│   ├── pace-calculator.js # ペース計算機
│   ├── post-detail.js     # 記事詳細機能
│   ├── posts.js           # 記事一覧機能
│   ├── random-decision.js # ランダム決定メーカー
│   ├── seo-checker.js     # SEOチェッカー
│   ├── sports.js          # ランニング記録機能
│   ├── study.js           # 学習ページ機能
│   ├── theme-toggle.js    # テーマ切り替え
│   ├── time-calculator.js # 時間計算機
│   ├── tool-tabs.js       # ツールページタブナビゲーション
│   ├── tools.js           # ツールコレクション
│   ├── touken-forge.js    # 刀剣乱舞
│   └── wulin-quotes.js    # 武林外伝
├── JSON/              # JSONデータファイルディレクトリ
│   ├── games.json        # ゲームデータ
│   ├── moments.json      # インスピレーションMomentsデータ
│   ├── posts.json        # ブログ記事データ（非推奨、後方互換）
│   ├── posts-list.json   # ブログ記事リスト設定ファイル
│   ├── posts-series.json # ブログシリーズ設定ファイル
│   ├── race-records.json  # ランニング記録データ
│   ├── seo-pages.json    # SEOページ設定
│   ├── study-data.json   # 学習ページデータ
│   └── tools.json        # ツールデータ
├── posts/           # ブログ記事ディレクトリ
│   └── *.md        # Markdown形式ブログ記事
├── images/          # 画像リソースディレクトリ
│   ├── finisher_certificates/  # 完走証明書画像
│   ├── moments/     # インスピレーションMoments画像
│   ├── post.*/      # ブログ記事画像サブディレクトリ
│   ├── bilibili-icon.png
│   ├── body_backgrond.jpg
│   ├── b站头像.gif
│   ├── favicon.ico
│   ├── github-icon.svg
│   └── menu-icon.svg
├── audios/          # 音声リソースディレクトリ
│   └── moments/     # インスピレーションMoments音声
├── videos/          # 動画リソースディレクトリ
├── documents/       # プロジェクトドキュメントディレクトリ
│   ├── resize.txt
│   ├── resized_files_list.txt
│   ├── 时间距离配速距离计算逻辑.txt (時間-距離-ペース計算ロジック)
│   └── 武林外传剧本全.md (武林外伝スクリプト)
├── index.html       # ウェブサイトホームページ
├── pace-calculator.html
├── time-calculator.html
├── life-path-calculator.html
├── sports.html
├── study.html
├── style-comparison.html
├── tools.html
├── touken-forge.html
├── civilization-evolution.html
├── wulin-quotes.html
├── video.html
├── moments.html
├── posts.html
├── post-detail.html
├── convert-md-to-json.html
├── seo-checker.html
├── random-decision.html
├── dice-tool.html
├── local-llm-api-chat.html
└── README.md        # プロジェクトドキュメント
```

## ウェブサイトの特徴

- **レスポンシブナビゲーション**: モバイルデバイスに適応するハンバーガーメニューナビゲーション
- **モジュラー設計**: 共通コンポーネントとスタイルの再利用
- **テーマ切り替え**: ダーク/ライトモードのサポート、ユーザーエクスペリエンスの向上
- **インタラクティブ体験**: 動的効果とユーザーインタラクション
- **リソース最適化**: 画像とメディアリソースの適切な整理
- **包括的なドキュメント**: 各ディレクトリの詳細なREADMEドキュメント

## 更新履歴

| 日付 | 更新内容 |
|------|----------|
| 2023.02.22 | プロジェクト初期化 |
| 2025.07.18 | スタイル比較ツールの追加 |
| 2025.07.19 | プロジェクトドキュメント構造の改善、画像リソース管理の最適化 |
| 2025.07.20 | レスポンシブナビゲーションシステムの更新 |
| 2025.11.20 | テーマ切り替え機能の追加 (theme-toggle.js) |
| 2025.11.21 | ユーザーエクスペリエンスとインタラクティブ機能の強化 |
| 2025.11.23 | CSSとJSのディレクトリ構造をリファクタリング、サブディレクトリ管理を追加、HTMLファイルの位置をルートディレクトリに更新 |
| 2025.11.27 | ブログ記事機能 (posts.html, post-detail.html) の実装、Markdownサポートと数式レンダリングの追加、コードハイライト機能の実装、MarkdownからJSONへの変換ツールの追加 (convert-md-to-json.html) |
| 2025.12.14 | ランニング記録機能 (sports.html) の追加、SBとPBのマーカーをサポート |
| 2025.12.15 | 完走証明書に多列のウォーターフォールレイアウトを実装、「About Me」セクションのHTMLとCSSレイアウトを調整 |
| 2025.12.16 | ダークモードでのnav-cardとskill-cardのホバー効果の不一致を修正、ダークモードでのホバー効果の視覚的一貫性を統一 |
| 2026.01.14 | レースカレンダー機能を最適化、トラックランの配色サポートを追加、データ駆動の動的配色スキームを実装、レースタイプ凡例を追加、マウスホバーツールチップを実装、長いレース名の自動折り返しをサポート、過去のレースには結果を表示、未来のレースにはスタート時間を表示 |
| 2026.01.19 | レース成績比較機能を最適化、同一プロジェクトと同一イベントの成績傾向分析を追加、前回レースからの日数を表示；パーソナルベスト(PB)計算ロジックを最適化、特定のレースをPB計算から除外するタグを追加；レース記録にレースタイプ表示を追加 |
| 2026.01.22-23 | 多文明演化シミュレーター(civilization-evolution.html)を実装、複数の文明の発展プロセスを自動的にシミュレート；シミュレーターのパフォーマンスを最適化、文明の色の凡例と文明カードの色インジケーターを追加 |
| 2026.02.06 | スポーツページのレースカレンダー凡例の表示ロジックを修正；ブログ記事のH2タイトルの下線を削除；ブログ記事の画像表示効果を修正；ブログ詳細ページのカテゴリとタグのリンクを修正；統一されたbadgeスタイルに変更；フィルター情報表示と「すべてクリア」ボタンを追加；複数のカテゴリとタグを同時にフィルタリング可能に；ランニング記録機能を最適化、トレイルランにraceScoreフィールドを追加 |
| 2026.02.20-21 | ブログ自動化システムを実装、Markdownファイルを直接読み込み自動レンダリングをサポート；posts.htmlページのレスポンシブ問題を修正；各ブログ記事のcategoriesとtagsを整理して統一；テーブルのゼブラストライプ効果を最適化；画像404エラーを修正；コードブロックに行番号表示を追加；脚注機能サポートを追加 |
| 2026.02.24 | study.htmlページの動的読み込みとフィルタリング機能を実装；サイト全体のアニメーションパフォーマンスを最適化；サイト全体のタイトルスタイル(h2, h3)を統一し、段落の間隔と行間を最適化 |
| 2026.02.25 | Bilibili API CORS問題を修正し、静的ユーザーデータに置き換え；Bilibiliユーザーアバターをローカル画像に更新；ユーザー統計情報にいいね数と再生数を追加；ユーザーカードレイアウトを最適化 |
| 2026.03.10 | ブログシステムにupdate_dateフィールドサポートを追加、記事メタデータに更新日フィールドを新規追加；ホームページのスキルカードを変更し、対応するページへのリンクを追加 |
| 2026.03.13 | SEOメタデータチェッカーツール(seo-checker.html)を追加；ランダム決定メーカー(random-decision.html)を追加；ダイスツール(dice-tool.html)を追加 |
| 2026.03.14 | すべてのツールページのセクションクラス命名規則を統一；ペース計算機のモジュラーCSSファイルを統合；すべてのツールページに動的タブナビゲーションモジュールを追加；sitemap.xmlを強化、すべてのツールとゲームページを追加 |
| 2026.03.16 | 多文明演化シミュレーター：シミュレーションログ記録システムを追加、JSONエクスポート対応；文明分裂メカニズムを最適化、クールダウン期間と安定性補正を追加；安定性計算式を調整；戦争確率計算を最適化 |
| 2026.03.17 | 多文明演化シミュレーター核心リファクタリング：シミュレーションログシステム、文明行動システム、安定性補正メカニズムを追加；分裂/統合/滅亡/復興条件を最適化；テクツリーモジュールを削除。サイト全体のスタイル統一：フォーム要素スタイルを統一、CSS変数を追加。MarkdownからJSONツールを追加、ツールページナビゲーション構造を最適化 |
| 2026.03.28 | サイト全体のダウンロード機能を最適化：ファイル名を中国語に統一、日時形式をyyyyMMdd.hhmmssに統一；ダイスツール、ランダム決定メーカー、刀剣鍛造、文明演化シミュレーター、スポーツ成績チャートなどが対象。ブログシステム強化：post-detail.jsがfileパラメータによるブログファイルへの直接アクセスをサポート；詳細エラーページを追加、FILE_NOT_FOUND、ID_NOT_FOUND、PARSE_ERROR、NETWORK_ERRORなどのエラータイプ表示に対応 |
| 2026.03.30 | インスピレーション Moments機能(moments.html)を追加：テキスト、画像、音声、動画など様々な形式のインスピレーションを記録；Markdown形式のレンダリングに対応；タグフィルタリング機能をサポート |
| 2026.04.17 | ローカルLLM APIチャットツール(local-llm-api-chat.html)を追加、LM Studioサーバーとの対話をサポート；Markdown解析ロジックをリファクタリング、下付き・上付き文字処理を共有関数(markdown-utils.js)に抽出、数式との競合を回避するよう下付き・上付き文字処理を最適化 |
| 2026.04.20 | 時間計算機ツール(time-calculator.html)を追加；ユーザー情報とレース記録データを更新 |
| 2026.04.23 | ライフパスナンバー計算機(life-path-calculator.html)を追加、誕生日入力、桁ごとの加算過程表示、マスター番号識別、ナンバーの意味説明をサポート |
| 2026.05.04 | ブログシリーズ機能を追加し投稿一覧ページを最適化：シリーズ分類表示、タイムラインアーカイブビュー、無限スクロール読み込み、トップへ戻るボタン、関連JSONとスタイルを更新 |
| 2026.05.08 | 武林外伝セリフ当てゲーム(wulin-quotes.html)とセリフ検索ツールを追加、複数難易度モード、キャラクターフィルタリング、セリフ検索機能をサポート |
| 2026.05.20 | 抽選待ちレース管理・表示機能を追加：抽選待ちレースステータス判定ロジックとカレンダースタイルを新規追加；PB/SB計算とチャート統計に完了レースのみをフィルタリング；全レースデータにstatusフィールドを追加し、抽選待ちレースを新規追加 |

## 使用方法

[woshicby.github.io](https://woshicby.github.io) に直接アクセスして、ウェブサイトのコンテンツを閲覧できます。

## 開発ノート

### レスポンシブナビゲーション

ウェブサイトはレスポンシブナビゲーションシステムを採用しており、モバイルデバイスでは自動的にハンバーガーメニューに変換されます。ナビゲーション機能は `JS/navigation.js` を通じて実装されており、関連するスタイルは `CSS/common.css` に定義されています。

### テーマ切り替え

ウェブサイトはダーク/ライトテーマ切り替え機能をサポートしており、`JS/theme-toggle.js` を通じて実装されています。ユーザーは、好みや環境に応じて異なる表示モードを切り替えることができます。

### ページ開発

新しいページを追加する場合は、既存のファイル構造と命名規則に従い、共通のスタイルとナビゲーション機能が適切に含まれていることを確認してください。新しいページはレスポンシブデザインとテーマ切り替え機能をサポートする必要があります。
