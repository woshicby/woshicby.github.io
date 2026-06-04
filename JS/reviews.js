class ReviewsManager {
    constructor() {
        this.allData = {};
        this.currentCategory = 'movie';
        this.currentStatus = null;
        this.currentRatingStatus = 'rated';
        this.currentRatingLevels = new Set();
        this.currentTimeFilter = 'all';
        this.currentRegion = null;
        this.currentItems = [];
        this.md = null;
        this.init();
    }

    async init() {
        try {
            this.initMarkdown();
            await this.loadAllData();
            this.bindCategoryTabs();
            this.bindSearch();
            this.bindClearFilter();
            this.bindAdvancedFilters();
            this.checkUrlParams();
        } catch (error) {
            console.error('加载豆瓣记录失败:', error);
            document.getElementById('reviews-list').innerHTML = '<div class="error">加载豆瓣记录失败</div>';
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

    async loadAllData() {
        const categories = ['movie', 'book', 'music', 'game', 'drama'];
        const promises = categories.map(async (cat) => {
            try {
                const response = await fetch(`JSON/douban-${cat}s.json`);
                if (response.ok) {
                    this.allData[cat] = await response.json();
                } else {
                    this.allData[cat] = {};
                }
            } catch (e) {
                this.allData[cat] = {};
            }
        });
        await Promise.all(promises);
    }

    getCategoryItems(category, status = null) {
        const data = this.allData[category] || {};
        if (status) {
            return data[status] || [];
        }
        let all = [];
        for (const items of Object.values(data)) {
            all = all.concat(items);
        }
        all.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        return all;
    }

    getStatuses(category) {
        const data = this.allData[category] || {};
        return Object.keys(data);
    }

    bindCategoryTabs() {
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.getAttribute('data-category');
                this.switchCategory(category);
            });
        });
    }

    switchCategory(category) {
        this.currentCategory = category;
        this.currentStatus = null;
        this.currentRegion = null;

        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-category') === category);
        });

        this.renderStatusTabs();
        this.renderTags();
        this.renderRegionFilter();
        this.applyFilters();
        this.updateUrlParams();
    }

    renderStatusTabs() {
        const container = document.getElementById('status-tabs');
        const statuses = this.getStatuses(this.currentCategory);

        const statusLabels = {
            'watched': '看过', 'watching': '在看', 'wantToWatch': '想看',
            'listened': '听过', 'listening': '在听', 'wantToListen': '想听',
            'read': '读过', 'reading': '在读', 'wantToRead': '想读',
            'played': '玩过', 'playing': '在玩', 'wantToPlay': '想玩'
        };

        const allCount = this.getCategoryItems(this.currentCategory).length;
        let html = `<button class="status-tab active" data-status="">全部 (${allCount})</button>`;

        statuses.forEach(status => {
            const count = (this.allData[this.currentCategory][status] || []).length;
            const label = statusLabels[status] || status;
            html += `<button class="status-tab" data-status="${status}">${label} (${count})</button>`;
        });

        container.innerHTML = html;

        container.querySelectorAll('.status-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const status = tab.getAttribute('data-status') || null;
                this.currentStatus = status;
                container.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderTags();
                this.renderRegionFilter();
                this.applyFilters();
                this.updateUrlParams();
            });
        });
    }

    extractTags(items) {
        const tagSet = new Set();
        items.forEach(item => {
            if (item.genres) {
                item.genres.forEach(g => tagSet.add(g));
            }
            if (item.tags) {
                item.tags.forEach(t => tagSet.add(t));
            }
        });
        return Array.from(tagSet).sort();
    }

    renderTags() {
        const items = this.getCategoryItems(this.currentCategory, this.currentStatus);
        const tags = this.extractTags(items);
        const tagsContainer = document.getElementById('tags-container');
        const tagsGroup = tagsContainer ? tagsContainer.closest('.filter-group') : null;

        if (!tagsContainer) return;

        if (tags.length === 0) {
            if (tagsGroup) tagsGroup.style.display = 'none';
            return;
        }

        if (tagsGroup) tagsGroup.style.display = '';

        tagsContainer.innerHTML = tags.map(tag => {
            const count = items.filter(item =>
                (item.genres && item.genres.includes(tag)) ||
                (item.tags && item.tags.includes(tag))
            ).length;
            return { tag, count };
        }).sort((a, b) => b.count - a.count).map(({ tag, count }) => {
            return `<button class="filter-btn" data-tag="${tag}">${tag} (${count})</button>`;
        }).join('');

        tagsContainer.querySelectorAll('.filter-btn').forEach(badge => {
            badge.addEventListener('click', () => {
                this.toggleTagFilter(badge.getAttribute('data-tag'));
            });
        });
    }

    toggleTagFilter(tag) {
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

    bindSearch() {
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            const urlParams = new URLSearchParams(window.location.search);

            if (!searchTerm.trim()) {
                urlParams.delete('search');
            } else {
                urlParams.set('search', searchTerm);
                urlParams.delete('tag');
            }

            window.history.replaceState({}, '', `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`);
            this.applyFilters();
        });
    }

    bindClearFilter() {
        const clearFilterBtn = document.getElementById('clear-filter');
        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', () => {
                window.history.replaceState({}, '', window.location.pathname);
                document.getElementById('search-input').value = '';
                this.currentRatingStatus = 'rated';
                this.currentRatingLevels.clear();
                this.currentTimeFilter = 'all';
                this.resetAdvancedFilterUI();
                this.applyFilters();
            });
        }
    }

    bindAdvancedFilters() {
        const toggle = document.getElementById('advanced-filter-toggle');
        const options = document.getElementById('advanced-filter-options');
        if (toggle && options) {
            toggle.addEventListener('click', () => {
                options.classList.toggle('collapsed');
            });
        }

        const ratingStatusFilter = document.getElementById('rating-status-filter');
        if (ratingStatusFilter) {
            ratingStatusFilter.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.currentRatingStatus = btn.getAttribute('data-value');
                    ratingStatusFilter.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.applyFilters();
                });
            });
        }

        const ratingLevelFilter = document.getElementById('rating-level-filter');
        if (ratingLevelFilter) {
            ratingLevelFilter.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const value = parseInt(btn.getAttribute('data-value'));
                    if (this.currentRatingLevels.has(value)) {
                        this.currentRatingLevels.delete(value);
                        btn.classList.remove('active');
                    } else {
                        this.currentRatingLevels.add(value);
                        btn.classList.add('active');
                    }
                    this.applyFilters();
                });
            });
        }

        const timeFilter = document.getElementById('time-filter');
        if (timeFilter) {
            timeFilter.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.currentTimeFilter = btn.getAttribute('data-value');
                    timeFilter.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.applyFilters();
                });
            });
        }
    }

    resetAdvancedFilterUI() {
        const ratingStatusFilter = document.getElementById('rating-status-filter');
        if (ratingStatusFilter) {
            ratingStatusFilter.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-value') === 'rated');
            });
        }

        const ratingLevelFilter = document.getElementById('rating-level-filter');
        if (ratingLevelFilter) {
            ratingLevelFilter.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        }

        const timeFilter = document.getElementById('time-filter');
        if (timeFilter) {
            timeFilter.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.toggle('active', btn.getAttribute('data-value') === 'all');
            });
        }

        this.currentRegion = null;
        this.renderRegionFilter();
    }

    renderRegionFilter() {
        const container = document.getElementById('region-filter');
        if (!container) return;

        const items = this.getCategoryItems(this.currentCategory, this.currentStatus);
        const regionCount = {};
        items.forEach(item => {
            if (item.region) {
                item.region.split(/\s+/).forEach(r => {
                    if (r) regionCount[r] = (regionCount[r] || 0) + 1;
                });
            }
        });

        const regions = Object.keys(regionCount).sort((a, b) => regionCount[b] - regionCount[a]);
        if (regions.length === 0) {
            container.parentElement.style.display = 'none';
            return;
        }
        container.parentElement.style.display = '';

        let html = `<button class="filter-btn ${!this.currentRegion ? 'active' : ''}" data-value="">全部</button>`;
        regions.forEach(region => {
            html += `<button class="filter-btn ${this.currentRegion === region ? 'active' : ''}" data-value="${this.escapeHtml(region)}">${this.escapeHtml(region)} (${regionCount[region]})</button>`;
        });
        container.innerHTML = html;

        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentRegion = btn.getAttribute('data-value') || null;
                container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.applyFilters();
            });
        });
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const category = urlParams.get('category');
        const status = urlParams.get('status');
        const search = urlParams.get('search');

        if (category && this.allData[category]) {
            this.currentCategory = category;
            document.querySelectorAll('.category-tab').forEach(tab => {
                tab.classList.toggle('active', tab.getAttribute('data-category') === category);
            });
        }

        this.renderStatusTabs();

        if (status) {
            this.currentStatus = status;
            document.querySelectorAll('.status-tab').forEach(tab => {
                tab.classList.toggle('active', tab.getAttribute('data-status') === status);
            });
        }

        if (search) {
            document.getElementById('search-input').value = search;
        }

        this.renderTags();
        this.renderRegionFilter();
        this.applyFilters();
    }

    updateUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set('category', this.currentCategory);
        if (this.currentStatus) {
            urlParams.set('status', this.currentStatus);
        } else {
            urlParams.delete('status');
        }
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
    }

    applyFilters() {
        const urlParams = new URLSearchParams(window.location.search);
        const tags = urlParams.getAll('tag');
        const search = urlParams.get('search');

        let items = this.getCategoryItems(this.currentCategory, this.currentStatus);

        // 评分状态筛选
        if (this.currentRatingStatus === 'rated') {
            items = items.filter(item => item.myRating && item.myRating > 0);
        } else if (this.currentRatingStatus === 'unrated') {
            items = items.filter(item => !item.myRating || item.myRating <= 0);
        }

        // 评分等级筛选（多选）
        if (this.currentRatingLevels.size > 0) {
            items = items.filter(item => this.currentRatingLevels.has(item.myRating));
        }

        // 时间范围筛选
        if (this.currentTimeFilter !== 'all') {
            items = items.filter(item => {
                const dateStr = item.createdAt || '';
                const year = parseInt(dateStr.substring(0, 4));
                if (isNaN(year)) return false;
                if (this.currentTimeFilter === 'earlier') return year < 2024;
                return year === parseInt(this.currentTimeFilter);
            });
        }

        // 地区筛选
        if (this.currentRegion) {
            items = items.filter(item => item.region && item.region.split(/\s+/).includes(this.currentRegion));
        }

        if (tags.length > 0) {
            items = items.filter(item =>
                (item.genres && item.genres.some(g => tags.includes(g))) ||
                (item.tags && item.tags.some(t => tags.includes(t)))
            );
        }

        if (search) {
            const term = search.toLowerCase();
            items = items.filter(item =>
                (item.title && item.title.toLowerCase().includes(term)) ||
                (item.review && item.review.toLowerCase().includes(term)) ||
                (item.directors && item.directors.toLowerCase().includes(term)) ||
                (item.actors && item.actors.toLowerCase().includes(term)) ||
                (item.author && item.author.toLowerCase().includes(term)) ||
                (item.artist && item.artist.toLowerCase().includes(term)) ||
                (item.genres && item.genres.some(g => g.toLowerCase().includes(term))) ||
                (item.tags && item.tags.some(t => t.toLowerCase().includes(term)))
            );
        }

        this.currentItems = items;
        this.renderReviewsList(items);
        this.renderStats(items);
        this.updateFilterInfo(tags, search);
        this.updateActiveStates(tags);
    }

    renderReviewsList(items) {
        const container = document.getElementById('reviews-list');

        if (items.length === 0) {
            container.innerHTML = '<div class="no-reviews">没有找到相关记录</div>';
            return;
        }

        container.innerHTML = items.map(item => this.createReviewHTML(item)).join('');
        this.bindReviewEvents();
    }

    createReviewHTML(item) {
        const ratingHTML = this.createRatingHTML(item.myRating);
        const metaHTML = this.createMetaHTML(item);
        const genresHTML = this.createGenresHTML(item);
        const contentHTML = this.createContentHTML(item.review);
        const footerHTML = this.createFooterHTML(item);

        return `
            <article class="review-item" data-category="${item.category}" data-id="${item.link}">
                <div class="review-header">
                    <h3 class="review-title">
                        <a href="${item.link}" target="_blank" rel="noopener noreferrer">${this.escapeHtml(item.title)}</a>
                    </h3>
                    <div class="review-rating">${ratingHTML}</div>
                </div>
                ${metaHTML}
                ${genresHTML}
                ${contentHTML}
                ${footerHTML}
            </article>
        `;
    }

    createRatingHTML(rating) {
        if (!rating || rating <= 0) return '<div class="review-rating"><span style="color:var(--light-text);font-size:0.8rem;">未评</span></div>';
        const stars = Math.round(rating / 2);
        let html = `<span class="rating-score">${rating}</span>`;
        for (let i = 1; i <= 5; i++) {
            html += `<span class="star ${i <= stars ? 'filled' : 'empty'}">★</span>`;
        }
        return html;
    }

    createMetaHTML(item) {
        const parts = [];
        switch (item.category) {
            case 'movie':
                if (item.year) parts.push(item.year);
                if (item.region) parts.push(item.region);
                if (item.directors) parts.push(`导演: ${item.directors}`);
                break;
            case 'book':
                if (item.author) parts.push(item.author);
                if (item.year) parts.push(item.year);
                if (item.publisher) parts.push(item.publisher);
                break;
            case 'music':
                if (item.artist) parts.push(item.artist);
                if (item.year) parts.push(item.year);
                break;
            case 'game':
                if (item.developer) parts.push(item.developer);
                if (item.releaseDate) parts.push(item.releaseDate);
                break;
            case 'drama':
                if (item.type) parts.push(item.type);
                break;
        }
        if (parts.length === 0) return '';
        return `<div class="review-meta">${parts.map(p => `<span class="review-meta-item">${this.escapeHtml(p)}</span>`).join('<span class="review-meta-item">·</span>')}</div>`;
    }

    createGenresHTML(item) {
        const genres = item.genres || [];
        if (genres.length === 0) return '';
        return `<div class="review-genres">${genres.map(g => `<span class="review-genre" data-tag="${this.escapeHtml(g)}">${this.escapeHtml(g)}</span>`).join('')}</div>`;
    }

    createContentHTML(review) {
        if (!review) return '';
        let html = review;
        if (this.md) {
            html = this.md.render(html);
        }
        return `<div class="review-content">${html}</div>`;
    }

    createFooterHTML(item) {
        const date = this.formatDate(item.createdAt);
        const doubanRating = item.doubanRating ? `豆瓣 <strong>${item.doubanRating}</strong>` : '';
        const tagsHTML = (item.tags && item.tags.length > 0) ?
            item.tags.map(t => `<span class="review-tag" data-tag="${this.escapeHtml(t)}">${this.escapeHtml(t)}</span>`).join('') : '';

        return `
            <div class="review-footer">
                <span class="review-date">${date}</span>
                ${doubanRating ? `<span class="review-douban-rating">${doubanRating}</span>` : ''}
                ${tagsHTML ? `<div class="review-tags">${tagsHTML}</div>` : ''}
            </div>
        `;
    }

    renderStats(items) {
        const allItems = this.getCategoryItems(this.currentCategory);
        const reviewedItems = items.filter(i => i.myRating > 0);
        const avgRating = reviewedItems.length > 0 ?
            (reviewedItems.reduce((sum, i) => sum + i.myRating, 0) / reviewedItems.length).toFixed(1) : '-';

        document.getElementById('stat-current').textContent = items.length;
        document.getElementById('stat-total').textContent = allItems.length;
        document.getElementById('stat-reviewed').textContent = reviewedItems.length;
        document.getElementById('stat-avg').textContent = avgRating;
    }

    updateFilterInfo(tags, search) {
        const filterInfo = document.getElementById('filter-info');
        const filterTags = document.getElementById('filter-tags');

        if (!filterInfo || !filterTags) return;

        filterTags.innerHTML = '';

        tags.forEach(tag => {
            const el = document.createElement('div');
            el.className = 'filter-tag';
            el.innerHTML = `<span>标签: ${tag}</span><button class="filter-tag-remove" data-type="tag" data-value="${tag}" title="移除">×</button>`;
            el.querySelector('.filter-tag-remove').addEventListener('click', () => {
                this.removeFilter('tag', tag);
            });
            filterTags.appendChild(el);
        });

        if (search) {
            const el = document.createElement('div');
            el.className = 'filter-tag';
            el.innerHTML = `<span>搜索: ${search}</span><button class="filter-tag-remove" data-type="search" title="移除">×</button>`;
            el.querySelector('.filter-tag-remove').addEventListener('click', () => {
                this.removeFilter('search');
            });
            filterTags.appendChild(el);
        }

        filterInfo.style.display = filterTags.children.length > 0 ? 'flex' : 'none';
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

    updateActiveStates(tags) {
        document.querySelectorAll('#tags-container .filter-btn').forEach(badge => {
            const tag = badge.getAttribute('data-tag');
            badge.classList.toggle('active', tags.includes(tag));
        });

        document.querySelectorAll('.review-genre, .review-tag').forEach(el => {
            const tag = el.getAttribute('data-tag');
            el.classList.toggle('active', tags.includes(tag));
        });
    }

    bindReviewEvents() {
        document.querySelectorAll('.review-genre, .review-tag').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleTagFilter(el.getAttribute('data-tag'));
            });
        });
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-CN', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    escapeHtml(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new ReviewsManager();
});
