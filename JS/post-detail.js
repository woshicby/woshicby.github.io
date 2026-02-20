// 博文详情页数据管理和渲染
class PostDetailManager {
    constructor() {
        this.postId = this.getPostIdFromUrl();
        this.init();
    }

    async init() {
        try {
            // 加载博文数据
            const posts = await this.loadPosts();
            // 查找当前博文
            const post = this.findPostById(posts, this.postId);
            if (post) {
                // 渲染博文详情
                this.renderPostDetail(post);
            } else {
                this.renderNotFound();
            }
        } catch (error) {
            console.error('加载博文详情失败:', error);
            this.renderError();
        }
    }

    getPostIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async loadPosts() {
        try {
            // 首先尝试从 posts-list.json 加载文件列表
            const listResponse = await fetch('JSON/posts-list.json');
            
            if (listResponse.ok) {
                const postsList = await listResponse.json();
                console.log('成功加载posts-list.json，文件数量:', postsList.length);
                
                // 找到对应的文件
                const postInfo = postsList.find(p => p.id.toString() === this.postId.toString());
                
                if (postInfo) {
                    const mdResponse = await fetch(`posts/${encodeURIComponent(postInfo.file)}`);
                    if (mdResponse.ok) {
                        const mdContent = await mdResponse.text();
                        const parsedPost = this.parseMarkdown(mdContent);
                        parsedPost.id = postInfo.id;
                        return [parsedPost];
                    }
                }
                
                // 如果找不到指定文件，返回空数组
                console.warn('找不到指定的博文文件');
                return [];
            } else {
                // 如果没有 posts-list.json，尝试从 posts.json 加载
                console.log('posts-list.json 不存在，尝试从 posts.json 加载');
                const response = await fetch('JSON/posts.json');
                if (response.ok) {
                    return await response.json();
                }
                console.warn('posts.json 也不存在，使用示例数据');
                return this.getSamplePosts();
            }
        } catch (error) {
            console.warn('使用示例博文数据:', error);
            return this.getSamplePosts();
        }
    }

    parseMarkdown(content) {
        const frontmatterRegex = /^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        
        if (!match) {
            return {
                title: '未命名博文',
                date: new Date().toISOString().split('T')[0],
                content: content,
                excerpt: this.extractExcerpt(content),
                categories: [],
                tags: []
            };
        }

        const frontmatter = match[1];
        const markdownContent = match[2];
        const metadata = this.parseFrontmatter(frontmatter);

        return {
            title: metadata.title || '未命名博文',
            date: metadata.date || new Date().toISOString().split('T')[0],
            content: markdownContent,
            excerpt: metadata.excerpt || this.extractExcerpt(markdownContent),
            categories: metadata.categories || [],
            tags: metadata.tags || []
        };
    }

    parseFrontmatter(frontmatter) {
        const metadata = {};
        const lines = frontmatter.split('\n');
        
        lines.forEach(line => {
            line = line.trim();
            if (!line || line.startsWith('#')) return;
            const [key, ...valueParts] = line.split(':');
            const cleanKey = key.trim();
            let cleanValue = valueParts.join(':').trim();
            
            if (cleanValue.startsWith('[') && cleanValue.endsWith(']')) {
                cleanValue = cleanValue.substring(1, cleanValue.length - 1)
                    .split(',')
                    .map(item => item.trim().replace(/^['"']|['"']$/g, ''));
            } else if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) || 
                       (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
                cleanValue = cleanValue.substring(1, cleanValue.length - 1);
            }
            
            metadata[cleanKey] = cleanValue;
        });
        
        return metadata;
    }

    extractExcerpt(content) {
        const plainText = content
            .replace(/#{1,6}\s+/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/```[\s\S]*?```/g, '[代码块]')
            .replace(/!?\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/^>\s+/gm, '')
            .trim();
        
        return plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText;
    }

    findPostById(posts, id) {
        // 如果没有ID或ID不存在，返回第一篇博文
        if (!id) {
            return posts[0] || null;
        }
        // 先尝试从提供的posts中查找
        let foundPost = posts.find(post => post.id.toString() === id.toString());
        
        // 如果找不到，并且当前posts不是示例数据，则从示例数据中查找
        if (!foundPost && posts.length > 0 && posts[0].title !== "Markdown功能完整示例") {
            const samplePosts = this.getSamplePosts();
            foundPost = samplePosts.find(post => post.id.toString() === id.toString());
        }
        
        // 如果还是找不到，返回第一篇博文
        if (!foundPost && posts.length > 0) {
            foundPost = posts[0];
        } else if (!foundPost) {
            // 如果posts为空，从示例数据中获取第一篇
            const samplePosts = this.getSamplePosts();
            foundPost = samplePosts[0] || null;
        }
        
        return foundPost;
    }

    renderPostDetail(post) {
        // 设置页面标题
        document.title = `${post.title} - BY的博客文章`;
        
        // 渲染博文标题
        document.getElementById('post-title').textContent = post.title;
        
        // 渲染博文日期
        const dateElement = document.getElementById('post-date');
        dateElement.innerHTML = `<strong>日期：</strong>${this.formatDate(post.date)}`;
        
        // 渲染分类
        const categoriesElement = document.getElementById('post-categories');
        if (post.categories && post.categories.length > 0) {
            categoriesElement.innerHTML = `
               <strong>分类：</strong>
                ${post.categories.map(cat => {
                    // 清理分类名称中的额外引号
                    const cleanCat = cat.replace(/^['"']|['"']$/g, '');
                    return `<a href="posts.html?category=${encodeURIComponent(cleanCat)}" class="category-badge">${cleanCat}</a>`;
                }).join('')}
            `;
        } else {
            categoriesElement.innerHTML = '';
        }
        
        // 渲染标签
        const tagsElement = document.getElementById('post-tags');
        if (post.tags && post.tags.length > 0) {
            tagsElement.innerHTML = `
                <strong>标签：</strong>
                ${post.tags.map(tag => {
                    // 清理标签名称中的额外引号
                    const cleanTag = tag.replace(/^['"']|['"']$/g, '');
                    return `<a href="posts.html?tag=${encodeURIComponent(cleanTag)}" class="tag-badge">${cleanTag}</a>`;
                }).join('')}
            `;
        } else {
            tagsElement.innerHTML = '';
        }
        
        // 渲染博文内容
        const contentElement = document.getElementById('post-content');
        // 如果有content字段，使用content，否则使用excerpt作为内容
        let postContent = post.content || this.getSampleContent(post.title);
        
        // 使用markdown-it解析Markdown内容
        try {
            if (window.markdownit && typeof window.markdownit === 'function') {
                // 创建markdown-it实例并配置选项
                const md = new markdownit({
                    html: true,        // 启用HTML标签解析
                    breaks: true,      // 将回车转换为<br>
                    linkify: true,     // 自动将URL转换为链接
                    typographer: true, // 启用一些语言中立的替换和引号美化
                    xhtmlOut: true,    // 生成闭合的HTML标签
                    quotes: '""\'\'', // 设置引号字符
                    highlight: function (str, lang) {
                        // 使用highlight.js进行代码高亮
                        if (lang && window.hljs && typeof hljs.highlight === 'function') {
                            try {
                                return hljs.highlight(str, { language: lang }).value;
                            } catch (__) {}
                        }
                        // 如果高亮失败或未指定语言，返回原始代码
                        return ''; // 使用默认转义
                    }
                });
                
                // 加载扩展
                if (md.use) {
                    // 上标扩展
                    if (window.markdownitSup) {
                        md.use(markdownitSup);
                    }
                    // 下标扩展
                    if (window.markdownitSub) {
                        md.use(markdownitSub);
                    }
                    // 标记扩展
                    if (window.markdownitMark) {
                        md.use(markdownitMark);
                    }
                    // 脚注扩展
                    if (window.markdownitFootnote) {
                        md.use(markdownitFootnote);
                    }
                    // 目录扩展已移除
                }
                
                // 解析Markdown内容
                postContent = md.render(postContent);
            }
        } catch (error) {
            console.warn('Markdown解析失败，使用原始内容:', error);
        }
        
        contentElement.innerHTML = postContent;
        
        // 触发MathJax渲染数学公式
        if (window.MathJax) {
            try {
                // 使用正确的MathJax API调用方式
                if (typeof MathJax.typesetPromise === 'function') {
                    MathJax.typesetPromise([contentElement]);
                } else if (typeof MathJax.typeset === 'function') {
                    // 兼容旧版MathJax
                    MathJax.typeset([contentElement]);
                } else {
                    console.warn('MathJax不支持所需的渲染方法');
                }
            } catch (err) {
                console.warn('MathJax渲染失败:', err);
            }
        }
    }

    renderNotFound() {
        document.getElementById('post-title').textContent = '博文不存在';
        document.getElementById('post-content').innerHTML = `
            <div class="error">
                <p>抱歉，您请求的博文不存在或已被删除。</p>
                <a href="posts.html" class="back-to-list">返回博文列表</a>
            </div>
        `;
    }

    renderError() {
        document.getElementById('post-content').innerHTML = `
            <div class="error">
                <p>加载博文失败，请稍后重试。</p>
                <a href="posts.html" class="back-to-list">返回博文列表</a>
            </div>
        `;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // 获取示例博文内容
    getSampleContent(title) {
        return `
<p>这是博文《${title}》的示例内容。</p>
<p>在实际使用中，您可以在posts.json文件中为每篇博文添加content字段，以显示完整的博文内容。</p>
<h2>如何添加完整博文内容</h2>
<p>要添加完整的博文内容，请编辑JSON/posts.json文件，为每篇博文添加content字段，格式如下：</p>
<pre>
{
  "id": 1,
  "title": "示例博文 1",
  "date": "2024-01-01",
  "excerpt": "这是摘要...",
  "content": "这是完整的博文内容，可以包含HTML标签。",
  "categories": ["技术", "教程"],
  "tags": ["JavaScript", "Web开发"]
}</pre>
<p>content字段可以包含HTML标签，以便更好地格式化您的博文内容。</p>
        `;
    }

    // 示例博文数据
    getSamplePosts() {
        return [
            {
                id: 1,
                title: "Markdown功能完整示例",
                date: "2024-06-30",
                content: "# Markdown功能完整示例\n\n## 1. 文本格式\n\n### 1.1 基础格式\n\n**粗体文本** 和 *斜体文本*，以及 ***粗斜体文本***。\n\n~~删除线文本~~ 和 <u>下划线文本</u>（HTML语法）。\n\n`行内代码块` 用于展示代码片段。\n\n### 1.2 特殊强调\n\n> 这是一个引用块，用于引用他人的言论或重要内容。\n\n> 嵌套引用示例：\n>> 这是嵌套的引用内容\n>>> 多层嵌套也是可以的\n\n## 2. 列表\n\n### 2.1 无序列表\n\n- 无序列表项1\n- 无序列表项2\n  - 嵌套无序列表项2.1\n  - 嵌套无序列表项2.2\n    - 深层嵌套列表项\n- 无序列表项3\n\n### 2.2 有序列表\n\n1. 有序列表项1\n2. 有序列表项2\n   1. 嵌套有序列表项2.1\n   2. 嵌套有序列表项2.2\n3. 有序列表项3\n\n### 2.3 任务列表\n\n- [x] 已完成任务\n- [ ] 未完成任务\n- [ ] 另一个未完成任务\n  - [x] 子任务已完成\n  - [ ] 子任务未完成\n\n## 3. 链接与图片\n\n### 3.1 链接\n\n[Markdown官方文档](https://daringfireball.net/projects/markdown/)\n\n[带标题的链接](https://example.com \"示例网站\")\n\n<https://example.com> 直接URL链接\n\n### 3.2 图片\n\n![示例图片描述](https://via.placeholder.com/150)\n\n![带标题的图片](https://via.placeholder.com/150 \"示例图片标题\")\n\n## 4. 代码\n\n### 4.1 行内代码\n\n使用 `console.log(\"Hello World\")` 输出信息。\n\n### 4.2 代码块\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\n// 调用函数\nconsole.log(greet(\"World\"));\n```\n\n```python\n# Python示例代码\ndef factorial(n):\n    if n <= 1:\n        return 1\n    else:\n        return n * factorial(n-1)\n\nprint(factorial(5))\n```\n\n```html\n<!DOCTYPE html>\n<html>\n<head>\n    <title>示例HTML</title>\n</head>\n<body>\n    <h1>Hello World</h1>\n</body>\n</html>\n```\n\n## 5. 表格\n\n| 名称 | 类型 | 说明 |\n| --- | --- | --- |\n| id | 数字 | 唯一标识符 |\n| title | 文本 | 标题内容 |\n| status | 文本 | 状态信息 |\n\n### 5.1 对齐方式\n\n| 左对齐 | 居中对齐 | 右对齐 |\n| :--- | :---: | ---: |\n| 内容1 | 内容2 | 内容3 |\n| 较长内容 | 中等长度 | 简短 |\n\n## 6. 分隔线\n\n---\n\n***\n\n___\n\n## 7. 脚注\n\n这是一个带有脚注的文本[^1]。\n\n这是另一个脚注[^note]。\n\n[^1]: 这是第一个脚注的内容。\n\n[^note]: 这是第二个脚注的内容，可以包含更多详细信息。\n\n## 8. 特殊字符转义\n\n\\* 这不是斜体文本 \\\n\\` 这不是行内代码 \\\n\\# 这不是标题 \\\n\\[\\]\\(\\) 这不是链接语法\n\n## 9. 自动链接\n\n<https://example.com>\n\n<example@example.com>\n\n## 10. 文本高亮\n\n==高亮文本== (GitHub风格扩展)\n\n## 11. 数学公式\n\n行内公式：$E = mc^2$\n\n块级公式：\n\n$$\n\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}\n$$\n\n## 12. 定义列表\n\n术语1\n: 这是术语1的定义\n: 这是术语1的另一个定义\n\n术语2\n: 这是术语2的定义\n\n## 13. HTML混合使用\n\n### 13.1 基本HTML标签\n\n<div style=\"color: blue;\">使用HTML标签设置蓝色文本</div>\n\n### 13.2 复杂HTML结构\n\n<table border=\"1\">\n  <tr>\n    <th>表头1</th>\n    <th>表头2</th>\n  </tr>\n  <tr>\n    <td>单元格1</td>\n    <td>单元格2</td>\n  </tr>\n</table>\n\n## 14. 目录\n\n[TOC]\n\n## 15. 上标与下标\n\nH~2~O 表示水分子\n\nX^2^ 表示X的平方\n\n---\n\n这个示例文件包含了几乎所有常用的Markdown语法元素，包括一些扩展功能。可以用它来全面测试Markdown到JSON的转换工具。",
                excerpt: "这是一个包含所有常见Markdown功能的示例文件，用于测试转换工具。",
                categories: ["技术", "教程"],
                tags: ["Markdown", "示例", "格式"]
            },
            {
                id: 2,
                title: '现在使用的是示例内容',
                date: '2024-01-15',
                excerpt: '这是第二篇示例博文的摘要内容。',
                categories: ['随笔'],
                tags: ['生活', '感悟']
            }
        ];
    }
}

// 初始化博文详情管理器
document.addEventListener('DOMContentLoaded', () => {
    new PostDetailManager();
});
