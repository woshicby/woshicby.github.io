# JS 脚本目录

网站前端 JavaScript,按**层级 + 域**组织,纯静态无框架。

## 目录结构

```
JS/
├── common/                  # 全站公共(所有页面加载)
│   ├── theme-toggle.js      # 主题切换
│   ├── navigation.js        # 导航栏(配置化动态生成)
│   ├── background-lazy-load.js  # 背景懒加载
│   ├── back-to-top.js       # 返回顶部按钮(自包含,自动初始化)
│   └── common.js            # 通用函数/基类(fetchJSON/FilterableListManager 等)
├── domains/                 # 域公共(按功能域)
│   ├── tool-tabs.js         # 工具页标签导航(13 个工具页用)
│   ├── sports-config.js     # 运动配置(Mapbox token)
│   └── sports-common.js     # 运动共享逻辑(全局 activities 等)
├── pages/                   # 页面独有(26 个)
│   ├── posts.js / reviews.js / moments.js ...
├── vendor/                  # 第三方库
│   ├── highlight.min.js     # 代码高亮
│   ├── markdown/            # markdown-it 及扩展
│   └── MathJax-3.2.2es5/    # 数学公式渲染
└── civilization-evolution/  # 多文明模拟器(多文件游戏,独立子目录)
```

## 加载规则

每个页面按需加载,顺序固定:

```html
<script src="./JS/common/theme-toggle.js"></script>          <!-- 1. 全站公共 -->
<script src="./JS/common/navigation.js"></script>
<script src="./JS/common/background-lazy-load.js"></script>
<script src="./JS/domains/xxx.js"></script>                  <!-- 2. 域公共(如需) -->
<script src="./JS/pages/xxx.js"></script>                    <!-- 3. 页面独有 -->
```

- **全站三件套**(theme-toggle/navigation/background-lazy-load):所有 27 页必加载
- **common.js**:数据列表页(用 fetchJSON/FilterableListManager 的)加载;纯工具/游戏页不用
- **工具页**:+ domains/tool-tabs.js
- **运动页**:+ domains/sports-config.js + domains/sports-common.js

## 命名与重复约定

- **页面独有 js**:`pages/<页面名>.js`,与 HTML 同名
- **通用函数**:放 common/common.js,勿在页面 js 重复定义
- **避免重名**:同名不同实现的函数需区分命名(如 sports 页的 URL 参数解析用 `getUrlParamsDict`,避免与 common 的 `getUrlParams` 冲突)
- 列表类页面继承 `FilterableListManager`(筛选/分页/标签),见 reviews/tickets/moments/posts

## 注意

- **示例数据**:博客加载失败回退用 `JSON/sample-posts.json`(勿内嵌示例)
- **调试日志**:保留 console.error(诊断),清理 console.log 噪音
- 新增页面:按加载规则在 HTML 底部引用,顺序:公共模块 → 域模块 → 页面模块
