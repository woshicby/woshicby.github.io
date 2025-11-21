# woshicby.github.io

## 语言切换 / Language Switch / 言語切り替え

<a href="#chinese" style="text-decoration: none; padding: 5px 10px; margin: 0 5px; background-color: #f0f0f0; border-radius: 4px;">中文 / Chinese</a>
<a href="#english" style="text-decoration: none; padding: 5px 10px; margin: 0 5px; background-color: #f0f0f0; border-radius: 4px;">English (AI Generated)</a>
<a href="#japanese" style="text-decoration: none; padding: 5px 10px; margin: 0 5px; background-color: #f0f0f0; border-radius: 4px;">日本語 (AI生成)</a>

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
- **体育页面** (sports.html): 体育相关内容

### 4. 学习资源
- **学习页面** (study.html): 学习资料和笔记

### 5. 实用工具
- **工具集** (tools.html): 各种实用小工具集合
- **样式比较器** (style-comparison.html): 样式对比工具

## 技术栈

- **HTML5**: 页面结构和语义化标记
- **CSS3**: 样式和响应式设计
- **JavaScript**: 交互功能和动态内容
- **响应式设计**: 适配移动设备和桌面设备
- **外部API**: 集成B站API等第三方服务
- **主题切换**: 支持深色/浅色模式切换功能

## 项目结构

```
woshicby.github.io/
├── CSS/             # 样式文件目录
│   ├── common.css   # 公共样式
│   ├── index.css    # 首页样式
│   ├── pace-calculator.css
│   ├── sports.css
│   ├── style-comparison.css
│   ├── tools-common.css
│   ├── tools.css
│   ├── touken-forge.css
│   ├── video.css
│   └── README.md
├── HTML/            # HTML页面目录
│   ├── pace-calculator.html
│   ├── sports.html
│   ├── study.html
│   ├── style-comparison.html
│   ├── tools.html
│   ├── touken-forge.html
│   ├── video.html
│   └── README.md
├── JS/              # JavaScript文件目录
│   ├── bilibili-api.js
│   ├── navigation.js
│   ├── pace-calculator.js
│   ├── theme-toggle.js
│   ├── touken-forge.js
│   └── README.md
├── images/          # 图片资源目录
│   ├── BV1zM41127x9.jpg
│   ├── bilibili-icon.png
│   ├── body_backgrond.jpg
│   ├── github-icon.svg
│   ├── menu-icon.svg
│   ├── test_image.jpg
│   ├── touken/      # 刀剑乱舞相关图片
│   │   ├── default_sword.jpg
│   │   ├── 刀账图标/
│   │   └── README.md
│   ├── weibo-icon.png
│   └── README.md
├── videos/          # 视频资源目录
│   ├── test_video.mp4
│   └── README.md
├── audios/          # 音频资源目录
│   ├── test_audio.mp3
│   └── README.md
├── documents/       # 项目文档目录
│   ├── resize.txt
│   ├── resized_files_list.txt
│   └── 时间距离配速距离计算逻辑.txt
├── index.html       # 网站首页
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
- 更新响应式导航系统
- 修复CSS样式错误
- 增强用户体验和交互功能
- 添加样式比较器工具
- 完善项目文档结构
- 优化图片资源管理
- 添加主题切换功能 (theme-toggle.js)

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
- **Sports Page** (sports.html): Sports-related content

### 4. Learning Resources
- **Study Page** (study.html): Learning materials and notes

### 5. Utility Tools
- **Tools Collection** (tools.html): A collection of various practical small tools
- **Style Comparator** (style-comparison.html): Style comparison tool

## Technology Stack

- **HTML5**: Page structure and semantic markup
- **CSS3**: Styling and responsive design
- **JavaScript**: Interactive functionality and dynamic content
- **Responsive Design**: Adapting to mobile and desktop devices
- **External APIs**: Integration with third-party services like Bilibili API
- **Theme Switching**: Supporting dark/light mode switching functionality

## Project Structure

```
woshicby.github.io/
├── CSS/             # CSS files directory
│   ├── common.css   # Common styles
│   ├── index.css    # Homepage styles
│   ├── pace-calculator.css
│   ├── sports.css
│   ├── style-comparison.css
│   ├── tools-common.css
│   ├── tools.css
│   ├── touken-forge.css
│   ├── video.css
│   └── README.md
├── HTML/            # HTML pages directory
│   ├── pace-calculator.html
│   ├── sports.html
│   ├── study.html
│   ├── style-comparison.html
│   ├── tools.html
│   ├── touken-forge.html
│   ├── video.html
│   └── README.md
├── JS/              # JavaScript files directory
│   ├── bilibili-api.js
│   ├── navigation.js
│   ├── pace-calculator.js
│   ├── theme-toggle.js
│   ├── touken-forge.js
│   └── README.md
├── images/          # Image resources directory
│   ├── BV1zM41127x9.jpg
│   ├── bilibili-icon.png
│   ├── body_backgrond.jpg
│   ├── github-icon.svg
│   ├── menu-icon.svg
│   ├── test_image.jpg
│   ├── touken/      # Touken Ranbu related images
│   │   ├── default_sword.jpg
│   │   ├── 刀账图标/ (Sword Inventory Icons)
│   │   └── README.md
│   ├── weibo-icon.png
│   └── README.md
├── videos/          # Video resources directory
│   ├── test_video.mp4
│   └── README.md
├── audios/          # Audio resources directory
│   ├── test_audio.mp3
│   └── README.md
├── documents/       # Project documents directory
│   ├── resize.txt
│   ├── resized_files_list.txt
│   └── 时间距离配速距离计算逻辑.txt (Time-Distance-Pace Calculation Logic)
├── index.html       # Website homepage
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
- Updated responsive navigation system
- Fixed CSS styling errors
- Enhanced user experience and interactive features
- Added style comparator tool
- Improved project documentation structure
- Optimized image resource management
- Added theme switching functionality (theme-toggle.js)

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
- **スポーツページ** (sports.html): スポーツ関連コンテンツ

### 4. 学習リソース
- **学習ページ** (study.html): 学習資料とノート

### 5. 便利ツール
- **ツールコレクション** (tools.html): 様々な実用的な小さなツールの集合
- **スタイル比較ツール** (style-comparison.html): スタイル比較ツール

## 技術スタック

- **HTML5**: ページ構造と意味的なマークアップ
- **CSS3**: スタイリングとレスポンシブデザイン
- **JavaScript**: インタラクティブな機能と動的コンテンツ
- **レスポンシブデザイン**: モバイルデバイスとデスクトップデバイスへの適応
- **外部API**: Bilibili APIなどのサードパーティサービスとの統合
- **テーマ切り替え**: ダーク/ライトモード切り替え機能のサポート

## プロジェクト構造

```
woshicby.github.io/
├── CSS/             # CSSファイルディレクトリ
│   ├── common.css   # 共通スタイル
│   ├── index.css    # ホームページスタイル
│   ├── pace-calculator.css
│   ├── sports.css
│   ├── style-comparison.css
│   ├── tools-common.css
│   ├── tools.css
│   ├── touken-forge.css
│   ├── video.css
│   └── README.md
├── HTML/            # HTMLページディレクトリ
│   ├── pace-calculator.html
│   ├── sports.html
│   ├── study.html
│   ├── style-comparison.html
│   ├── tools.html
│   ├── touken-forge.html
│   ├── video.html
│   └── README.md
├── JS/              # JavaScriptファイルディレクトリ
│   ├── bilibili-api.js
│   ├── navigation.js
│   ├── pace-calculator.js
│   ├── theme-toggle.js
│   ├── touken-forge.js
│   └── README.md
├── images/          # 画像リソースディレクトリ
│   ├── BV1zM41127x9.jpg
│   ├── bilibili-icon.png
│   ├── body_backgrond.jpg
│   ├── github-icon.svg
│   ├── menu-icon.svg
│   ├── test_image.jpg
│   ├── touken/      # 刀剣乱舞関連画像
│   │   ├── default_sword.jpg
│   │   ├── 刀账图标/ (刀帳アイコン)
│   │   └── README.md
│   ├── weibo-icon.png
│   └── README.md
├── videos/          # 動画リソースディレクトリ
│   ├── test_video.mp4
│   └── README.md
├── audios/          # 音声リソースディレクトリ
│   ├── test_audio.mp3
│   └── README.md
├── documents/       # プロジェクトドキュメントディレクトリ
│   ├── resize.txt
│   ├── resized_files_list.txt
│   └── 时间距离配速距离计算逻辑.txt (時間-距離-ペース計算ロジック)
├── index.html       # ウェブサイトホームページ
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
- レスポンシブナビゲーションシステムの更新
- CSSスタイリングエラーの修正
- ユーザーエクスペリエンスとインタラクティブ機能の強化
- スタイル比較ツールの追加
- プロジェクトドキュメント構造の改善
- 画像リソース管理の最適化
- テーマ切り替え機能の追加 (theme-toggle.js)

## 使用方法

[woshicby.github.io](https://woshicby.github.io) に直接アクセスして、ウェブサイトのコンテンツを閲覧できます。

## 開発ノート

### レスポンシブナビゲーション

ウェブサイトはレスポンシブナビゲーションシステムを採用しており、モバイルデバイスでは自動的にハンバーガーメニューに変換されます。ナビゲーション機能は `JS/navigation.js` を通じて実装されており、関連するスタイルは `CSS/common.css` に定義されています。

### テーマ切り替え

ウェブサイトはダーク/ライトテーマ切り替え機能をサポートしており、`JS/theme-toggle.js` を通じて実装されています。ユーザーは、好みや環境に応じて異なる表示モードを切り替えることができます。

### ページ開発

新しいページを追加する場合は、既存のファイル構造と命名規則に従い、共通のスタイルとナビゲーション機能が適切に含まれていることを確認してください。新しいページはレスポンシブデザインとテーマ切り替え機能をサポートする必要があります。
