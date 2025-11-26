// Markdown博文转换为JSON的工具脚本
// 使用方法：在浏览器中打开一个包含此脚本的HTML页面，然后通过界面上传Markdown文件

class MarkdownConverter {
    constructor() {
        this.posts = [];
    }

    // 解析Markdown文件内容
    parseMarkdown(content) {
        // 提取YAML前置元数据
        const frontmatterRegex = /^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        
        if (!match) {
            // 如果没有YAML前置元数据，返回基本结构
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

    // 解析YAML前置元数据
    parseFrontmatter(frontmatter) {
        const metadata = {};
        const lines = frontmatter.split('\n');
        
        lines.forEach(line => {
            line = line.trim();
            if (!line || line.startsWith('#')) return;            
            const [key, value] = line.split(':', 1);
            const cleanKey = key.trim();
            let cleanValue = line.substring(key.length + 1).trim();
            
            // 处理数组格式：categories: [技术, 教程]
            if (cleanValue.startsWith('[') && cleanValue.endsWith(']')) {
                cleanValue = cleanValue.substring(1, cleanValue.length - 1).split(',').map(item => item.trim());
            } 
            // 处理引号包围的值
            else if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) || 
                     (cleanValue.startsWith('\'') && cleanValue.endsWith('\''))) {
                cleanValue = cleanValue.substring(1, cleanValue.length - 1);
            }
            
            metadata[cleanKey] = cleanValue;
        });
        
        return metadata;
    }

    // 从内容中提取摘要
    extractExcerpt(content) {
        // 移除Markdown标记
        const plainText = content
            .replace(/#{1,6}\s+/g, '') // 移除标题标记
            .replace(/\*\*(.*?)\*\*/g, '$1') // 移除粗体
            .replace(/\*(.*?)\*/g, '$1') // 移除斜体
            .replace(/`(.*?)`/g, '$1') // 移除行内代码
            .replace(/```[\s\S]*?```/g, '[代码块]') // 替换代码块
            .replace(/!?\[([^\]]+)\]\([^)]+\)/g, '$1') // 移除链接和图片，保留文本
            .replace(/^>\s+/gm, '') // 移除引用
            .trim();
        
        // 返回前200个字符作为摘要
        return plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText;
    }

    // 将博文数据转换为JSON字符串
    toJSON() {
        return JSON.stringify(this.posts, null, 2);
    }

    // 添加博文
    addPost(post) {
        // 为博文分配ID
        if (!post.id) {
            post.id = this.posts.length + 1;
        }
        this.posts.push(post);
    }
}

// DOM加载完成后初始化事件监听器
function initMarkdownConverter() {
    // 初始化转换器
    const converter = new MarkdownConverter();
    
    // 文件上传处理
    document.getElementById('file-input').addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                document.getElementById('markdown-input').value = event.target.result;
            };
            reader.readAsText(file);
        }
    });
    
    // 转换按钮点击事件
    document.getElementById('convert-btn').addEventListener('click', function() {
        const markdown = document.getElementById('markdown-input').value;
        if (!markdown.trim()) {
            alert('请输入Markdown内容');
            return;
        }
        
        const post = converter.parseMarkdown(markdown);
        document.getElementById('json-output').textContent = JSON.stringify(post, null, 2);
    });
    
    // 添加到博文列表按钮点击事件
    document.getElementById('add-btn').addEventListener('click', function() {
        const markdown = document.getElementById('markdown-input').value;
        if (!markdown.trim()) {
            alert('请输入Markdown内容');
            return;
        }
        
        const post = converter.parseMarkdown(markdown);
        converter.addPost(post);
        alert('博文已添加到列表！当前共有 ' + converter.posts.length + ' 篇博文');
    });
    
    // 清空按钮点击事件
    document.getElementById('clear-btn').addEventListener('click', function() {
        document.getElementById('markdown-input').value = '';
        document.getElementById('json-output').textContent = '';
    });
    
    // 生成完整JSON按钮点击事件
    document.getElementById('generate-btn').addEventListener('click', function() {
        if (converter.posts.length === 0) {
            alert('博文列表为空，请先添加博文');
            return;
        }
        
        document.getElementById('json-output').textContent = converter.toJSON();
        
        // 创建下载链接
        const blob = new Blob([converter.toJSON()], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'posts.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });
}

// 如果在浏览器环境中运行，初始化事件监听器
if (typeof document !== 'undefined') {
    // 当DOM加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMarkdownConverter);
    } else {
        // 如果DOM已经加载完成，直接初始化
        initMarkdownConverter();
    }
} else {
    // 如果直接在非浏览器环境运行此脚本，输出使用说明
    console.log('这是一个Markdown到JSON的转换工具脚本。');
    console.log('请将此脚本保存为HTML文件，然后在浏览器中打开使用。');
    console.log('使用方法：');
    console.log('1. 在界面中粘贴Markdown格式的博文内容');
    console.log('2. 点击"转换"按钮生成JSON');
    console.log('3. 将生成的JSON保存到JSON/posts.json文件中');
}