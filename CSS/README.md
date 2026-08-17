# CSS 样式目录

网站样式表,按**层级 + 域**组织。

## 目录结构

```
CSS/
├── common.css              # 全站公共入口(@import common/ 子模块)
├── common/                 # 全站公共模块
│   ├── common-selectors.css    # 基础选择器/通用组件(含返回按钮)
│   ├── common-responsive.css   # 响应式布局
│   └── common-dark-theme.css   # 深色主题公共样式
├── domains/                # 域公共样式(按功能域)
│   ├── tools.css           # 工具/游戏域公共样式
│   ├── sports-common.css   # 运动域基础
│   └── sports.css          # 运动子页导航/页面通用
├── pages/                  # 页面独有样式
│   ├── posts.css / reviews.css / moments.css ...(28 个)
├── vendor/                 # 第三方库
│   └── github.min.css
└── index.css / index/      # 首页专用(@import index/ 子模块)
```

## 加载规则

每个页面按需加载,顺序固定:

```html
<link rel="stylesheet" href="./CSS/common.css">                    <!-- 1. 全站公共 -->
<link rel="stylesheet" href="./CSS/domains/xxx.css">              <!-- 2. 域公共(如需) -->
<link rel="stylesheet" href="./CSS/pages/xxx.css">                <!-- 3. 页面独有 -->
```

- 工具页:common + domains/tools.css + pages/<工具>.css
- 运动页:common + domains/sports-common.css + domains/sports.css + pages/<运动>.css
- 博客/影音:common + pages/<页面>.css(+ 辅助如 charts/calendar)
- 首页:common + index.css(@import 子模块)

## 变量体系(common.css :root)

所有样式值走 CSS 变量,按语义分层:

| 类别 | 前缀 | 示例 |
|------|------|------|
| **主题色** | --light-*/--dark-* + 通用别名 | --primary-color、--card-bg-color、--text-color |
| **业务语义色** | --color-* | --color-success/danger/warning/info |
| **语义色配套** | --color-*-deep/bg | --color-warning-deep(深色端)、--color-info-bg(浅底) |
| **透明色** | --white-transparent-* / --black-transparent-* | --black-transparent-50(遮罩) |
| **间距** | --spacing-* | --spacing-xs/sm/md/lg/xl(+ 中间档 plus) |
| **字号** | --font-size-* | --font-size-xs/sm/base/lg(+ px 兼容变量) |
| **字重** | --font-weight-* | --font-weight-normal/medium/semibold/bold |
| **圆角** | --border-radius-* | --border-radius-sm/md/lg/circle/pill |
| **阴影** | --shadow-* | --shadow-light/medium/heavy + hover/menu/modal/ring |
| **过渡** | --transition-* | --transition-default/fast |

**规范:**
- **属性-变量严格对应**:padding/margin 用 spacing,font-size 用 font-size,font-weight 用 font-weight,不混用
- **无对应档位先补变量,不硬编码**:新值先加变量,再用变量
- **页面专用色**定义在页面 css 顶部 `:root`(如 reviews 的 --rate-*-deep),勿污染全站
- 属性值统一小写、`0` 无单位、`border: none`、透明用 `transparent`
- 不创建重复别名变量

## 响应式断点体系

全站统一使用六级断点(所有页面级 CSS 均声明):

| 断点 | 语义 | 适配 |
|------|------|------|
| **480px** | 超小屏手机 | 间距收紧、字号微调、meta 换行 |
| **600px** | 小屏手机 | 网格再缩、按钮全宽、容器收紧 |
| **768px** | 移动主断点 | 布局堆叠、侧边栏全宽、单列 |
| **900px** | 平板/内容页 | 容器间距收紧、内容页提前堆叠 |
| **1200px** | 笔记本 | 大屏布局优化 |
| **1800px** | 超大屏 | 内容限宽 |

规范:
- 所有页面 CSS 声明完整六级断点(无特殊调整的档用注释占位)
- 移动适配模式:flex-direction column / grid 1fr / width 100%
- common-responsive.css 处理全站基础容器,页面级处理各自布局

## 主题(日间/夜间)

- **公共变量**在 common.css 的 `:root` 中定义(--primary-color 等),深色模式通过 `body.dark-theme` 切换变量
- 页面独有深色样式保留在各自 pages/*.css 中(`body.dark-theme .xxx {}` 覆盖),**渐进式改为变量驱动**
- 主题切换由 JS/theme-toggle.js 控制

## 规范

- **命名**:`<页面名>.css` 放 pages/;域公共放 domains/;全站公共放 common/
- **新增页面**:新建 pages/<页面名>.css,按加载规则在 HTML 引用
- **公共组件**(如返回按钮):放 common/common-selectors.css,勿在页面 css 重复定义
- 修改公共样式注意检查全站(导航、深色模式、移动端)
