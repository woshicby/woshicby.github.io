let pages = [];

async function loadPages() {
    try {
        const response = await fetch('./JSON/seo-pages.json');
        pages = await response.json();
    } catch (error) {
        console.error('加载页面列表失败:', error);
        pages = [
            { url: 'index.html', name: '首页' },
            { url: 'posts.html', name: '博客列表' },
            { url: 'post-detail.html', name: '博文详情' },
            { url: 'video.html', name: '视频展示' },
            { url: 'study.html', name: '个人成果' },
            { url: 'tools.html', name: '小工具&小游戏' },
            { url: 'sports.html', name: '体育运动' }
        ];
    }
}

async function checkAllPages() {
    await loadPages();
    
    const toolContainer = document.querySelector('.tool-container');
    const summaryDiv = document.getElementById('summary');
    
    let totalPages = pages.length;
    let completePages = 0;
    let warningPages = 0;
    let errorPages = 0;
    
    const results = [];
    
    for (const page of pages) {
        try {
            const response = await fetch(page.url);
            const text = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');
            
            const seoData = checkSEO(doc);
            results.push({ page, seoData });
            
            if (seoData.status === 'complete') completePages++;
            else if (seoData.status === 'warning') warningPages++;
            else if (seoData.status === 'error') errorPages++;
            
        } catch (error) {
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
    
    document.getElementById('total-pages').textContent = totalPages;
    document.getElementById('complete-pages').textContent = completePages;
    document.getElementById('warning-pages').textContent = warningPages;
    document.getElementById('error-pages').textContent = errorPages;
    
    summaryDiv.style.display = 'block';
    displayResults(results);
}

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
    
    result.basic.title = doc.querySelector('title')?.textContent || '';
    result.basic.charset = doc.querySelector('meta[charset]')?.getAttribute('charset') || '';
    result.basic.viewport = doc.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
    result.basic.xua = doc.querySelector('meta[http-equiv="X-UA-Compatible"]')?.getAttribute('content') || '';
    
    result.seo.description = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    result.seo.keywords = doc.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
    result.seo.author = doc.querySelector('meta[name="author"]')?.getAttribute('content') || '';
    result.seo.robots = doc.querySelector('meta[name="robots"]')?.getAttribute('content') || '';
    
    result.openGraph.title = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
    result.openGraph.description = doc.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';
    result.openGraph.type = doc.querySelector('meta[property="og:type"]')?.getAttribute('content') || '';
    result.openGraph.url = doc.querySelector('meta[property="og:url"]')?.getAttribute('content') || '';
    result.openGraph.image = doc.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
    result.openGraph.siteName = doc.querySelector('meta[property="og:site_name"]')?.getAttribute('content') || '';
    result.openGraph.locale = doc.querySelector('meta[property="og:locale"]')?.getAttribute('content') || '';
    
    result.twitter.card = doc.querySelector('meta[name="twitter:card"]')?.getAttribute('content') || '';
    result.twitter.title = doc.querySelector('meta[name="twitter:title"]')?.getAttribute('content') || '';
    result.twitter.description = doc.querySelector('meta[name="twitter:description"]')?.getAttribute('content') || '';
    result.twitter.image = doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content') || '';
    
    if (!result.basic.title) missing.push('标题');
    if (!result.seo.description) missing.push('描述');
    if (!result.seo.keywords) warnings.push('关键词');
    if (!result.openGraph.title) missing.push('OG标题');
    if (!result.openGraph.description) missing.push('OG描述');
    if (!result.openGraph.image) warnings.push('OG图片');
    if (!result.twitter.card) missing.push('Twitter卡片');
    
    if (result.seo.description && result.seo.description.length < 120) {
        warnings.push('描述过短');
    }
    if (result.seo.description && result.seo.description.length > 160) {
        warnings.push('描述过长');
    }
    
    if (missing.length > 0) {
        result.status = 'error';
        result.missing = missing;
    } else if (warnings.length > 0) {
        result.status = 'warning';
        result.warnings = warnings;
    }
    
    return result;
}

function displayResults(results) {
    const toolContainer = document.querySelector('.tool-container');
    
    results.forEach(({ page, seoData }) => {
        const section = document.createElement('section');
        section.className = 'seo-page-section';
        
        let statusClass = 'ok';
        let statusText = '✓ 完整';
        
        if (seoData.status === 'error') {
            statusClass = 'missing';
            statusText = '✗ 有缺失';
        } else if (seoData.status === 'warning') {
            statusClass = 'warning';
            statusText = '⚠ 有警告';
        }
        
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

function renderMetaGroup(title, data) {
    if (!data || Object.keys(data).length === 0) return '';
    
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

function formatLabel(key) {
    return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

document.addEventListener('DOMContentLoaded', () => {
    checkAllPages();
});
