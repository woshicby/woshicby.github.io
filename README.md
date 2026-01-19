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

### 3. 媒体展示
- **视频播放器** (video.html): 视频内容展示和播放

### 4. 体育相关
- **跑步记录** (sports.html): 展示个人跑步记录，支持赛季最佳(SB)和个人最佳(PB)标记，可折叠的赛季记录展示，完赛证书采用多列瀑布流布局展示，支持在certification字段添加"不计入PB/SB"标签排除特定赛事
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
│   └── study.css       # 学习页面样式
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
│   └── posts.js       # 文章列表功能
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
│   ├── 时间距离配速距离计算逻辑.txt
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
- 2025.07.19: 完善项目文档结构
- 2025.07.19: 优化图片资源管理
- 2025.07.20: 更新响应式导航系统
- 2025.11.20: 添加主题切换功能 (theme-toggle.js)
- 2025.11.21: 增强用户体验和交互功能
- 2025.11.23: 重构CSS和JS目录结构，添加子目录管理
- 2025.11.23: 更新HTML文件位置到根目录
- 2025.11.27: 实现博客文章功能 (posts.html, post-detail.html)
- 2025.11.27: 添加Markdown支持和数学公式渲染
- 2025.11.27: 实现代码高亮功能
- 2025.11.27: 添加Markdown转换工具 (convert-md-to-json.html)
- 2025.12.14: 添加跑步记录功能 (sports.html)，支持赛季最佳和个人最佳标记
- 2025.12.15: 完赛证书采用多列瀑布流布局展示，提升视觉体验和空间利用率
- 2025.12.15: 调整个人简介区域的HTML和CSS布局，优化标题和内容排列
- 2025.12.16: 修复夜间模式下nav-card和skill-card悬停效果的不一致问题
- 2025.12.16: 统一了夜间模式悬停效果的视觉一致性
- 2026.01.14: 优化赛事日历功能，添加场地跑配色支持，实现数据驱动的动态配色方案，添加赛事类型图例，实现鼠标悬停提示框，支持长赛事名称自动换行，过去赛事显示成绩，未来赛事显示起跑时间
- 2026.01.19: 优化成绩变化对比功能，添加同一项目和同一赛事的成绩变化趋势分析，显示上次参赛多少天前
- 2026.01.19: 优化个人最佳成绩(PB)统计逻辑，支持在certification字段添加"不计入PB/SB"标签排除特定赛事

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

### 3. Media Display
- **Video Player** (video.html): Video content display and playback

### 4. Sports-related
- **Running Records** (sports.html): Displays personal running records with Season Best (SB) and Personal Best (PB) markers, featuring collapsible season records and multi-column waterfall layout for finisher certificates, supports adding "不计入PB/SB" tag in certification field to exclude specific races from PB calculation
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
│   └── study.css       # Study page styles
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
│   └── posts.js       # Article list functionality
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
│   ├── 时间距离配速距离计算逻辑.txt (Time-Distance-Pace Calculation Logic)
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
- 2025.07.19: Improved project documentation structure
- 2025.07.19: Optimized image resource management
- 2025.07.20: Updated responsive navigation system
- 2025.11.20: Added theme switching functionality (theme-toggle.js)
- 2025.11.21: Enhanced user experience and interactive features
- 2025.11.23: Refactored CSS and JS directory structure with subdirectories
- 2025.11.23: Updated HTML file locations to root directory
- 2025.11.27: Implemented blog article functionality (posts.html, post-detail.html)
- 2025.11.27: Added Markdown support and mathematical formula rendering
- 2025.11.27: Implemented code highlighting functionality
- 2025.11.27: Added Markdown to JSON converter (convert-md-to-json.html)
- 2025.12.14: Added running records feature (sports.html) with SB and PB markers
- 2025.12.15: Implemented multi-column waterfall layout for finisher certificates, improving visual experience and space utilization
- 2025.12.15: Adjusted HTML and CSS layout of "About Me" section, optimizing title and content arrangement
- 2025.12.16: Fixed inconsistent hover effects between nav-card and skill-card in dark mode
- 2025.12.16: Unified visual consistency of hover effects in dark mode
- 2026.01.14: Optimized race calendar functionality, added track run color support, implemented data-driven dynamic color scheme, added race type legend, implemented mouse hover tooltips, supported auto-wrapping for long race names, showed results for past races and start times for future races
- 2026.01.19: Optimized race performance comparison functionality, added performance trend analysis for same project and same event, displayed days since last race
- 2026.01.19: Optimized Personal Best (PB) calculation logic, supported adding "不计入PB/SB" tag in certification field to exclude specific races from PB/SB calculation

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

### 3. メディア表示
- **ビデオプレイヤー** (video.html): ビデオコンテンツの表示と再生

### 4. スポーツ関連
- **ランニング記録** (sports.html): 個人のランニング記録を表示し、シーズンベスト(SB)とパーソナルベスト(PB)のマーカーをサポート、折りたたみ可能なシーズン記録機能を搭載、完走証明書は多列のウォーターフォールレイアウトで表示、特定のレースをPB計算から除外するためにcertificationフィールドに「不计入PB/SB」タグを追加できる
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
│   └── study.css       # 学習ページスタイル
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
│   └── posts.js       # 記事一覧機能
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
│   ├── 时间距离配速距离计算逻辑.txt (時間-距離-ペース計算ロジック)
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
- 2025.07.19: プロジェクトドキュメント構造の改善
- 2025.07.19: 画像リソース管理の最適化
- 2025.07.20: レスポンシブナビゲーションシステムの更新
- 2025.11.20: テーマ切り替え機能の追加 (theme-toggle.js)
- 2025.11.21: ユーザーエクスペリエンスとインタラクティブ機能の強化
- 2025.11.23: CSSとJSのディレクトリ構造をリファクタリング、サブディレクトリ管理を追加
- 2025.11.23: HTMLファイルの位置をルートディレクトリに更新
- 2025.11.27: ブログ記事機能 (posts.html, post-detail.html) の実装
- 2025.11.27: Markdownサポートと数式レンダリングの追加
- 2025.11.27: コードハイライト機能の実装
- 2025.11.27: MarkdownからJSONへの変換ツールの追加 (convert-md-to-json.html)
- 2025.12.14: ランニング記録機能 (sports.html) の追加、SBとPBのマーカーをサポート
- 2025.12.15: 完走証明書に多列のウォーターフォールレイアウトを実装、視覚体験とスペース利用率を向上
- 2025.12.15: 「About Me」セクションのHTMLとCSSレイアウトを調整、タイトルとコンテンツの配置を最適化
- 2025.12.16: ダークモードでのnav-cardとskill-cardのホバー効果の不一致を修正
- 2025.12.16: ダークモードでのホバー効果の視覚的一貫性を統一
- 2026.01.14: レースカレンダー機能を最適化、トラックランの配色サポートを追加、データ駆動の動的配色スキームを実装、レースタイプ凡例を追加、マウスホバーツールチップを実装、長いレース名の自動折り返しをサポート、過去のレースには結果を表示、未来のレースにはスタート時間を表示
- 2026.01.19: レース成績比較機能を最適化、同一プロジェクトと同一イベントの成績傾向分析を追加、前回レースからの日数を表示
- 2026.01.19: パーソナルベスト(PB)計算ロジックを最適化、特定のレースをPB計算から除外するためにcertificationフィールドに「不计入PB/SB」タグを追加できるようにサポート

## 使用方法

[woshicby.github.io](https://woshicby.github.io) に直接アクセスして、ウェブサイトのコンテンツを閲覧できます。

## 開発ノート

### レスポンシブナビゲーション

ウェブサイトはレスポンシブナビゲーションシステムを採用しており、モバイルデバイスでは自動的にハンバーガーメニューに変換されます。ナビゲーション機能は `JS/navigation.js` を通じて実装されており、関連するスタイルは `CSS/common.css` に定義されています。

### テーマ切り替え

ウェブサイトはダーク/ライトテーマ切り替え機能をサポートしており、`JS/theme-toggle.js` を通じて実装されています。ユーザーは、好みや環境に応じて異なる表示モードを切り替えることができます。

### ページ開発

新しいページを追加する場合は、既存のファイル構造と命名規則に従い、共通のスタイルとナビゲーション機能が適切に含まれていることを確認してください。新しいページはレスポンシブデザインとテーマ切り替え機能をサポートする必要があります。
