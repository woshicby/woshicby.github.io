---
title: 'Markdown功能完整示例'
date: '2024-06-30'
author: '示例作者'
categories: ['技术', '教程']
tags: ['Markdown', '示例', '格式']
excerpt: '这是一个包含所有常见Markdown功能的示例文件，用于测试转换工具。'
---

# Markdown功能完整示例

## 1. 文本格式

### 1.1 基础格式

**粗体文本** 和 *斜体文本*，以及 ***粗斜体文本***。

~~删除线文本~~ 和 <u>下划线文本</u>（HTML语法）。

`行内代码块` 用于展示代码片段。

### 1.2 特殊强调

> 这是一个引用块，用于引用他人的言论或重要内容。

> 嵌套引用示例：
> > 这是嵌套的引用内容
> >
> > > 多层嵌套也是可以的

## 2. 列表

### 2.1 无序列表

- 无序列表项1
- 无序列表项2
  - 嵌套无序列表项2.1
  - 嵌套无序列表项2.2
    - 深层嵌套列表项
- 无序列表项3

### 2.2 有序列表

1. 有序列表项1
2. 有序列表项2
   1. 嵌套有序列表项2.1
   2. 嵌套有序列表项2.2
3. 有序列表项3

### 2.3 任务列表

- [x] 已完成任务
- [ ] 未完成任务
- [ ] 另一个未完成任务
  - [x] 子任务已完成
  - [ ] 子任务未完成

## 3. 链接与图片

### 3.1 链接

[Markdown官方文档](https://daringfireball.net/projects/markdown/)

[带标题的链接](https://example.com "示例网站")

<https://example.com> 直接URL链接

### 3.2 图片

![示例图片描述](https://via.placeholder.com/150)

![带标题的图片](https://via.placeholder.com/150 "示例图片标题")

## 4. 代码

### 4.1 行内代码

使用 `console.log("Hello World")` 输出信息。

### 4.2 代码块

```javascript
function greet(name) {
  return `Hello, ${name}!`;
}

// 调用函数
console.log(greet("World"));
```

```python
# Python示例代码
def factorial(n):
    if n <= 1:
        return 1
    else:
        return n * factorial(n-1)

print(factorial(5))
```

```html
<!DOCTYPE html>
<html>
<head>
    <title>示例HTML</title>
</head>
<body>
    <h1>Hello World</h1>
</body>
</html>
```

## 5. 表格

| 名称 | 类型 | 说明 |
| --- | --- | --- |
| id | 数字 | 唯一标识符 |
| title | 文本 | 标题内容 |
| status | 文本 | 状态信息 |

### 5.1 对齐方式

| 左对齐 | 居中对齐 | 右对齐 |
| :--- | :---: | ---: |
| 内容1 | 内容2 | 内容3 |
| 较长内容 | 中等长度 | 简短 |

## 6. 分隔线

---

***

___

## 7. 脚注

这是一个带有脚注的文本[^1]。

这是另一个脚注[^note]。

[^1]: 这是第一个脚注的内容。

[^note]: 这是第二个脚注的内容，可以包含更多详细信息。

## 8. 特殊字符转义

\* 这不是斜体文本 \
\` 这不是行内代码 \
\# 这不是标题 \
\[\]\(\) 这不是链接语法

## 9. 自动链接

<https://example.com>

<example@example.com>

## 10. 文本高亮

==高亮文本== (GitHub风格扩展)

## 11. 数学公式

行内公式：$E = mc^2$

块级公式：

$$
\sum_{i=1}^{n} i = \frac{n(n+1)}{2}
$$

## 12. 定义列表

术语1
: 这是术语1的定义
: 这是术语1的另一个定义

术语2
: 这是术语2的定义

## 13. HTML混合使用

### 13.1 基本HTML标签

<div style="color: blue;">使用HTML标签设置蓝色文本</div>

### 13.2 复杂HTML结构

<table border="1">
  <tr>
    <th>表头1</th>
    <th>表头2</th>
  </tr>
  <tr>
    <td>单元格1</td>
    <td>单元格2</td>
  </tr>
</table>

## 14. 目录

[TOC]

## 15. 上标与下标

H~2~O 表示水分子

X^2^ 表示X的平方