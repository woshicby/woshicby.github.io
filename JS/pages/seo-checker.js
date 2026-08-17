/**
 * SEO 检查器页面脚本
 * 对应页面: seo-checker.html
 * 功能: 遍历网站所有页面,检查 Meta 标签(基础/SEO/Open Graph/Twitter Card)
 *       完整性,生成检查报告(完整/警告/缺失)。
 */

// 待检查的页面列表(从 seo-pages.json 加载,失败时用内置默认列表)
let pages = [];

/**
 * 加载页面列表(seo-pages.json)
 * 失败时回退到内置的基础页面列表
 */
async function loadPages() {
    try {
        const response = await fetch('./JSON/seo-pages.json');
        pages = await response.json();
    } catch (error) {
        console.error('加载页面列表失败:', error);
        // 回退: 使用内置默认列表(保证工具可用)
        pages = [
            { url: 'index.html', name: '首页' },
            { url: 'posts.html', name: '博客列表' },
            { url: 'post-detail.html', name: '博文详情' },
            { url: 'video.html', name: '视频展示' },
            { url: 'study.html', name: '个人成果' },
            { url: 'tools.html', name: '小工具&小游戏' },
            { url: 'races.html', name: '赛事' }
        ];
    }
}

/**
 * 检查所有页面的 SEO 标签
 * 逐个 fetch 页面 HTML → 解析 → 检查 Meta 标签 → 汇总统计 → 展示结果
 */
async function checkAllPages() {
    await loadPages();
    
    const toolContainer = document.querySelector('.tool-container');
    const summaryDiv = document.getElementById('summary');
    
    // 统计计数器: 总页数 / 完整 / 警告 / 缺失
    let totalPages = pages.length;
    let completePages = 0;
    let warningPages = 0;
    let errorPages = 0;
    
    const results = [];
    
    // 逐个页面检查
    for (const page of pages) {
        try {
            // 获取页面 HTML 并解析为 DOM
            const response = await fetch(page.url);
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            
            // 执行 SEO 检查
            const seoData = checkSEO(doc);
            results.push({ page, seoData });
            
            // 更新统计
            if (seoData.status === 'complete') completePages++;
            else if (seoData.status === 'warning') warningPages++;
            else if (seoData.status === 'error') errorPages++;
            
        } catch (error) {
            // 页面加载失败: 记为错误
            results.push({ 
                page, 
                seoData: { 
                    status: 'error', 
                    error: '无法加载页面: ' + error.message 
                } 
            });
            errorPages++;
        }
    }
    
    // 更新统计显示
    document.getElementById('total-pages').textContent = totalPages;
    document.getElementById('complete-pages').textContent = completePages;
    document.getElementById('warning-pages').textContent = warningPages;
    document.getElementById('error-pages').textContent = errorPages;
    
    // 显示统计 + 详细结果
    summaryDiv.style.display = 'block';
    displayResults(results);
}

/**
 * 检查单个页面的 SEO 标签
 * 提取基础/SEO/Open Graph/Twitter 四类 Meta 标签,
 * 按缺失项和警告项判断状态(complete/warning/error)
 * @param {Document} doc - 解析后的页面 DOM
 * @returns {Object} 检查结果 {status, basic, seo, openGraph, twitter, missing?, warnings?}
 */
function checkSEO(doc) {
    const result = {
        status: 'complete',
        basic: {},
        seo: {},
        openGraph: {},
        twitter: {}
    };
    
    const missing = [];
    const warnings = [];
    
    // 基础 Meta 标签: 标题/编码/视口/兼容性
    result.basic.title = doc.querySelector('title')?.textContent || '';
    result.basic.charset = doc.querySelector('meta[charset]')?.getAttribute('charset') || '';
    result.basic.viewport = doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
    result.basic.xua = doc.querySelector('meta[http-equiv="X-UA-Compatible"]')?.getAttribute('content') || '';
    
    // SEO 标签: 描述/关键词/作者/爬虫指令
    result.seo.description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    result.seo.keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
    result.seo.author = doc.querySelector('meta[name="author"]')?.getAttribute('content') || '';
    result.seo.robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
    
    // Open Graph 标签(社交分享)
    result.openGraph.title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    result.openGraph.description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    result.openGraph.type = doc.querySelector('meta[property="og:type"]')?.getAttribute('content') || '';
    result.openGraph.url = doc.querySelector('meta[property="og:url"]')?.getAttribute('content') || '';
    result.openGraph.image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
    result.openGraph.siteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || '';
    result.openGraph.locale = doc.querySelector('meta[property="og:locale"]')?.getAttribute('content') || '';
    
    // Twitter Card 标签
    result.twitter.card = doc.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || '';
    result.twitter.title = doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') || '';
    result.twitter.description = doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') || '';
    result.twitter.image = doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || '';
    
    // 缺失项(必须要有): 标题/描述/OG标题/OG描述/Twitter卡片
    if (!result.basic.title) missing.push('标题');
    if (!result.seo.description) missing.push('描述');
    if (!result.seo.keywords) warnings.push('关键词');
    if (!result.openGraph.title) missing.push('OG标题');
    if (!result.openGraph.description) missing.push('OG描述');
    if (!result.openGraph.image) warnings.push('OG图片');
    if (!result.twitter.card) missing.push('Twitter卡片');
    
    // 描述长度建议(120-160 字符最利于 SEO)
    if (result.seo.description && result.seo.description.length < 120) {
        warnings.push('描述过短');
    }
    if (result.seo.description && result.seo.description.length > 160) {
        warnings.push('描述过长');
    }
    
    // 综合判定状态: 有缺失=error, 有警告=warning, 否则=complete
    if (missing.length > 0) {
        result.status = 'error';
        result.missing = missing;
    } else if (warnings.length > 0) {
        result.status = 'warning';
        result.warnings = warnings;
    }
    
    return result;
}

/**
 * 渲染所有页面的检查结果
 * 每个页面生成一个 section,显示状态和四组 Meta 标签详情
 * @param {Array} results - 检查结果数组 [{page, seoData}]
 */
function displayResults(results) {
    const toolContainer = document.querySelector('.tool-container');
    
    results.forEach(({ page, seoData }) => {
        // 创建页面结果区块
        const section = document.createElement('section');
        section.className = 'seo-page-section';
        
        // 状态样式和文字
        let statusClass = 'ok';
        let statusText = '✓ 完整';
        
        if (seoData.status === 'error') {
            statusClass = 'missing';
            statusText = '✗ 有缺失';
        } else if (seoData.status === 'warning') {
            statusClass = 'warning';
            statusText = '⚠ 有警告';
        }
        
        // 渲染页面标题 + URL + 四组 Meta 标签
        section.innerHTML = `
            <div class="page-title">
                ${page.name}
                <span class="status ${statusClass}">${statusText}</span>
            </div>
            <div class="page-url">${page.url}</div>
            ${renderMetaGroup('基础 Meta 标签', seoData.basic)}
            ${renderMetaGroup('SEO 标签', seoData.seo)}
            ${renderMetaGroup('Open Graph', seoData.openGraph)}
            ${renderMetaGroup('Twitter Card', seoData.twitter)}
        `;
        
        toolContainer.appendChild(section);
    });
}

/**
 * 渲染一组 Meta 标签
 * @param {string} title - 组标题(如 'SEO 标签')
 * @param {Object} data - 标签键值对
 * @returns {string} HTML 字符串; 空数据返回空串
 */
function renderMetaGroup(title, data) {
    if (!data || Object.keys(data).length === 0) return '';
    
    // 逐项渲染: 标签名 + 值(未设置显示红色提示)
    const items = Object.entries(data)
        .map(([key, value]) => `
            <div class="meta-item">
                <span class="meta-label">${formatLabel(key)}:</span>
                <span class="meta-value">${value || '<em style="color: red;">未设置</em>'}</span>
            </div>
        `).join('');
    
    return `
        <div class="meta-group">
            <h3>${title}</h3>
            ${items}
        </div>
    `;
}

/**
 * 格式化标签键名: camelCase → 首字母大写的词组
 * @param {string} key - 原始键名(如 siteName)
 * @returns {string} 格式化结果(如 "Site Name")
 */
function formatLabel(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

// DOM 就绪后自动开始检查
document.addEventListener('DOMContentLoaded', () => {
    checkAllPages();
});
