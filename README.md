# woshicby.github.io

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

## 技术栈

- **HTML5**: 页面结构和语义化标记
- **CSS3**: 样式和响应式设计
- **JavaScript**: 交互功能和动态内容
- **响应式设计**: 适配移动设备和桌面设备
- **外部API**: 集成B站API等第三方服务

## 项目结构

```
woshicby.github.io/
├── CSS/             # 样式文件目录
│   ├── common.css   # 公共样式
│   ├── index.css    # 首页样式
│   └── [其他页面样式文件]
├── HTML/            # HTML页面目录
│   ├── pace-calculator.html
│   ├── sports.html
│   ├── study.html
│   ├── tools.html
│   ├── touken-forge.html
│   └── video.html
├── JS/              # JavaScript文件目录
│   ├── bilibili-api.js
│   ├── navigation.js
│   ├── pace-calculator.js
│   └── touken-forge.js
├── images/          # 图片资源目录
│   ├── [各类图片]
│   └── touken/      # 刀剑乱舞相关图片
├── videos/          # 视频资源目录
├── audios/          # 音频资源目录
└── index.html       # 网站首页
```

## 网站特色

- **响应式导航**: 适配移动设备的汉堡菜单导航
- **模块化设计**: 公共组件和样式的复用
- **交互体验**: 动态效果和用户交互
- **资源优化**: 图片和媒体资源的合理组织

## 更新记录

- 2023.02.22: 项目初始化
- 更新响应式导航系统
- 修复CSS样式错误
- 增强用户体验和交互功能

## 使用方法

直接访问 [woshicby.github.io](https://woshicby.github.io) 即可浏览网站内容。

## 开发说明

### 响应式导航

网站采用了响应式导航系统，在移动设备上会自动转换为汉堡菜单。导航功能通过`JS/navigation.js`实现，相关样式定义在`CSS/common.css`中。

### 页面开发

如需添加新页面，请遵循现有的文件结构和命名规范，并确保引入公共样式和导航功能。
