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

### 4. 赛事相关
- **跑步记录** (races.html): 展示个人跑步记录，支持赛季最佳(SB)和个人最佳(PB)标记，可折叠的赛季记录展示，完赛证书采用多列瀑布流布局展示，支持在certification字段添加"不计入PB/SB"标签排除特定赛事，赛事记录中显示赛事类型，越野跑支持raceScore和ITRA表现指数
- **成绩变化对比** (races.html): 支持同一项目成绩变化对比和同一赛事成绩变化对比，显示全部平均成绩、最佳成绩、最差成绩、变化趋势和上次参赛天数
- **赛事日历** (races.html): 展示不同类型的跑步赛事，支持按月/年切换视图，过去赛事显示成绩，未来赛事显示起跑时间，鼠标悬停显示详情提示框，包含赛事类型图例，支持待抽签赛事分区展示与出签日期显示

### 5. 学习资源
- **学习页面** (study.html): 学习资料和笔记，支持动态加载与筛选

### 6. 博客/文章
- **文章列表** (posts.html): 博客文章列表展示，支持系列分类、时间线归档视图、无限滚动加载
- **文章详情** (post-detail.html): 文章详细内容展示，支持Markdown格式
- **灵感碎片** (moments.html): 灵感碎片展示，支持文字/图片/音频/视频、标签筛选、点击查看详情弹窗、媒体控件（播放/暂停、拖进度、倍速、音量）与卡片状态实时同步

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
├── CSS/             # 样式文件目录(按层级+域组织)
│   ├── common.css         # 全站公共入口(@import common/)
│   ├── common/            # 全站公共模块
│   │   ├── common-selectors.css  # 基础选择器/通用组件
│   │   ├── common-responsive.css # 响应式布局
│   │   └── common-dark-theme.css # 深色主题
│   ├── domains/           # 域公共样式
│   │   ├── tools.css      # 工具/游戏域
│   │   ├── sports-common.css    # 运动域基础
│   │   └── sports.css     # 运动子页导航
│   ├── pages/             # 页面独有样式(28个)
│   │   ├── posts.css / reviews.css / moments.css ...
│   ├── vendor/            # 第三方库
│   │   └── github.min.css # GitHub风格代码高亮
│   ├── index.css / index/ # 首页专用(@import index/)
│   └── README.md          # 样式规范说明
├── JS/              # JavaScript文件目录(按层级+域组织)
│   ├── common/            # 全站公共(所有页面加载)
│   │   ├── theme-toggle.js      # 主题切换
│   │   ├── navigation.js        # 导航
│   │   ├── background-lazy-load.js  # 背景懒加载
│   │   └── common.js            # 通用函数/基类(fetchJSON/FilterableListManager)
│   ├── domains/           # 域公共
│   │   ├── tool-tabs.js   # 工具页标签导航
│   │   ├── sports-config.js     # 运动配置
│   │   └── sports-common.js     # 运动共享逻辑
│   ├── pages/             # 页面独有(26个)
│   │   ├── posts.js / reviews.js / moments.js ...
│   ├── vendor/            # 第三方库
│   │   ├── highlight.min.js     # 代码高亮
│   │   ├── markdown/     # Markdown解析(markdown-it及扩展)
│   │   └── MathJax-3.2.2es5/  # MathJax数学公式库
│   ├── civilization-evolution/  # 多文明模拟器(独立子目录)
│   └── README.md          # 脚本规范说明
├── JSON/              # JSON数据文件目录
│   ├── games.json        # 游戏数据
│   ├── moments.json      # 灵感碎片数据
│   ├── posts.json        # 博客文章数据（已废弃，向后兼容）
│   ├── posts-list.json   # 博客文章列表配置文件
│   ├── posts-series.json # 博客系列配置文件
│   ├── race-records.json # 跑步记录数据
│   ├── review-movies.json / review-games.json 等  # 书影音游剧记录
│   ├── sports-activities.json  # 运动活动数据
│   ├── sports-world.zh.json / sports-china_provinces.json / sports-china_cities.json  # 地图着色数据
│   ├── sample-posts.json # 示例博文数据（加载失败回退）
│   ├── seo-pages.json    # SEO页面配置
│   ├── study-data.json   # 学习页面数据
│   ├── tickets.json / ticket-images.json  # 票据与票据图片映射
│   └── tools.json        # 工具数据
├── posts/           # 博客文章目录
│   └── *.md        # Markdown格式博文
├── images/          # 图片资源目录
│   ├── finisher_certificates/  # 完赛证书图片
│   ├── moments/     # 灵感碎片图片
│   ├── tickets/     # 票据图片
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
│   └── moments/     # 灵感碎片视频
├── activities_detail/  # 运动活动详情数据（前端渲染用）
├── documents/       # 项目文档目录
│   ├── resize.txt
│   ├── resized_files_list.txt
│   ├── 时间距离配速距离计算逻辑.txt
│   └── 武林外传剧本全.md
├── index.html       # 网站首页
├── pace-calculator.html
├── time-calculator.html
├── life-path-calculator.html
├── races.html
├── sports.html / sports-active.html / sports-activity.html / sports-volume.html
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
├── reviews.html
├── tickets.html
├── convert-md-to-json.html
├── seo-checker.html
├── random-decision.html
├── dice-tool.html
├── local-llm-api-chat.html
└── README.md        # 项目说明文档
```

> **scripts/ 与本地维护**: 仓库另有 `scripts/`(维护脚本)、`FIT/`(运动源数据)、`data.db`(同步数据库)等**本地维护文件**,不进 git(见 scripts/README.md)。日常维护通过桌面快捷方式双击运行(运动同步/票据图片/网站预览)。

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
| 2026.01.19 | 优化成绩变化对比功能，添加同一项目和同一赛事的成绩变化趋势分析，显示上次参赛多少天前；优化个人最佳成绩(PB)统计逻辑，支持在certification字段添加"不计入PB/SB"标签排除特定赛事；在赛事记录中添加赛事类型显示 |
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
| 2026.04.20 | 添加时间计算器工具(time-calculator.html) |
| 2026.04.23 | 新增生命灵数计算器(life-path-calculator.html)，支持生日输入、逐位相加计算过程展示、大师数识别及灵数含义说明 |
| 2026.05.04 | 添加博文系列功能并优化博文列表页面：新增系列分类展示、时间线归档视图、无限滚动加载、回到顶部按钮，更新相关JSON和样式 |
| 2026.05.08 | 添加武林外传接台词游戏(wulin-quotes.html)和台词查询工具，支持多难度模式、角色筛选、台词搜索功能 |
| 2026.05.20 | 添加待抽签赛事管理与展示功能：新增待抽签赛事状态判断逻辑与日历样式；过滤已完赛赛事用于PB/SB计算和图表统计；补全赛事数据的status字段并新增待抽签赛事 |
| 2026.05.26 | 新增Emoji渲染器工具(emoji-renderer.html)，支持多平台风格渲染与高清导出 |
| 2026.05.29 | 重构赛事日历模块：新增实时倒计时系统（支持页面可见性适配）；卡片式UI替代旧版布局；新增状态徽章区分已报名/待抽签/已完赛等状态；补全startTime字段；优化移动端响应式布局 |
| 2026.05.31 | 重构导航栏逻辑，新增动态生成导航菜单功能：重写navigation.js，使用配置化方式管理导航项；统一所有页面的导航栏结构，移除硬编码的导航链接；新增书影音游剧记录页面(reviews.html)及相关配套资源；修复部分页面导航缩进不一致的问题 |
| 2026.06.02 | 新增赛事待报名状态支持与筛选功能：新增待报名赛事样式与状态标识；重构赛事默认选中逻辑，按最新参赛日期选择默认项目/赛事系列；完善日历视图筛选功能，支持按全部/已参赛/未参赛状态筛选，未显示赛事日期以灰色标识；优化赛事提示框，支持多赛事同时展示并添加分隔线；新增TBC（待定）日期赛事支持，倒计时显示∞ |
| 2026.06.03 | 书影音游剧记录页面筛选系统增强：新增快速筛选（评分状态、时间范围）与高级筛选（评分等级、地区、标签）两级筛选体系；评分制从5星制改为10分制，均分统计排除未评分项目，默认仅显示已评分项目；地区筛选支持空格分隔的多地区匹配；格式化JSON数据文件缩进 |
| 2026.06.19 | 体育运动页面大升级：新增运动活动详情页(sports-activity.html)和运动量统计页(sports-volume.html)；数据文件整合迁移至项目根目录；HTML语义化重构，去除冗余包裹层；统一返回按钮样式，活动页返回按钮根据来源页面动态显示；侧边栏统计数据根据运动类型和时间间隔筛选同步更新，取消显示数量限制；修复导航按钮被浮动元素挤到右侧的问题；删除比赛页面底部"最近活动"section，统一"查看活动"按钮样式；修复夜间模式下比赛页面标签底色和图表文字颜色；将race-records.json中stravaLink替换为本地活动链接；修复活动页面URL参数(runId→id)；同步脚本配置统一到config.py，消除所有硬编码 |
| 2026.07.09 | 批量优化：修正posts列表文件名互换问题；优化地图缩放防抖逻辑；为运动数据添加高度平滑处理；重构背景滚动实现方案；新增视频对轨计算工具；调整部分CSS过渡动画与悬停效果 |
| 2026.07.28 | 评分系统优化：书影音评分系统重构，统一评分数据与展示逻辑；时间计算器样式与功能完善；新增.gitignore文件 |
| 2026.08.02 | 书影音游剧记录支持多刷/重映评价分开展示，同一作品多次观看记录独立渲染并配等级印章（11档配色）；博客系统简化加载逻辑，移除posts.json中间层直接由posts-list.json索引读取md文件；修复含特殊字符(%)文件名的URL编码问题 |
| 2026.08.16 | 灵感碎片页面增强：新增详情弹窗与媒体镜像控件（播放/暂停、拖进度、倍速、音量，与卡片媒体状态双向同步）；预读媒体尺寸实现首帧即正确布局，消除加载闪烁；新增本地预览服务器(scripts/preview_server.py，no-cache + Clear-Site-Data) |
| 2026.08.17 | 票据关联字段改名refId→subjectId；运动地图三级着色（国家/省份/城市按缩放切换）；位置判断统一Nominatim(网络+缓存)；scripts维护脚本统一venv+统一入口run.sh+桌面快捷方式；git历史规范化（155→20 commit）；CSS/JS目录重构（common/domains/pages/vendor分层+加载规则统一）；CSS全量变量化（语义色集中、间距/字号/圆角档位化、阴影/字重统一、同义表达收敛、历史别名清理，266变量零未定义引用）；响应式断点统一（480/600/768/900/1200/1800六级）；返回顶部按钮全站统一（独立back-to-top.js）；新增404页面；修复深色模式二级别名bug；修复22/23博文编号与内容交叉；og标签全覆盖 |

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

### 4. Race-related
- **Running Records** (races.html): Displays personal running records with Season Best (SB) and Personal Best (PB) markers, featuring collapsible season records and multi-column waterfall layout for finisher certificates, supports adding "不计入PB/SB" tag in certification field to exclude specific races from PB calculation, shows race type in race records, trail running supports raceScore and ITRA performance index
- **Race Performance Comparison** (races.html): Supports same project performance comparison and same event series performance comparison, displays all-time average, best performance, worst performance, trend, and days since last race
- **Race Calendar** (races.html): Displays different types of running races, supports monthly/yearly view switching, shows results for past races and start times for future races, displays detailed tooltips on mouse hover, includes race type legend, supports pending lottery race section display with draw date

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
├── CSS/             # Styles organized by layer & domain
│   ├── common.css         # Global entry (@import common/)
│   ├── common/            # Global modules (selectors/responsive/dark)
│   ├── domains/           # Domain styles (tools/sports)
│   ├── pages/             # Page-specific styles (28 files)
│   ├── vendor/            # Third-party (github.min.css)
│   ├── index.css / index/ # Homepage specific
│   └── README.md          # Styling conventions
├── JS/              # JavaScript organized by layer & domain
│   ├── common/            # Global (theme-toggle/navigation/background/common)
│   ├── domains/           # Domain modules (tool-tabs/sports-config/sports-common)
│   ├── pages/             # Page-specific scripts (26 files)
│   ├── vendor/            # Third-party (highlight/markdown/MathJax)
│   ├── civilization-evolution/  # Simulator (separate dir)
│   └── README.md          # Script conventions
├── JSON/             # Data files (UTF-8 BOM)
├── posts/            # Blog posts (Markdown, numbered)
├── images/ / audios/ / videos/   # Media resources
├── activities_detail/   # Sports activity details (generated)
├── documents/       # Misc docs
├── *.html           # Pages at root
└── README.md        # Project documentation
```

> See the [Chinese version](#chinese) for detailed directory listing.
## Website Features

- **Responsive Navigation**: Mobile-adapted hamburger menu navigation
- **Modular Design**: Reuse of common components and styles
- **Theme Switching**: Support for dark/light modes, enhancing user experience
- **Interactive Experience**: Dynamic effects and user interactions
- **Resource Optimization**: Reasonable organization of image and media resources
- **Comprehensive Documentation**: Detailed README documentation for each directory

## Update History

See the [Chinese version](#chinese) for the full update history (latest updates are recorded there only).

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

### 4. レース関連
- **ランニング記録** (races.html): 個人のランニング記録を表示し、シーズンベスト(SB)とパーソナルベスト(PB)のマーカーをサポート、折りたたみ可能なシーズン記録機能を搭載、完走証明書は多列のウォーターフォールレイアウトで表示、特定のレースをPB計算から除外するためにcertificationフィールドに「不计入PB/SB」タグを追加できる、レース記録にレースタイプを表示、トレイルランはraceScoreとITRAパフォーマンス指数をサポート
- **レース成績比較** (races.html): 同一プロジェクトの成績変化比較と同一イベントシリーズの成績変化比較をサポート、全期間平均成績、最高成績、最低成績、傾向、および前回レースからの日数を表示
- **レースカレンダー** (races.html): 異なるタイプのランニングレースを表示、月/年ビュー切り替えに対応、過去のレースには結果を表示、未来のレースにはスタート時間を表示、マウスホバーで詳細ツールチップを表示、レースタイプの凡例を含む、抽選待ちレースのセクション表示と抽選日表示をサポート

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
├── CSS/             # レイヤー・ドメイン別に整理
│   ├── common.css         # 全体共通エントリ(@import common/)
│   ├── common/            # 共通モジュール(セレクタ/レスポンシブ/ダーク)
│   ├── domains/           # ドメイン別(tools/sports)
│   ├── pages/             # ページ別スタイル(28ファイル)
│   ├── vendor/            # サードパーティ(github.min.css)
│   ├── index.css / index/ # ホームページ専用
│   └── README.md          # スタイル規約
├── JS/              # レイヤー・ドメイン別に整理
│   ├── common/            # 全体共通(theme-toggle/navigation/background/common)
│   ├── domains/           # ドメインモジュール(tool-tabs/sports-config/sports-common)
│   ├── pages/             # ページ別スクリプト(26ファイル)
│   ├── vendor/            # サードパーティ(highlight/markdown/MathJax)
│   ├── civilization-evolution/  # シミュレーター(独立ディレクトリ)
│   └── README.md          # スクリプト規約
├── JSON/             # データファイル(UTF-8 BOM)
├── posts/            # ブログ記事(Markdown、番号付き)
├── images/ / audios/ / videos/   # メディアリソース
├── activities_detail/   # 運動アクティビティ詳細(生成物)
├── documents/       # その他ドキュメント
├── *.html           # ルート直下のページ
└── README.md        # プロジェクトドキュメント
```

> 詳細なディレクトリ一覧は[中国語版](#chinese)を参照してください。
## ウェブサイトの特徴

- **レスポンシブナビゲーション**: モバイルデバイスに適応するハンバーガーメニューナビゲーション
- **モジュラー設計**: 共通コンポーネントとスタイルの再利用
- **テーマ切り替え**: ダーク/ライトモードのサポート、ユーザーエクスペリエンスの向上
- **インタラクティブ体験**: 動的効果とユーザーインタラクション
- **リソース最適化**: 画像とメディアリソースの適切な整理
- **包括的なドキュメント**: 各ディレクトリの詳細なREADMEドキュメント

## 更新履歴

最新の更新履歴は[中国語版](#chinese)を参照してください（更新履歴は中国語版のみに記録されます）。

## 使用方法

[woshicby.github.io](https://woshicby.github.io) に直接アクセスして、ウェブサイトのコンテンツを閲覧できます。

## 開発ノート

### レスポンシブナビゲーション

ウェブサイトはレスポンシブナビゲーションシステムを採用しており、モバイルデバイスでは自動的にハンバーガーメニューに変換されます。ナビゲーション機能は `JS/navigation.js` を通じて実装されており、関連するスタイルは `CSS/common.css` に定義されています。

### テーマ切り替え

ウェブサイトはダーク/ライトテーマ切り替え機能をサポートしており、`JS/theme-toggle.js` を通じて実装されています。ユーザーは、好みや環境に応じて異なる表示モードを切り替えることができます。

### ページ開発

新しいページを追加する場合は、既存のファイル構造と命名規則に従い、共通のスタイルとナビゲーション機能が適切に含まれていることを確認してください。新しいページはレスポンシブデザインとテーマ切り替え機能をサポートする必要があります。
