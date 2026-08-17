# posts 博文目录

网站博客文章(Markdown 格式,frontmatter + 正文)。

## 文件规范

- **命名**:`<编号>.<标题>.md`,编号 = 现有最大 id + 1(posts-list.json 是权威,先查它)
- **frontmatter**:
  ```markdown
  ---
  title: 标题
  date: 2026-08-17
  categories: [生活]       # 沿用现有分类:运动/生活/自我探索/技术/杂记/教程
  tags: [标签1, 标签2]
  excerpt: 一句话摘要
  series: 系列名(可选)
  series_order: 1(可选)
  ---
  正文 markdown...
  ```
- **图片**:复制到 `images/post.<编号>.<日期>/`,用相对路径 `![说明](./images/...)` 引用
- **配图必须带描述文本**(不能只写 `![图]` 空着)
- **视频**:用 `<video controls src="...">` HTML 标签

## 发布流程

1. 写博文 → 配图放 `images/post.N.日期/`
2. 更新 `JSON/posts-list.json` 登记 `{file, id}`
3. 本地预览确认(`网站预览.command`)
4. commit + push

## 注意

- **内容更新不进 commit message**:博文/数据更新,commit 只写功能更新
- 系列博文:使用 `series` + `series_order` 字段(posts-list 支持系列分组)
- 原始对话记录类素材不发布
