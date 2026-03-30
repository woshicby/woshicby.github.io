class MomentsManager {
    constructor() {
        this.moments = [];
        this.tags = [];
        this.md = null;
        this.init();
    }

    async init() {
        try {
            this.initMarkdown();
            await this.loadMoments();
            this.extractTags();
            this.renderMomentsList();
            this.renderTags();
            this.renderStats();
            this.bindSearch();
            this.bindClearFilter();
            this.checkUrlParams();
        } catch (error) {
            console.error('加载灵感碎片数据失败:', error);
            document.getElementById('moments-list').innerHTML = '<div class="error">加载灵感碎片失败</div>';
        }
    }

    initMarkdown() {
        if (window.markdownit && typeof window.markdownit === 'function') {
            this.md = new markdownit({
                html: true,
                breaks: true,
                linkify: true,
                typographer: true,
                xhtmlOut: true
            });
        }
    }

    async loadMoments() {
        try {
            const response = await fetch('JSON/moments.json');
            if (response.ok) {
                this.moments = await response.json();
                this.moments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            } else {
                console.warn('moments.json 不存在，使用示例数据');
                this.moments = this.getSampleMoments();
            }
        } catch (error) {
            console.error('加载灵感碎片数据失败:', error.message);
            this.moments = this.getSampleMoments();
        }
    }

    extractTags() {
        const tagSet = new Set();
        this.moments.forEach(moment => {
            if (moment.tags) {
                moment.tags.forEach(tag => tagSet.add(tag));
            }
        });
        this.tags = Array.from(tagSet).sort();
    }

    renderMomentsList(filteredMoments = null) {
        const momentsToRender = filteredMoments || this.moments;
        const momentsListElement = document.getElementById('moments-list');

        if (momentsToRender.length === 0) {
            momentsListElement.innerHTML = '<div class="no-moments">没有找到相关的灵感碎片</div>';
            return;
        }

        const momentsHTML = momentsToRender.map(moment => this.createMomentHTML(moment)).join('');
        momentsListElement.innerHTML = momentsHTML;

        this.bindMomentFilterEvents();
    }

    createMomentHTML(moment) {
        const tagsHTML = moment.tags ? 
            `<div class="moment-tags">${moment.tags.map(tag => 
                `<span class="moment-tag" data-tag="${tag}">${tag}</span>`
            ).join('')}</div>` : '';

        let contentHTML = moment.content || '';
        if (this.md) {
            contentHTML = this.md.render(contentHTML);
        }

        return `
            <article class="moment-item" data-id="${moment.id}">
                <div class="moment-meta">
                    <span class="moment-date">${this.formatDate(moment.created_at)}</span>
                    ${tagsHTML}
                </div>
                <div class="moment-content">${contentHTML}</div>
            </article>
        `;
    }

    renderTags() {
        const tagsContainer = document.getElementById('tags-container');
        tagsContainer.innerHTML = this.tags.map(tag => {
            const count = this.moments.filter(m => m.tags && m.tags.includes(tag)).length;
            return `<span class="tag-badge" data-tag="${tag}">${tag} <span class="count">${count}</span></span>`;
        }).join('');

        document.querySelectorAll('#tags-container .tag-badge').forEach(badge => {
            badge.addEventListener('click', (e) => {
                e.preventDefault();
                const tag = badge.getAttribute('data-tag');
                this.filterByTag(tag);
            });
        });
    }

    renderStats() {
        const totalMoments = this.moments.length;
        const totalTags = this.tags.length;

        const statTotal = document.getElementById('stat-total');
        const statTags = document.getElementById('stat-tags');
        
        if (statTotal) statTotal.textContent = totalMoments;
        if (statTags) statTags.textContent = totalTags;
    }

    bindSearch() {
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            this.searchMoments(searchTerm);
        });
    }

    bindMomentFilterEvents() {
        const momentsList = document.getElementById('moments-list');
        
        momentsList.querySelectorAll('.moment-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.preventDefault();
                const tagName = tag.getAttribute('data-tag');
                this.filterByTag(tagName);
            });
        });
    }

    filterByTag(tag) {
        const urlParams = new URLSearchParams(window.location.search);
        const tags = urlParams.getAll('tag');
        
        if (tags.includes(tag)) {
            const newTags = tags.filter(t => t !== tag);
            urlParams.delete('tag');
            newTags.forEach(t => urlParams.append('tag', t));
        } else {
            urlParams.append('tag', tag);
        }
        
        urlParams.delete('search');
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
        
        this.applyFilters();
    }

    searchMoments(searchTerm) {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (!searchTerm.trim()) {
            urlParams.delete('search');
            window.history.replaceState({}, '', `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`);
            this.applyFilters();
            return;
        }

        urlParams.set('search', searchTerm);
        urlParams.delete('tag');
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
        
        this.applyFilters();
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const search = urlParams.get('search');
        
        if (search) {
            document.getElementById('search-input').value = search;
        }
        
        this.applyFilters();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    applyFilters() {
        const urlParams = new URLSearchParams(window.location.search);
        const tags = urlParams.getAll('tag');
        const search = urlParams.get('search');

        let filteredMoments = this.moments;

        if (tags.length > 0) {
            filteredMoments = filteredMoments.filter(moment => 
                moment.tags && moment.tags.some(tag => tags.includes(tag))
            );
        }

        if (search) {
            const searchTerm = search.toLowerCase();
            filteredMoments = filteredMoments.filter(moment => 
                (moment.content && moment.content.toLowerCase().includes(searchTerm)) ||
                (moment.tags && moment.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }

        this.renderMomentsList(filteredMoments);
        this.updateFilterInfo(tags, search);
        this.updateActiveStates(tags);
    }

    updateFilterInfo(tags, search) {
        const filterInfo = document.getElementById('filter-info');
        const filterTags = document.getElementById('filter-tags');
        
        if (!filterInfo || !filterTags) {
            return;
        }

        filterTags.innerHTML = '';

        tags.forEach(tag => {
            const tagElement = this.createFilterTag('标签', tag, 'tag');
            filterTags.appendChild(tagElement);
        });

        if (search) {
            const tagElement = this.createFilterTag('搜索', search, 'search');
            filterTags.appendChild(tagElement);
        }

        if (filterTags.children.length > 0) {
            filterInfo.style.display = 'flex';
        } else {
            filterInfo.style.display = 'none';
        }
    }

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

    removeFilter(paramType, value = null) {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (value) {
            const values = urlParams.getAll(paramType);
            const newValues = values.filter(v => v !== value);
            urlParams.delete(paramType);
            newValues.forEach(v => urlParams.append(paramType, v));
        } else {
            urlParams.delete(paramType);
        }
        
        window.history.replaceState({}, '', `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`);
        
        this.applyFilters();
    }

    bindClearFilter() {
        const clearFilterBtn = document.getElementById('clear-filter');
        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', () => {
                this.clearFilter();
            });
        }
    }

    clearFilter() {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete('tag');
        urlParams.delete('search');
        window.history.replaceState({}, '', window.location.pathname);
        
        this.applyFilters();
        document.getElementById('search-input').value = '';
    }

    updateActiveStates(tags) {
        document.querySelectorAll('#tags-container .tag-badge').forEach(badge => {
            const tag = badge.getAttribute('data-tag');
            if (tags.includes(tag)) {
                badge.classList.add('active');
            } else {
                badge.classList.remove('active');
            }
        });

        document.querySelectorAll('.moment-tag').forEach(tagEl => {
            const tag = tagEl.getAttribute('data-tag');
            if (tags.includes(tag)) {
                tagEl.classList.add('active');
            } else {
                tagEl.classList.remove('active');
            }
        });
    }

    getSampleMoments() {
        return [
            {
                id: 1,
                content: "【测试内容】这是一条纯文字灵感碎片，用于测试文字内容的显示效果。",
                tags: ["测试", "文字"],
                created_at: "2026-03-29T10:30:00"
            },
            {
                id: 2,
                content: "【测试内容】这是一条包含图片的灵感碎片：\n\n![测试图片](./images/moments/20260329_103500.jpg)",
                tags: ["测试", "图片"],
                created_at: "2026-03-29T10:35:00"
            },
            {
                id: 3,
                content: "【测试内容】这是一条包含音频的灵感碎片：\n\n<audio controls src=\"./audios/moments/20260329_120000.mp3\"></audio>",
                tags: ["测试", "音频"],
                created_at: "2026-03-29T12:00:00"
            },
            {
                id: 4,
                content: "【测试内容】这是一条包含视频的灵感碎片：\n\n<video controls src=\"./videos/moments/20260329_130000.mp4\"></video>",
                tags: ["测试", "视频"],
                created_at: "2026-03-29T13:00:00"
            }
        ];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MomentsManager();
});
