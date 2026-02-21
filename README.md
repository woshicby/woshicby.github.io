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

### 2. 游戏相关
- **刀剑乱舞锻刀模拟器** (touken-forge.html): 模拟游戏中的锻刀系统
- **多文明演化模拟器** (civilization-evolution.html): 自动模拟多个文明的发展历程，展示文明间的交流、冲突与兴衰

### 3. 媒体展示
- **视频播放器** (video.html): 视频内容展示和播放

### 4. 体育相关
- **跑步记录** (sports.html): 展示个人跑步记录，支持赛季最佳(SB)和个人最佳(PB)标记，可折叠的赛季记录展示，完赛证书采用多列瀑布流布局展示，支持在certification字段添加"不计入PB/SB"标签排除特定赛事，比赛记录中显示比赛类型
- **成绩变化对比** (sports.html): 支持同一项目成绩变化对比和同一赛事成绩变化对比，显示全部平均成绩、最佳成绩、最差成绩、变化趋势和上次参赛天数
- **赛事日历** (sports.html): 展示不同类型的跑步比赛，支持按月/年切换视图，过去赛事显示成绩，未来赛事显示起跑时间，鼠标悬停显示详情提示框，包含赛事类型图例

### 5. 学习资源
- **学习页面** (study.html): 学习资料和笔记

### 6. 博客/文章
- **文章列表** (posts.html): 博客文章列表展示
- **文章详情** (post-detail.html): 文章详细内容展示，支持Markdown格式

### 7. 实用工具
- **工具集** (tools.html): 各种实用小工具集合
- **样式比较器** (style-comparison.html): 样式对比工具
- **Markdown转换工具** (convert-md-to-json.html): 将Markdown文件转换为JSON格式

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
│   ├── common/      # 公共样式子目录
│   ├── index/       # 首页样式子目录
│   ├── pace-calculator/  # 配速计算器样式子目录
│   ├── tools-common/     # 工具公共样式子目录
│   ├── common.css   # 公共样式
│   ├── index.css    # 首页样式
│   ├── pace-calculator.css
│   ├── sports.css
│   ├── style-comparison.css
│   ├── tools-common.css
│   ├── tools.css
│   ├── touken-forge.css
│   ├── video.css
│   ├── convert-md-to-json.css  # Markdown转换工具样式
│   ├── github.min.css  # GitHub风格样式
│   ├── post-detail.css  # 文章详情样式
│   ├── posts.css       # 文章列表样式
│   ├── study.css       # 学习页面样式
│   └── civilization-evolution.css  # 多文明演化模拟器样式
├── JS/              # JavaScript文件目录
│   ├── MathJax-3.2.2es5/  # MathJax数学公式库
│   ├── markdown/     # Markdown相关功能
│   ├── bilibili-api.js
│   ├── navigation.js
│   ├── pace-calculator.js
│   ├── theme-toggle.js
│   ├── touken-forge.js
│   ├── sports.js     # 跑步记录功能
│   ├── convert-md-to-json.js  # Markdown转换工具
│   ├── highlight.min.js  # 代码高亮
│   ├── post-detail.js  # 文章详情功能
│   ├── posts.js       # 文章列表功能
│   └── civilization-evolution/  # 多文明演化模拟器
│       ├── civilization.js
│       ├── map.js
│       ├── simulator.js
│       ├── ui.js
│       └── main.js
├── posts/           # 博客文章目录
│   ├── markdown示例.md
│   └── posts.json
├── images/          # 图片资源目录
│   ├── BV1zM41127x9.jpg
│   ├── bilibili-icon.png
│   ├── body_backgrond.jpg
│   ├── github-icon.svg
│   ├── menu-icon.svg
│   ├── test_image.jpg
│   ├── touken/      # 刀剑乱舞相关图片
│   │   └── default_sword.jpg
│   └── weibo-icon.png
├── videos/          # 视频资源目录
│   └── test_video.mp4
├── audios/          # 音频资源目录
│   └── test_audio.mp3
├── documents/       # 项目文档目录
│   ├── resize.txt
│   ├── resized_files_list.txt
│   └── 时间距离配速距离计算逻辑.txt
├── JSON/              # JSON数据文件目录
│   ├── posts.json     # 博客文章数据（已废弃，向后兼容）
│   ├── posts-list.json  # 博客文章列表配置文件
│   └── race-records.json  # 跑步记录数据
├── templates/       # 模板文件目录
├── index.html       # 网站首页
├── pace-calculator.html
├── sports.html
├── study.html
├── style-comparison.html
├── tools.html
├── touken-forge.html
├── video.html
├── convert-md-to-json.html  # Markdown转换工具页面
├── post-detail.html  # 文章详情页面
├── posts.html        # 文章列表页面
├── civilization-evolution.html  # 多文明演化模拟器页面
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

- 2023.02.22: 项目初始化
- 2025.07.18: 添加样式比较器工具
- 2025.07.19: 完善项目文档结构，优化图片资源管理
- 2025.07.20: 更新响应式导航系统
- 2025.11.20: 添加主题切换功能 (theme-toggle.js)
- 2025.11.21: 增强用户体验和交互功能
- 2025.11.23: 重构CSS和JS目录结构，添加子目录管理，更新HTML文件位置到根目录
- 2025.11.27: 实现博客文章功能 (posts.html, post-detail.html)，添加Markdown支持和数学公式渲染，实现代码高亮功能，添加Markdown转换工具 (convert-md-to-json.html)
- 2025.12.14: 添加跑步记录功能 (sports.html)，支持赛季最佳和个人最佳标记
- 2025.12.15: 完赛证书采用多列瀑布流布局展示，调整个人简介区域的HTML和CSS布局，优化标题和内容排列
- 2025.12.16: 修复夜间模式下nav-card和skill-card悬停效果的不一致问题，统一夜间模式悬停效果的视觉一致性
- 2026.01.14: 优化赛事日历功能，添加场地跑配色支持，实现数据驱动的动态配色方案，添加赛事类型图例，实现鼠标悬停提示框，支持长赛事名称自动换行，过去赛事显示成绩，未来赛事显示起跑时间
- 2026.01.19: 优化成绩变化对比功能，添加同一项目和同一赛事的成绩变化趋势分析，显示上次参赛多少天前；优化个人最佳成绩(PB)统计逻辑，支持在certification字段添加"不计入PB/SB"标签排除特定赛事；在比赛记录中添加比赛类型显示
- 2026.01.22-23: 实现多文明演化模拟器(civilization-evolution.html)，自动模拟多个文明的发展历程；优化模拟器性能，添加文明颜色图例和文明卡片颜色指示器，提升用户体验；将项目名称从"多文明文字演化模拟器"更改为"多文明演化模拟器"
- 2026.02.06: 修正运动页面赛事日历图例的显示逻辑；删除博文文章H2标题的下划线；修正博文文章中图片的显示效果
- 2026.02.06: 修正博文详情页面中分类和标签的链接（从index.html改为posts.html）；博文列表页面分类和标签使用统一的badge样式；添加过滤信息显示和"清除所有"按钮；支持同时筛选多个分类和多个标签（OR逻辑）；支持单独移除过滤条件；文章列表中的分类和标签也支持多选逻辑；博文详情页面分类和标签使用badge样式，在日期前添加"日期："标签
- 2026.02.06: 优化跑步记录功能，为越野跑添加raceScore字段；修改同一项目成绩变化对比，支持越野跑的raceScore变化和ITRA表现分显示；修复越野跑PB/SB标签的显示问题；更新赛事日历图例的显示逻辑，根据当前视图动态显示相关赛事类型；修改越野跑PB卡片，将配速替换为ITRA表现分；确保ITRA表现分数字的样式一致性
- 2026.02.20: 实现博文自动化系统，支持直接读取Markdown文件并自动渲染，无需手动转换JSON；添加posts-list.json配置文件管理博文列表；修改JS/posts.js和JS/post-detail.js实现Markdown文件加载和解析功能；创建博文自动化系统上线.md作为更新日志
- 2026.02.20-21: 修复posts.html页面响应式问题；整理和统一各篇博文的categories和tags；更新posts-list.json；添加博文内容（电影票价、跑步记录等）；优化表格斑马纹效果，使日间和夜间模式视觉差异更一致；修复图片404错误，更换可靠图床；调整页面元素间距，包括h2标题、导航元素、section等；给blockquote添加边框样式；修复日间模式代码块背景色缺失问题；给代码块添加行号显示，同时保留语法高亮；添加脚注功能支持，使用markdown-it-footnote插件；将观影感受从脚注转换为专门的"🎬 观影感受"部分；整理行程表中括号里的备注内容到对应部分（费用记录、运动详情、其他备注等）；优化脚注区域的间距和样式，移除悬停位移效果

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

### 2. Game-related
- **Touken Ranbu Sword Forging Simulator** (touken-forge.html): Simulates the sword forging system in the game
- **Civilization Evolution Simulator** (civilization-evolution.html): Automatically simulates the development process of multiple civilizations, showing exchanges, conflicts, and rises and falls between civilizations

### 3. Media Display
- **Video Player** (video.html): Video content display and playback

### 4. Sports-related
- **Running Records** (sports.html): Displays personal running records with Season Best (SB) and Personal Best (PB) markers, featuring collapsible season records and multi-column waterfall layout for finisher certificates, supports adding "不计入PB/SB" tag in certification field to exclude specific races from PB calculation, shows race type in race records
- **Race Performance Comparison** (sports.html): Supports same project performance comparison and same event series performance comparison, displays all-time average, best performance, worst performance, trend, and days since last race
- **Race Calendar** (sports.html): Displays different types of running races, supports monthly/yearly view switching, shows results for past races and start times for future races, displays detailed tooltips on mouse hover, includes race type legend

### 5. Learning Resources
- **Study Page** (study.html): Learning materials and notes

### 6. Blog/Articles
- **Article List** (posts.html): Blog article list display
- **Article Detail** (post-detail.html): Article content display with Markdown support

### 7. Utility Tools
- **Tools Collection** (tools.html): A collection of various practical small tools
- **Style Comparator** (style-comparison.html): Style comparison tool
- **Markdown to JSON Converter** (convert-md-to-json.html): Converts Markdown files to JSON format

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
│   ├── common/      # Common styles subdirectory
│   ├── index/       # Homepage styles subdirectory
│   ├── pace-calculator/  # Pace calculator styles subdirectory
│   ├── tools-common/     # Tools common styles subdirectory
│   ├── common.css   # Common styles
│   ├── index.css    # Homepage styles
│   ├── pace-calculator.css
│   ├── sports.css
│   ├── style-comparison.css
│   ├── tools-common.css
│   ├── tools.css
│   ├── touken-forge.css
│   ├── video.css
│   ├── convert-md-to-json.css  # Markdown converter styles
│   ├── github.min.css  # GitHub style
│   ├── post-detail.css  # Article detail styles
│   ├── posts.css       # Article list styles
│   ├── study.css       # Study page styles
│   └── civilization-evolution.css  # Civilization Evolution Simulator styles
├── JS/              # JavaScript files directory
│   ├── MathJax-3.2.2es5/  # MathJax library
│   ├── markdown/     # Markdown related functionality
│   ├── bilibili-api.js
│   ├── navigation.js
│   ├── pace-calculator.js
│   ├── theme-toggle.js
│   ├── touken-forge.js
│   ├── sports.js     # Running records functionality
│   ├── convert-md-to-json.js  # Markdown converter
│   ├── highlight.min.js  # Code highlighting
│   ├── post-detail.js  # Article detail functionality
│   ├── posts.js       # Article list functionality
│   └── civilization-evolution/  # Civilization Evolution Simulator
│       ├── civilization.js
│       ├── map.js
│       ├── simulator.js
│       ├── ui.js
│       └── main.js
├── posts/           # Blog articles directory
│   ├── markdown示例.md
│   └── posts.json
├── images/          # Image resources directory
│   ├── BV1zM41127x9.jpg
│   ├── bilibili-icon.png
│   ├── body_backgrond.jpg
│   ├── github-icon.svg
│   ├── menu-icon.svg
│   ├── test_image.jpg
│   ├── touken/      # Touken Ranbu related images
│   │   └── default_sword.jpg
│   └── weibo-icon.png
├── videos/          # Video resources directory
│   └── test_video.mp4
├── audios/          # Audio resources directory
│   └── test_audio.mp3
├── documents/       # Project documents directory
│   ├── resize.txt
│   ├── resized_files_list.txt
│   └── 时间距离配速距离计算逻辑.txt (Time-Distance-Pace Calculation Logic)
├── JSON/              # JSON data files directory
│   ├── posts.json     # Blog posts data (deprecated, backward compatible)
│   ├── posts-list.json  # Blog posts list configuration file
│   └── race-records.json  # Running records data
├── templates/       # Template files directory
├── index.html       # Website homepage
├── pace-calculator.html
├── sports.html
├── study.html
├── style-comparison.html
├── tools.html
├── touken-forge.html
├── video.html
├── convert-md-to-json.html  # Markdown converter page
├── post-detail.html  # Article detail page
├── posts.html        # Article list page
├── civilization-evolution.html  # Civilization Evolution Simulator page
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

- 2023.02.22: Project initialization
- 2025.07.18: Added style comparator tool
- 2025.07.19: Improved project documentation structure, optimized image resource management
- 2025.07.20: Updated responsive navigation system
- 2025.11.20: Added theme switching functionality (theme-toggle.js)
- 2025.11.21: Enhanced user experience and interactive features
- 2025.11.23: Refactored CSS and JS directory structure with subdirectories, updated HTML file locations to root directory
- 2025.11.27: Implemented blog article functionality (posts.html, post-detail.html), added Markdown support and mathematical formula rendering, implemented code highlighting functionality, added Markdown to JSON converter (convert-md-to-json.html)
- 2025.12.14: Added running records feature (sports.html) with SB and PB markers
- 2025.12.15: Implemented multi-column waterfall layout for finisher certificates, adjusted HTML and CSS layout of "About Me" section
- 2025.12.16: Fixed inconsistent hover effects between nav-card and skill-card in dark mode, unified visual consistency of hover effects in dark mode
- 2026.01.14: Optimized race calendar functionality, added track run color support, implemented data-driven dynamic color scheme, added race type legend, implemented mouse hover tooltips, supported auto-wrapping for long race names, showed results for past races and start times for future races
- 2026.01.19: Optimized race performance comparison functionality, added performance trend analysis for same project and same event, displayed days since last race; optimized Personal Best (PB) calculation logic, supported adding "不计入PB/SB" tag in certification field; added race type display in race records
- 2026.01.22-23: Implemented Civilization Evolution Simulator (civilization-evolution.html), optimized simulator performance, added civilization color legend and civilization card color indicators, changed project name to "多文明演化模拟器" (Civilization Evolution Simulator)
- 2026.02.06: Fixed race calendar legend display logic on sports page; removed underline from blog post H2 titles; fixed image display effects in blog posts
- 2026.02.06: Fixed category and tag links in blog detail page (changed from index.html to posts.html); unified badge style for categories and tags in blog list page; added filter info display and "Clear All" button; supported filtering multiple categories and tags simultaneously (OR logic); supported removing individual filter conditions; categories and tags in article list also support multi-select logic; blog detail page categories and tags use badge style, added "Date:" label before date
- 2026.02.06: Optimized running records functionality, added raceScore field for trail running; modified same project performance comparison to support trail running raceScore changes and ITRA performance score display; fixed trail running PB/SB label display issues; updated race calendar legend display logic to dynamically show relevant race types based on current view; modified trail running PB cards to replace pace with ITRA performance score; ensured consistent styling for ITRA performance score numbers
- 2026.02.20: Implemented blog automation system, supports direct reading of Markdown files and automatic rendering without manual JSON conversion; added posts-list.json configuration file to manage blog post list; modified JS/posts.js and JS/post-detail.js to implement Markdown file loading and parsing functionality; created 博文自动化系统上线.md as update log
- 2026.02.20-21: Fixed posts.html page responsiveness issue; organized and unified categories and tags across blog posts; updated posts-list.json; added blog post content (movie ticket prices, running records, etc.); optimized table zebra stripe effect to make visual difference between day and night modes more consistent; fixed image 404 errors by switching to reliable image host; adjusted page element spacing including h2 titles, navigation elements, sections, etc.; added border styles to blockquote; fixed missing code block background color in day mode; added line number display to code blocks while preserving syntax highlighting; added footnote functionality support using markdown-it-footnote plugin; converted movie viewing experiences from footnotes to dedicated "🎬 观影感受" section; organized parenthetical notes from schedule table into corresponding sections (expense records, sports details, other notes, etc.); optimized footnote area spacing and styles, removed hover displacement effect

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

### 2. ゲーム関連
- **刀剣乱舞刀鍛冶シミュレーター** (touken-forge.html): ゲーム内の刀鍛冶システムをシミュレート
- **多文明演化シミュレーター** (civilization-evolution.html): 複数の文明の発展プロセスを自動的にシミュレートし、文明間の交流、対立、盛衰を示す

### 3. メディア表示
- **ビデオプレイヤー** (video.html): ビデオコンテンツの表示と再生

### 4. スポーツ関連
- **ランニング記録** (sports.html): 個人のランニング記録を表示し、シーズンベスト(SB)とパーソナルベスト(PB)のマーカーをサポート、折りたたみ可能なシーズン記録機能を搭載、完走証明書は多列のウォーターフォールレイアウトで表示、特定のレースをPB計算から除外するためにcertificationフィールドに「不计入PB/SB」タグを追加できる、レース記録にレースタイプを表示
- **レース成績比較** (sports.html): 同一プロジェクトの成績変化比較と同一イベントシリーズの成績変化比較をサポート、全期間平均成績、最高成績、最低成績、傾向、および前回レースからの日数を表示
- **レースカレンダー** (sports.html): 異なるタイプのランニングレースを表示、月/年ビュー切り替えに対応、過去のレースには結果を表示、未来のレースにはスタート時間を表示、マウスホバーで詳細ツールチップを表示、レースタイプの凡例を含む

### 5. 学習リソース
- **学習ページ** (study.html): 学習資料とノート

### 6. ブログ/記事
- **記事一覧** (posts.html): ブログ記事一覧表示
- **記事詳細** (post-detail.html): Markdown形式で記事内容を表示

### 7. 便利ツール
- **ツールコレクション** (tools.html): 様々な実用的な小さなツールの集合
- **スタイル比較ツール** (style-comparison.html): スタイル比較ツール
- **MarkdownからJSONへの変換ツール** (convert-md-to-json.html): MarkdownファイルをJSON形式に変換

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
│   ├── common/      # 共通スタイルサブディレクトリ
│   ├── index/       # ホームページスタイルサブディレクトリ
│   ├── pace-calculator/  # ペース計算機スタイルサブディレクトリ
│   ├── tools-common/     # ツール共通スタイルサブディレクトリ
│   ├── common.css   # 共通スタイル
│   ├── index.css    # ホームページスタイル
│   ├── pace-calculator.css
│   ├── sports.css
│   ├── style-comparison.css
│   ├── tools-common.css
│   ├── tools.css
│   ├── touken-forge.css
│   ├── video.css
│   ├── convert-md-to-json.css  # Markdown変換ツールスタイル
│   ├── github.min.css  # GitHubスタイル
│   ├── post-detail.css  # 記事詳細スタイル
│   ├── posts.css       # 記事一覧スタイル
│   ├── study.css       # 学習ページスタイル
│   └── civilization-evolution.css  # 多文明演化シミュレータースタイル
├── JS/              # JavaScriptファイルディレクトリ
│   ├── MathJax-3.2.2es5/  # MathJaxライブラリ
│   ├── markdown/     # Markdown関連機能
│   ├── bilibili-api.js
│   ├── navigation.js
│   ├── pace-calculator.js
│   ├── theme-toggle.js
│   ├── touken-forge.js
│   ├── sports.js     # ランニング記録機能
│   ├── convert-md-to-json.js  # Markdown変換ツール
│   ├── highlight.min.js  # コードハイライト
│   ├── post-detail.js  # 記事詳細機能
│   ├── posts.js       # 記事一覧機能
│   └── civilization-evolution/  # 多文明演化シミュレーター
│       ├── civilization.js
│       ├── map.js
│       ├── simulator.js
│       ├── ui.js
│       └── main.js
├── posts/           # ブログ記事ディレクトリ
│   ├── markdown示例.md
│   └── posts.json
├── images/          # 画像リソースディレクトリ
│   ├── BV1zM41127x9.jpg
│   ├── bilibili-icon.png
│   ├── body_backgrond.jpg
│   ├── github-icon.svg
│   ├── menu-icon.svg
│   ├── test_image.jpg
│   ├── touken/      # 刀剣乱舞関連画像
│   │   └── default_sword.jpg
│   └── weibo-icon.png
├── videos/          # 動画リソースディレクトリ
│   └── test_video.mp4
├── audios/          # 音声リソースディレクトリ
│   └── test_audio.mp3
├── documents/       # プロジェクトドキュメントディレクトリ
│   ├── resize.txt
│   ├── resized_files_list.txt
│   └── 时间距离配速距离计算逻辑.txt (時間-距離-ペース計算ロジック)
├── JSON/              # JSONデータファイルディレクトリ
│   ├── posts.json     # ブログ記事データ（非推奨、後方互換）
│   ├── posts-list.json  # ブログ記事リスト設定ファイル
│   └── race-records.json  # ランニング記録データ
├── templates/       # テンプレートファイルディレクトリ
├── index.html       # ウェブサイトホームページ
├── pace-calculator.html
├── sports.html
├── study.html
├── style-comparison.html
├── tools.html
├── touken-forge.html
├── video.html
├── convert-md-to-json.html  # Markdown変換ツールページ
├── post-detail.html  # 記事詳細ページ
├── posts.html        # 記事一覧ページ
├── civilization-evolution.html  # 多文明演化シミュレーターページ
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

- 2023.02.22: プロジェクト初期化
- 2025.07.18: スタイル比較ツールの追加
- 2025.07.19: プロジェクトドキュメント構造の改善、画像リソース管理の最適化
- 2025.07.20: レスポンシブナビゲーションシステムの更新
- 2025.11.20: テーマ切り替え機能の追加 (theme-toggle.js)
- 2025.11.21: ユーザーエクスペリエンスとインタラクティブ機能の強化
- 2025.11.23: CSSとJSのディレクトリ構造をリファクタリング、サブディレクトリ管理を追加、HTMLファイルの位置をルートディレクトリに更新
- 2025.11.27: ブログ記事機能 (posts.html, post-detail.html) の実装、Markdownサポートと数式レンダリングの追加、コードハイライト機能の実装、MarkdownからJSONへの変換ツールの追加 (convert-md-to-json.html)
- 2025.12.14: ランニング記録機能 (sports.html) の追加、SBとPBのマーカーをサポート
- 2025.12.15: 完走証明書に多列のウォーターフォールレイアウトを実装、「About Me」セクションのHTMLとCSSレイアウトを調整
- 2025.12.16: ダークモードでのnav-cardとskill-cardのホバー効果の不一致を修正、ダークモードでのホバー効果の視覚的一貫性を統一
- 2026.01.14: レースカレンダー機能を最適化、トラックランの配色サポートを追加、データ駆動の動的配色スキームを実装、レースタイプ凡例を追加、マウスホバーツールチップを実装、長いレース名の自動折り返しをサポート、過去のレースには結果を表示、未来のレースにはスタート時間を表示
- 2026.01.19: レース成績比較機能を最適化、同一プロジェクトと同一イベントの成績傾向分析を追加、前回レースからの日数を表示；パーソナルベスト(PB)計算ロジックを最適化、特定のレースをPB計算から除外するためにcertificationフィールドに「不计入PB/SB」タグを追加できるようにサポート；レース記録にレースタイプ表示を追加
- 2026.01.22-23: 多文明演化シミュレーター(civilization-evolution.html)を実装、複数の文明の発展プロセスを自動的にシミュレート；多文明演化シミュレーターのパフォーマンスを最適化、文明の色の凡例と文明カードの色インジケーターを追加；プロジェクト名を「多文明文字演化シミュレーター」から「多文明演化シミュレーター」に変更
- 2026.02.06: スポーツページのレースカレンダー凡例の表示ロジックを修正；ブログ記事のH2タイトルの下線を削除；ブログ記事の画像表示効果を修正
- 2026.02.06: ブログ詳細ページのカテゴリとタグのリンクを修正（index.htmlからposts.htmlへ変更）；ブログ一覧ページのカテゴリとタグを統一されたbadgeスタイルに変更；フィルター情報表示と「すべてクリア」ボタンを追加；複数のカテゴリとタグを同時にフィルタリング可能に（OR論理）；個別のフィルター条件を削除可能に；記事一覧のカテゴリとタグも複数選択ロジックをサポート；ブログ詳細ページのカテゴリとタグはbadgeスタイルを使用、日付の前に「日付：」ラベルを追加
- 2026.02.06: ランニング記録機能を最適化、トレイルランにraceScoreフィールドを追加；同一プロジェクトの成績比較を変更し、トレイルランのraceScore変化とITRAパフォーマンススコアの表示をサポート；トレイルランのPB/SBラベルの表示問題を修正；レースカレンダーの凡例の表示ロジックを更新、現在のビューに基づいて関連するレースタイプを動的に表示；トレイルランのPBカードを変更、ペースをITRAパフォーマンススコアに置き換え；ITRAパフォーマンススコアの数値のスタイルの一貫性を確保
- 2026.02.20: ブログ自動化システムを実装、Markdownファイルを直接読み込み自動レンダリングをサポート、手動JSON変換が不要；posts-list.json設定ファイルを追加してブログ記事リストを管理；JS/posts.jsとJS/post-detail.jsを変更してMarkdownファイルの読み込みと解析機能を実装；博文自动化系统上线.mdを更新ログとして作成
- 2026.02.20-21: posts.htmlページのレスポンシブ問題を修正；各ブログ記事のcategoriesとtagsを整理して統一；posts-list.jsonを更新；ブログ記事コンテンツを追加（映画チケット価格、ランニング記録など）；テーブルのゼブラストライプ効果を最適化し、デイモードとナイトモードの視覚的な違いをより一致させる；信頼できる画像ホストに切り替えて画像404エラーを修正；h2タイトル、ナビゲーション要素、セクションなどのページ要素の間隔を調整；blockquoteにボーダースタイルを追加；デイモードでのコードブロック背景色の欠落を修正；構文ハイライトを保持したままコードブロックに行番号表示を追加；markdown-it-footnoteプラグインを使用して脚注機能サポートを追加；映画鑑賞体験を脚注から専用の"🎬 观影感受"セクションに変換；スケジュールテーブルの括弧内のメモを対応するセクション（費用記録、スポーツ詳細、その他のメモなど）に整理；脚注領域の間隔とスタイルを最適化、ホバー変位効果を削除

## 使用方法

[woshicby.github.io](https://woshicby.github.io) に直接アクセスして、ウェブサイトのコンテンツを閲覧できます。

## 開発ノート

### レスポンシブナビゲーション

ウェブサイトはレスポンシブナビゲーションシステムを採用しており、モバイルデバイスでは自動的にハンバーガーメニューに変換されます。ナビゲーション機能は `JS/navigation.js` を通じて実装されており、関連するスタイルは `CSS/common.css` に定義されています。

### テーマ切り替え

ウェブサイトはダーク/ライトテーマ切り替え機能をサポートしており、`JS/theme-toggle.js` を通じて実装されています。ユーザーは、好みや環境に応じて異なる表示モードを切り替えることができます。

### ページ開発

新しいページを追加する場合は、既存のファイル構造と命名規則に従い、共通のスタイルとナビゲーション機能が適切に含まれていることを確認してください。新しいページはレスポンシブデザインとテーマ切り替え機能をサポートする必要があります。
