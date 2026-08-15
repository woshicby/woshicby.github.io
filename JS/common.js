/**
 * 最短列优先瀑布流布局
 * 按顺序逐个插入卡片，每次插入到当前最短列（高度相同时优先靠左列）
 *
 * @param {Object} options
 * @param {HTMLElement} options.container - 瀑布流容器元素
 * @param {HTMLElement[]} options.items - 卡片DOM元素数组（按期望的阅读顺序排列）
 * @param {number} options.columnMinWidth - 列最小宽度（px），用于计算列数
 * @param {number} [options.columnGap=20] - 列间距（px）
 * @param {boolean} [options.watchImages=false] - 是否监听图片加载后重新布局
 * @returns {Function} destroy 函数，调用可移除事件监听
 */
function MasonryLayout(options) {
    const {
        container,
        items,
        columnMinWidth,
        columnGap = 20,
        watchImages = false,
        onRelayout = null   // 可选: 每次布局完成后回调(用于"布局就绪再显示"场景)
    } = options;

    let resizeTimer = null;
    let relayoutTimer = null;
    let destroyed = false;

    function layout() {
        if (destroyed) return;
        container.innerHTML = '';

        const gridWidth = container.offsetWidth;
        const numCols = Math.max(1, Math.floor((gridWidth + columnGap) / (columnMinWidth + columnGap)));
        const colWidth = (gridWidth - (numCols - 1) * columnGap) / numCols;

        const columns = [];
        const colHeights = new Array(numCols).fill(0);

        for (let i = 0; i < numCols; i++) {
            const col = document.createElement('div');
            col.className = 'masonry-column';
            col.style.width = colWidth + 'px';
            col.style.left = i * (colWidth + columnGap) + 'px';
            container.appendChild(col);
            columns.push(col);
        }

        items.forEach(item => {
            if (item.style.display === 'none') return;

            const minHeight = Math.min(...colHeights);
            const shortestIndex = colHeights.indexOf(minHeight);

            columns[shortestIndex].appendChild(item);
            colHeights[shortestIndex] = columns[shortestIndex].offsetHeight;
        });

        container.style.height = Math.max(...colHeights) + 'px';

        if (typeof onRelayout === 'function') onRelayout();
    }

    function scheduleRelayout() {
        if (destroyed) return;
        clearTimeout(relayoutTimer);
        relayoutTimer = setTimeout(layout, 200);
    }

    function onResize() {
        if (destroyed) return;
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(layout, 200);
    }

    // 初始布局
    layout();

    // 监听图片/视频加载
    if (watchImages) {
        items.forEach(item => {
            item.querySelectorAll('img').forEach(img => {
                if (!img.complete) {
                    img.addEventListener('load', scheduleRelayout);
                    img.addEventListener('error', scheduleRelayout);
                }
            });
            item.querySelectorAll('video').forEach(video => {
                video.addEventListener('loadedmetadata', scheduleRelayout);
            });
        });
    }

    // 监听窗口大小变化
    window.addEventListener('resize', onResize);

    // 返回销毁函数
    return function destroy() {
        destroyed = true;
        clearTimeout(resizeTimer);
        clearTimeout(relayoutTimer);
        window.removeEventListener('resize', onResize);
    };
}

// ==================== 通用工具函数 ====================

/**
 * 日期格式化
 * @param {string} dateString - 日期字符串
 * @param {Object} [options] - toLocaleDateString 选项，默认 { year:'numeric', month:'long', day:'numeric' }
 * @returns {string}
 */
function formatDate(dateString, options) {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', options || {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

/**
 * HTML 转义，防止 XSS
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/**
 * 预处理 Steam BBCode 标签，转换为 Markdown 或 HTML
 * Steam 评论格式参考: https://steamcommunity.com/comment/Recommendation/formattinghelp
 * @param {string} text - 原始文本
 * @returns {string} 转换后的文本
 */
function preprocessSteamBBCode(text) {
    if (!text || text.indexOf('[') === -1) return text;

    // [noparse] 内容不解析，暂存后最后恢复
    const noparseStack = [];
    text = text.replace(/\[noparse\]([\s\S]*?)\[\/noparse\]/gi, (_, content) => {
        noparseStack.push(content);
        return '\x00NOPARSE' + (noparseStack.length - 1) + '\x00';
    });

    // [code] 等宽字体 — 转为行内代码
    text = text.replace(/\[code\]([\s\S]*?)\[\/code\]/gi, '`$1`');

    // 标题 [h1] [h2] [h3]
    text = text.replace(/\[h1\]([\s\S]*?)\[\/h1\]/gi, '\n# $1\n');
    text = text.replace(/\[h2\]([\s\S]*?)\[\/h2\]/gi, '\n## $1\n');
    text = text.replace(/\[h3\]([\s\S]*?)\[\/h3\]/gi, '\n### $1\n');

    // 粗体 [b]、斜体 [i]、删除线 [strike] — 转为 Markdown
    text = text.replace(/\[b\]([\s\S]*?)\[\/b\]/gi, '**$1**');
    text = text.replace(/\[i\]([\s\S]*?)\[\/i\]/gi, '*$1*');
    text = text.replace(/\[strike\]([\s\S]*?)\[\/strike\]/gi, '~~$1~~');

    // 下划线 [u] — Markdown 无对应语法，用 HTML
    text = text.replace(/\[u\]([\s\S]*?)\[\/u\]/gi, '<u>$1</u>');

    // 剧透 [spoiler] — 需配合 CSS
    text = text.replace(/\[spoiler\]([\s\S]*?)\[\/spoiler\]/gi, '<span class="steam-spoiler">$1</span>');

    // 水平线 [hr]
    text = text.replace(/\[hr\]\s*\[\/hr\]/gi, '\n---\n');
    text = text.replace(/\[hr\]/gi, '\n---\n');

    // 链接 [url=url]text[/url] 和 [url]url[/url]
    text = text.replace(/\[url=([^\]]*)\]([\s\S]*?)\[\/url\]/gi, (_, url, linkText) => {
        if (!/^[a-z]+:\/\//i.test(url)) url = 'https://' + url;
        return '[' + linkText + '](' + url + ')';
    });
    text = text.replace(/\[url\]([\s\S]*?)\[\/url\]/gi, '$1');

    // 引用 [quote=author]text[/quote] 和 [quote]text[/quote]
    text = text.replace(/\[quote=([^\]]*)\]([\s\S]*?)\[\/quote\]/gi,
        '<blockquote class="steam-quote"><cite>$1</cite>$2</blockquote>');
    text = text.replace(/\[quote\]([\s\S]*?)\[\/quote\]/gi, '<blockquote class="steam-quote">$1</blockquote>');

    // 无序列表 [list][*]item[/list]
    text = text.replace(/\[list\]([\s\S]*?)\[\/list\]/gi, (_, content) =>
        '\n' + content.replace(/\[\*\]/gi, '- ').replace(/^\s+/, '').trim() + '\n');

    // 有序列表 [olist][*]item[/olist]
    text = text.replace(/\[olist\]([\s\S]*?)\[\/olist\]/gi, (_, content) => {
        let i = 1;
        return '\n' + content.replace(/\[\*\]/gi, () => (i++) + '. ').replace(/^\s+/, '').trim() + '\n';
    });

    // 表格 [table]
    text = text.replace(/\[table([^\]]*)\]([\s\S]*?)\[\/table\]/gi, (_, attrs, content) => {
        let cls = 'steam-table';
        if (/noborder=1/i.test(attrs)) cls += ' no-border';
        if (/equalcells=1/i.test(attrs)) cls += ' equal-cells';
        let html = '<table class="' + cls + '">';
        const rows = content.match(/\[tr\]([\s\S]*?)\[\/tr\]/gi) || [];
        rows.forEach(row => {
            const cells = row.match(/\[t[hd]\][\s\S]*?\[\/t[hd]\]/gi) || [];
            html += '<tr>';
            cells.forEach(cell => {
                const isHeader = /^\[th\]/i.test(cell);
                const inner = cell.replace(/^\[t[hd]\]/i, '').replace(/\[\/t[hd]\]$/i, '');
                html += (isHeader ? '<th>' : '<td>') + inner + (isHeader ? '</th>' : '</td>');
            });
            html += '</tr>';
        });
        return html + '</table>';
    });

    // 恢复 noparse 内容（转义 HTML 特殊字符，避免被解析为标签）
    noparseStack.forEach((content, i) => {
        const escaped = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
        text = text.split('\x00NOPARSE' + i + '\x00').join(escaped);
    });

    return text;
}

/**
 * 初始化 markdown-it 实例
 * @returns {Object|null} markdownit 实例，若库未加载则返回 null
 */
function initMarkdown() {
    if (window.markdownit && typeof window.markdownit === 'function') {
        const md = new markdownit({
            html: true,
            breaks: true,
            linkify: true,
            typographer: true,
            xhtmlOut: true
        });
        // 禁用 Setext 标题：避免 review 中用 --- 做分隔线时把上一行文字渲染成大标题
        md.disable('lheading');
        // 包装 render 方法，预处理 Steam BBCode 标签
        const originalRender = md.render.bind(md);
        md.render = function (text) {
            return originalRender(preprocessSteamBBCode(text));
        };
        return md;
    }
    return null;
}

/**
 * 通用 JSON 数据加载
 * @param {string} url - JSON 文件 URL
 * @param {*} [fallback=null] - 请求失败时的返回值
 * @returns {Promise<*>}
 */
async function fetchJSON(url, fallback = null) {
    try {
        const response = await fetch(url);
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.warn(`fetchJSON: 加载 ${url} 失败`, e);
    }
    return fallback;
}

/**
 * 将时间格式的成绩转换为总秒数
 * 支持格式：'时:分:秒' 或 '分:秒'
 * @param {string} result - 时间字符串
 * @returns {number} 总秒数
 */
function convertResultToSeconds(result) {
    if (!result) return 0;
    const parts = result.split(':').map(Number);
    if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
    }
    return parts[0] || 0;
}

// ==================== URL 参数工具 ====================

/**
 * 读取当前页面 URL 参数
 * @returns {URLSearchParams}
 */
function getUrlParams() {
    return new URLSearchParams(window.location.search);
}

/**
 * 更新当前页面 URL 参数（replaceState）
 * @param {URLSearchParams} params
 */
function setUrlParams(params) {
    const str = params.toString();
    window.history.replaceState({}, '', `${window.location.pathname}${str ? '?' + str : ''}`);
}

/**
 * 移除 URL 参数中的某个值
 * @param {string} key - 参数名
 * @param {string} [value] - 要移除的具体值（不传则移除整个 key）
 * @returns {URLSearchParams} 更新后的参数
 */
function removeUrlParam(key, value) {
    const params = getUrlParams();
    if (value !== undefined) {
        const values = params.getAll(key).filter(v => v !== value);
        params.delete(key);
        values.forEach(v => params.append(key, v));
    } else {
        params.delete(key);
    }
    return params;
}

// ==================== 筛选列表管理器基类 ====================

/**
 * 可筛选列表管理器基类
 * 提供 tag 切换、搜索、URL 参数管理、筛选条件展示等通用逻辑
 * 子类需实现：loadData(), renderList(), applyFilters()
 * 子类可选覆盖：extractTags(), renderTags(), getSearchInputId(), getClearFilterBtnId(), getFilterInfoIds()
 */
class FilterableListManager {
    constructor() {
        this.md = null;
        this.masonryDestroy = null;
        this.tags = [];
    }

    // ---- 子类必须实现 ----

    async loadData() { throw new Error('子类必须实现 loadData'); }
    renderList() { throw new Error('子类必须实现 renderList'); }
    applyFilters() { throw new Error('子类必须实现 applyFilters'); }

    // ---- 可选覆盖 ----

    /** 返回搜索输入框的 DOM id，默认 'search-input' */
    getSearchInputId() { return 'search-input'; }

    /** 返回清除筛选按钮的 DOM id，默认 'clear-filter' */
    getClearFilterBtnId() { return 'clear-filter'; }

    /** 返回筛选信息区域的 DOM id 对象 { info: 'filter-info', tags: 'filter-tags' } */
    getFilterInfoIds() { return { info: 'filter-info', tags: 'filter-tags' }; }

    /** 返回搜索时需要清除的其他 URL 参数名数组，默认 ['tag'] */
    getSearchClearParams() { return ['tag']; }

    /** 返回清除筛选时需要删除的 URL 参数名数组，默认 ['tag', 'search'] */
    getClearFilterParams() { return ['tag', 'search']; }

    /** 返回标签筛选时需要清除的其他 URL 参数名数组，默认 ['search'] */
    getTagClearParams() { return ['search']; }

    // ---- 通用实现 ----

    initMarkdown() {
        this.md = initMarkdown();
    }

    /**
     * 切换标签筛选（URL中添加/移除 tag 参数）
     */
    filterByTag(tag) {
        const urlParams = getUrlParams();
        const tags = urlParams.getAll('tag');

        if (tags.includes(tag)) {
            const newTags = tags.filter(t => t !== tag);
            urlParams.delete('tag');
            newTags.forEach(t => urlParams.append('tag', t));
        } else {
            urlParams.append('tag', tag);
        }

        this.getTagClearParams().forEach(p => urlParams.delete(p));
        setUrlParams(urlParams);
        this.applyFilters();
    }

    /**
     * 搜索功能：更新 URL search 参数并触发筛选
     */
    searchItems(searchTerm) {
        const urlParams = getUrlParams();

        if (!searchTerm.trim()) {
            urlParams.delete('search');
            setUrlParams(urlParams);
            this.applyFilters();
            return;
        }

        urlParams.set('search', searchTerm);
        this.getSearchClearParams().forEach(p => urlParams.delete(p));
        setUrlParams(urlParams);
        this.applyFilters();
    }

    /**
     * 移除指定的筛选条件
     */
    removeFilter(paramType, value = null) {
        const urlParams = removeUrlParam(paramType, value);
        setUrlParams(urlParams);
        this.applyFilters();
    }

    /**
     * 清除所有筛选条件
     */
    clearFilter() {
        const urlParams = getUrlParams();
        this.getClearFilterParams().forEach(p => urlParams.delete(p));
        setUrlParams(urlParams);
        this.applyFilters();

        const searchInput = document.getElementById(this.getSearchInputId());
        if (searchInput) searchInput.value = '';
    }

    /**
     * 检查 URL 参数并恢复筛选状态
     */
    checkUrlParams() {
        const urlParams = getUrlParams();
        const search = urlParams.get('search');

        if (search) {
            const searchInput = document.getElementById(this.getSearchInputId());
            if (searchInput) searchInput.value = search;
        }

        this.applyFilters();
    }

    /**
     * 绑定搜索输入框事件
     */
    bindSearch() {
        const searchInput = document.getElementById(this.getSearchInputId());
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchItems(e.target.value);
            });
        }
    }

    /**
     * 绑定清除筛选按钮事件
     */
    bindClearFilter() {
        const clearFilterBtn = document.getElementById(this.getClearFilterBtnId());
        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', () => {
                this.clearFilter();
            });
        }
    }

    /**
     * 创建筛选条件标签 DOM 元素
     */
    createFilterTag(type, value, paramType) {
        const tag = document.createElement('div');
        tag.className = 'filter-tag';
        tag.innerHTML = `
            <span>${type}: ${value}</span>
            <button class="filter-tag-remove" data-type="${paramType}" data-value="${value}" title="移除此过滤条件">×</button>
        `;

        tag.querySelector('.filter-tag-remove').addEventListener('click', () => {
            this.removeFilter(paramType, value);
        });

        return tag;
    }

    /**
     * 更新筛选条件展示区域
     * @param {Array} filterEntries - 筛选条件数组，每项 { type, value, paramType }
     */
    updateFilterInfo(filterEntries) {
        const ids = this.getFilterInfoIds();
        const filterInfo = document.getElementById(ids.info);
        const filterTags = document.getElementById(ids.tags);

        if (!filterInfo || !filterTags) return;

        filterTags.innerHTML = '';

        filterEntries.forEach(entry => {
            const tagElement = this.createFilterTag(entry.type, entry.value, entry.paramType);
            filterTags.appendChild(tagElement);
        });

        filterInfo.style.display = filterTags.children.length > 0 ? 'flex' : 'none';
    }
}

// Steam BBCode 剧透标记：全局点击切换显示/隐藏（事件委托，支持动态内容）
document.addEventListener('click', (e) => {
    const spoiler = e.target.closest('.steam-spoiler');
    if (spoiler) {
        spoiler.classList.toggle('revealed');
    }
});

/**
 * 初始化回到顶部按钮（全站通用）
 * 在页面滚动超过 400px 时显示，点击后平滑滚动到顶部
 */
function initBackToTopButton() {
    if (document.getElementById('back-to-top')) return;

    const btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.className = 'back-to-top';
    btn.title = '回到顶部';
    btn.innerHTML = '↑';
    document.body.appendChild(btn);

    window.addEventListener('scroll', () => {
        if (window.scrollY > 400) {
            btn.classList.add('visible');
        } else {
            btn.classList.remove('visible');
        }
    }, { passive: true });

    btn.addEventListener('click', () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
}
