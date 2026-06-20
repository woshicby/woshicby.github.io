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
        watchImages = false
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

    // 监听图片加载
    if (watchImages) {
        items.forEach(item => {
            const img = item.querySelector('img');
            if (img) {
                img.addEventListener('load', scheduleRelayout);
                img.addEventListener('error', scheduleRelayout);
            }
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
 * 初始化 markdown-it 实例
 * @returns {Object|null} markdownit 实例，若库未加载则返回 null
 */
function initMarkdown() {
    if (window.markdownit && typeof window.markdownit === 'function') {
        return new markdownit({
            html: true,
            breaks: true,
            linkify: true,
            typographer: true,
            xhtmlOut: true
        });
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
