// 博文详情页数据管理和渲染
class PostDetailManager {
    constructor() {
        const params = this.getUrlParams();
        this.postId = params.id;
        this.postFile = params.file;
        this.init();
    }

    async init() {
        try {
            const result = await this.loadPosts();
            
            if (result.success) {
                const post = this.findPostById(result.posts, this.postId);
                if (post) {
                    this.renderPostDetail(post);
                } else {
                    this.renderNotFound();
                }
            } else {
                this.renderNotFound(result);
            }
        } catch (error) {
            console.error('加载博文详情失败:', error);
            this.renderError({
                error: 'UNKNOWN_ERROR',
                message: '加载博文详情时发生未知错误',
                detail: error.message
            });
        }
    }

    getUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        return {
            id: urlParams.get('id'),
            file: urlParams.get('file')
        };
    }

    async loadPosts() {
        try {
            if (this.postFile) {
                return await this.loadPostByFile(this.postFile);
            }
            
            const listResponse = await fetch('JSON/posts-list.json');
            
            if (listResponse.ok) {
                const postsList = await listResponse.json();
                console.log('成功加载posts-list.json，文件数量:', postsList.length);
                
                const postInfo = postsList.find(p => p.id.toString() === this.postId.toString());
                
                if (postInfo) {
                    const mdResponse = await fetch(`posts/${postInfo.file}`);
                    if (mdResponse.ok) {
                        const mdContent = await mdResponse.text();
                        const parsedPost = this.parseMarkdown(mdContent);
                        parsedPost.id = postInfo.id;
                        return { success: true, posts: [parsedPost] };
                    } else {
                        return { 
                            success: false, 
                            error: 'FILE_NOT_FOUND', 
                            message: `博文文件 "${postInfo.file}" 不存在或无法访问`,
                            detail: `HTTP状态码: ${mdResponse.status} ${mdResponse.statusText}`
                        };
                    }
                }
                
                return { 
                    success: false, 
                    error: 'ID_NOT_FOUND', 
                    message: `博文ID "${this.postId}" 不存在`,
                    detail: '请在博文列表中查找正确的博文'
                };
            } else {
                console.log('posts-list.json 不存在，尝试从 posts.json 加载');
                const response = await fetch('JSON/posts.json');
                if (response.ok) {
                    const posts = await response.json();
                    return { success: true, posts: posts };
                }
                console.warn('posts.json 也不存在，使用示例数据');
                return { success: true, posts: this.getSamplePosts() };
            }
        } catch (error) {
            console.warn('加载博文数据失败:', error);
            return { 
                success: false, 
                error: 'NETWORK_ERROR', 
                message: '加载博文数据时发生错误',
                detail: error.message 
            };
        }
    }

    async loadPostByFile(filename) {
        try {
            const mdResponse = await fetch(`posts/${filename}`);
            if (mdResponse.ok) {
                const mdContent = await mdResponse.text();
                try {
                    const parsedPost = this.parseMarkdown(mdContent);
                    parsedPost.id = 'file-' + filename.replace(/[^a-zA-Z0-9]/g, '-');
                    parsedPost.isFileMode = true;
                    return { success: true, posts: [parsedPost] };
                } catch (parseError) {
                    return { 
                        success: false, 
                        error: 'PARSE_ERROR', 
                        message: `文件 "${filename}" Markdown解析失败`,
                        detail: parseError.message 
                    };
                }
            } else {
                return { 
                    success: false, 
                    error: 'FILE_NOT_FOUND', 
                    message: `文件 "${filename}" 不存在或无法访问`,
                    detail: `HTTP状态码: ${mdResponse.status} ${mdResponse.statusText}`
                };
            }
        } catch (error) {
            return { 
                success: false, 
                error: 'NETWORK_ERROR', 
                message: `加载文件 "${filename}" 时发生网络错误`,
                detail: error.message 
            };
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
            update_date: metadata.update_date || null,
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
        document.title = `${post.title} - BY的博客文章`;
        
        this.updateSEO(post);
        
        document.getElementById('post-title').textContent = post.title;
        
        const dateElement = document.getElementById('post-date');
        let dateHTML = `<span class="post-date-item"><strong>发布日期：</strong>${this.formatDate(post.date)}</span>`;
        if (post.update_date) {
            dateHTML += `<span class="post-update-date-item"><strong>更新日期：</strong>${this.formatDate(post.update_date)}</span>`;
        }
        dateElement.innerHTML = dateHTML;
        
        const readingTimeElement = document.getElementById('post-reading-time');
        const readingTime = this.calculateReadingTime(post.content || '');
        readingTimeElement.innerHTML = `<span class="reading-time-item"><strong>预计阅读：</strong>${readingTime} 分钟</span>`;
        
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
                        // 不在这里做高亮，我们之后自己处理
                        return '';
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
        
        this.addHeadingIds(contentElement);
        
        this.setupLazyLoading(contentElement);
        
        // 给代码块添加行号
        this.addLineNumbersToCodeBlocks(contentElement);
        
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

    renderNotFound(errorInfo = null) {
        document.getElementById('post-title').textContent = '博文不存在';
        
        let errorHTML = '<div class="error">';
        
        if (errorInfo) {
            const errorTypeMap = {
                'FILE_NOT_FOUND': '📁 文件未找到',
                'ID_NOT_FOUND': '🔍 ID未找到',
                'PARSE_ERROR': '📄 解析错误',
                'NETWORK_ERROR': '🌐 网络错误'
            };
            
            errorHTML += `<div class="error-type">${errorTypeMap[errorInfo.error] || '❌ 错误'}</div>`;
            errorHTML += `<p class="error-message">${errorInfo.message}</p>`;
            if (errorInfo.detail) {
                errorHTML += `<p class="error-detail"><small>详细信息：${errorInfo.detail}</small></p>`;
            }
        } else {
            errorHTML += '<p>抱歉，您请求的博文不存在或已被删除。</p>';
        }
        
        errorHTML += '<a href="posts.html" class="back-to-list">返回博文列表</a>';
        errorHTML += '</div>';
        
        document.getElementById('post-content').innerHTML = errorHTML;
    }

    renderError(errorInfo = null) {
        document.getElementById('post-title').textContent = '加载失败';
        
        let errorHTML = '<div class="error">';
        
        if (errorInfo) {
            errorHTML += `<p class="error-message">${errorInfo.message}</p>`;
            if (errorInfo.detail) {
                errorHTML += `<p class="error-detail"><small>详细信息：${errorInfo.detail}</small></p>`;
            }
        } else {
            errorHTML += '<p>加载博文失败，请稍后重试。</p>';
        }
        
        errorHTML += '<a href="posts.html" class="back-to-list">返回博文列表</a>';
        errorHTML += '</div>';
        
        document.getElementById('post-content').innerHTML = errorHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    updateSEO(post) {
        const description = post.excerpt || `${post.title} - BY的博客文章`;
        const keywords = post.tags && post.tags.length > 0 
            ? post.tags.join(',') 
            : '博客,技术文章';
        const url = post.isFileMode 
            ? `https://woshicby.github.io/post-detail.html?file=${encodeURIComponent(this.postFile)}`
            : `https://woshicby.github.io/post-detail.html?id=${post.id}`;
        
        document.querySelector('meta[name="description"]').setAttribute('content', description);
        document.querySelector('meta[name="keywords"]').setAttribute('content', keywords);
        
        document.querySelector('meta[property="og:title"]').setAttribute('content', post.title);
        document.querySelector('meta[property="og:description"]').setAttribute('content', description);
        document.querySelector('meta[property="og:url"]').setAttribute('content', url);
        
        document.querySelector('meta[name="twitter:title"]').setAttribute('content', post.title);
        document.querySelector('meta[name="twitter:description"]').setAttribute('content', description);
        
        const existingLD = document.querySelector('script[type="application/ld+json"]');
        if (existingLD) {
            existingLD.remove();
        }
        
        const ldJson = document.createElement('script');
        ldJson.type = 'application/ld+json';
        ldJson.textContent = JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            "headline": post.title,
            "datePublished": post.date,
            "dateModified": post.update_date || post.date,
            "author": {
                "@type": "Person",
                "name": "woshicby"
            },
            "description": description,
            "keywords": keywords,
            "url": url
        });
        document.head.appendChild(ldJson);
        
        const canonical = document.querySelector('link[rel="canonical"]');
        if (canonical) {
            canonical.setAttribute('href', url);
        } else {
            const link = document.createElement('link');
            link.rel = 'canonical';
            link.href = url;
            document.head.appendChild(link);
        }
    }

    calculateReadingTime(content) {
        const plainText = content
            .replace(/<[^>]*>/g, '')
            .replace(/[#*`_~\[\]()]/g, '')
            .replace(/!\[.*?\]\(.*?\)/g, '')
            .replace(/\[.*?\]\(.*?\)/g, '')
            .trim();
        
        const chineseChars = plainText.match(/[\u4e00-\u9fa5]/g) || [];
        const englishWords = plainText.match(/[a-zA-Z]+/g) || [];
        const totalWords = chineseChars.length + englishWords.length;
        
        const readingTime = Math.ceil(totalWords / 250);
        
        return readingTime < 1 ? 1 : readingTime;
    }

    setupLazyLoading(container) {
        const images = container.querySelectorAll('img');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        observer.unobserve(img);
                    }
                });
            }, {
                rootMargin: '50px 0px',
                threshold: 0.01
            });

            images.forEach(img => {
                if (img.src && !img.dataset.src) {
                    img.dataset.src = img.src;
                    img.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect fill="%23f0f0f0" width="400" height="300"/%3E%3Ctext fill="%23999" font-family="sans-serif" font-size="20" x="50%25" y="50%25" text-anchor="middle" dominant-baseline="middle"%3E加载中...%3C/text%3E%3C/svg%3E';
                    img.classList.add('lazy-image');
                    img.onload = () => img.classList.add('loaded');
                    imageObserver.observe(img);
                }
            });
        } else {
            images.forEach(img => {
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                }
            });
        }
    }

    addHeadingIds(container) {
        const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const usedIds = new Set();
        
        headings.forEach(heading => {
            const text = heading.textContent.trim();
            const baseId = text
                .toLowerCase()
                .replace(/[^\u4e00-\u9fa5a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            
            let id = baseId;
            let counter = 1;
            while (usedIds.has(id)) {
                id = `${baseId}-${counter}`;
                counter++;
            }
            
            usedIds.add(id);
            heading.id = id;
        });
    }

    // 给代码块添加行号
    addLineNumbersToCodeBlocks(container) {
        const preElements = container.querySelectorAll('pre');
        
        preElements.forEach(pre => {
            const codeElement = pre.querySelector('code');
            if (!codeElement) return;
            
            // 获取原始代码文本
            const originalCode = codeElement.textContent;
            
            // 尝试获取语言类型（从class中获取，如 language-javascript）
            let lang = '';
            const classList = codeElement.className.split(' ');
            for (const cls of classList) {
                if (cls.startsWith('language-')) {
                    lang = cls.replace('language-', '');
                    break;
                }
            }
            
            // 使用highlight.js进行语法高亮
            let highlightedCode = originalCode;
            if (lang && window.hljs && typeof hljs.highlight === 'function') {
                try {
                    highlightedCode = hljs.highlight(originalCode, { language: lang }).value;
                } catch (__) {}
            }
            
            // 将高亮后的代码按行分割
            const lines = originalCode.split('\n');
            // 移除最后一个空行
            if (lines.length > 0 && lines[lines.length - 1] === '') {
                lines.pop();
            }
            
            // 现在我们需要重新构建带行号的HTML
            // 我们把每一行包裹在一个span中，并在前面添加行号
            const highlightedLines = highlightedCode.split('\n');
            if (highlightedLines.length > 0 && highlightedLines[highlightedLines.length - 1] === '') {
                highlightedLines.pop();
            }
            
            // 构建新的HTML
            let newHTML = '';
            for (let i = 0; i < lines.length; i++) {
                const lineContent = highlightedLines[i] || '';
                newHTML += `<span class="code-line"><span class="line-number">${i + 1}</span>${lineContent}</span>`;
            }
            
            // 替换code元素的内容
            codeElement.innerHTML = newHTML;
            
            // 给pre添加类名
            pre.classList.add('code-with-line-numbers');
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
