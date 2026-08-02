class ReviewsManager extends FilterableListManager {
    constructor() {
        super();
        this.allData = {};
        this.currentCategory = 'movie';
        this.currentStatus = null;
        this.currentRatingStatus = 'rated';
        this.currentRatingLevels = new Set();
        this.currentTimeFilter = 'all';
        this.currentRegion = null;
        this.currentSort = 'time';
        this.currentMonth = null;
        this.currentItems = [];
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

    async loadAllData() {
        const categories = ['movie', 'book', 'music', 'game', 'drama'];
        const promises = categories.map(async (cat) => {
            const data = await fetchJSON(`JSON/review-${cat}s.json`, {});
            this.allData[cat] = data;
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
        this.renderTimeFilter();
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
                // 切换状态后数据集变化，重置时间筛选
                this.currentTimeFilter = 'all';
                this.currentMonth = null;
                container.querySelectorAll('.status-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.renderTags();
                this.renderRegionFilter();
                this.renderTimeFilter();
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
                this.filterByTag(badge.getAttribute('data-tag'));
            });
        });
    }

    bindClearFilter() {
        const clearFilterBtn = document.getElementById('clear-filter');
        if (clearFilterBtn) {
            clearFilterBtn.addEventListener('click', () => {
                setUrlParams(new URLSearchParams());
                document.getElementById('search-input').value = '';
                this.currentRatingStatus = 'rated';
                this.currentRatingLevels.clear();
                this.currentTimeFilter = 'all';
                this.currentMonth = null;
                this.resetAdvancedFilterUI();
                this.renderTimeFilter();
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

        const sortFilter = document.getElementById('sort-filter');
        if (sortFilter) {
            sortFilter.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.currentSort = btn.getAttribute('data-value');
                    // 切换排序方式后，时间字段含义改变，重置时间筛选
                    this.currentTimeFilter = 'all';
                    this.currentMonth = null;
                    sortFilter.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                    btn.classList.add('active');
                    this.renderTimeFilter();
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

        const monthFilterGroup = document.getElementById('month-filter-group');
        if (monthFilterGroup) monthFilterGroup.style.display = 'none';

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
            html += `<button class="filter-btn ${this.currentRegion === region ? 'active' : ''}" data-value="${escapeHtml(region)}">${escapeHtml(region)} (${regionCount[region]})</button>`;
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

    renderTimeFilter() {
        const container = document.getElementById('time-filter');
        if (!container) return;

        const items = this.getCategoryItems(this.currentCategory, this.currentStatus);

        // 根据排序方式决定时间字段
        const getYear = (item) => {
            if (this.currentSort === 'year') {
                return item.year;
            } else {
                const dateStr = item.createdAt || '';
                return parseInt(dateStr.substring(0, 4));
            }
        };

        // 收集所有年份
        const yearCount = {};
        let unknownCount = 0;
        items.forEach(item => {
            const year = getYear(item);
            if (isNaN(year)) {
                unknownCount++;
            } else {
                yearCount[year] = (yearCount[year] || 0) + 1;
            }
        });

        // 排序年份（从新到旧）
        const years = Object.keys(yearCount).map(Number).sort((a, b) => b - a);

        // 生成按钮
        let html = `<button class="filter-btn ${this.currentTimeFilter === 'all' ? 'active' : ''}" data-value="all">全部</button>`;
        years.forEach(year => {
            html += `<button class="filter-btn ${this.currentTimeFilter === String(year) ? 'active' : ''}" data-value="${year}">${year} (${yearCount[year]})</button>`;
        });
        if (unknownCount > 0) {
            html += `<button class="filter-btn ${this.currentTimeFilter === 'unknown' ? 'active' : ''}" data-value="unknown">未知 (${unknownCount})</button>`;
        }

        container.innerHTML = html;

        // 绑定事件
        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentTimeFilter = btn.getAttribute('data-value');
                this.currentMonth = null;
                container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.renderMonthFilter();
                this.applyFilters();
            });
        });

        this.renderMonthFilter();
    }

    renderMonthFilter() {
        const group = document.getElementById('month-filter-group');
        const container = document.getElementById('month-filter');
        if (!group || !container) return;

        // 只在选中具体年份且按评论时间排序时显示月份筛选
        if (this.currentTimeFilter === 'all' || this.currentTimeFilter === 'unknown' || this.currentSort === 'year') {
            group.style.display = 'none';
            return;
        }

        const items = this.getCategoryItems(this.currentCategory, this.currentStatus);
        const year = parseInt(this.currentTimeFilter);

        // 收集该年份的月份
        const monthCount = {};
        items.forEach(item => {
            const dateStr = item.createdAt || '';
            const y = parseInt(dateStr.substring(0, 4));
            if (y === year) {
                const m = parseInt(dateStr.substring(5, 7));
                if (!isNaN(m)) {
                    monthCount[m] = (monthCount[m] || 0) + 1;
                }
            }
        });

        const months = Object.keys(monthCount).map(Number).sort((a, b) => a - b);
        if (months.length <= 1) {
            group.style.display = 'none';
            return;
        }

        group.style.display = '';
        let html = `<button class="filter-btn ${!this.currentMonth ? 'active' : ''}" data-value="">全部</button>`;
        months.forEach(month => {
            html += `<button class="filter-btn ${this.currentMonth === String(month) ? 'active' : ''}" data-value="${month}">${month}月 (${monthCount[month]})</button>`;
        });

        container.innerHTML = html;

        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.currentMonth = btn.getAttribute('data-value') || null;
                container.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.applyFilters();
            });
        });
    }

    checkUrlParams() {
        const urlParams = getUrlParams();
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
        this.renderTimeFilter();
        this.applyFilters();
    }

    updateUrlParams() {
        const urlParams = getUrlParams();
        urlParams.set('category', this.currentCategory);
        if (this.currentStatus) {
            urlParams.set('status', this.currentStatus);
        } else {
            urlParams.delete('status');
        }
        setUrlParams(urlParams);
    }

    applyFilters() {
        const urlParams = getUrlParams();
        const tags = urlParams.getAll('tag');
        const search = urlParams.get('search');

        let items = this.getCategoryItems(this.currentCategory, this.currentStatus);

        // 评分状态筛选
        if (this.currentRatingStatus === 'rated') {
            items = items.filter(item => item.myRating !== null && item.myRating !== undefined);
        } else if (this.currentRatingStatus === 'unrated') {
            items = items.filter(item => item.myRating === null || item.myRating === undefined);
        }

        // 评分等级筛选（多选）
        if (this.currentRatingLevels.size > 0) {
            items = items.filter(item => this.currentRatingLevels.has(item.myRating));
        }

        // 时间范围筛选
        if (this.currentTimeFilter !== 'all') {
            items = items.filter(item => {
                let year;
                if (this.currentSort === 'year') {
                    year = item.year;
                } else {
                    const dateStr = item.createdAt || '';
                    year = parseInt(dateStr.substring(0, 4));
                }
                if (this.currentTimeFilter === 'unknown') return isNaN(year);
                if (isNaN(year)) return false;
                return year === parseInt(this.currentTimeFilter);
            });

            // 月份筛选（仅在按评论时间排序且选了具体月份时生效）
            if (this.currentMonth && this.currentSort !== 'year') {
                const year = parseInt(this.currentTimeFilter);
                const month = parseInt(this.currentMonth);
                items = items.filter(item => {
                    const dateStr = item.createdAt || '';
                    const y = parseInt(dateStr.substring(0, 4));
                    const m = parseInt(dateStr.substring(5, 7));
                    return y === year && m === month;
                });
            }
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
                (item.views && item.views.some(v => v.review && v.review.toLowerCase().includes(term))) ||
                (item.directors && item.directors.toLowerCase().includes(term)) ||
                (item.actors && item.actors.toLowerCase().includes(term)) ||
                (item.author && item.author.toLowerCase().includes(term)) ||
                (item.artist && item.artist.toLowerCase().includes(term)) ||
                (item.genres && item.genres.some(g => g.toLowerCase().includes(term))) ||
                (item.tags && item.tags.some(t => t.toLowerCase().includes(term)))
            );
        }

        // 排序
        if (this.currentSort === 'year') {
            items.sort((a, b) => b.year - a.year);
        } else {
            items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        this.currentItems = items;
        this.renderReviewsList(items);
        this.renderStats(items);
        this.updateFilterInfo(tags, search);
        this.updateActiveStates(tags);
    }

    renderReviewsList(items) {
        const container = document.getElementById('reviews-list');

        // 销毁之前的瀑布流实例
        if (this.masonryDestroy) this.masonryDestroy();

        if (items.length === 0) {
            container.innerHTML = '<div class="no-reviews">没有找到相关记录</div>';
            return;
        }

        const elements = items.map(item => this.createReviewElement(item));

        this.masonryDestroy = MasonryLayout({
            container: container,
            items: elements,
            columnMinWidth: 340,
            columnGap: 30
        });

        this.bindReviewEvents();
    }

    createReviewElement(item) {
        const article = document.createElement('article');
        article.className = 'review-item';
        article.dataset.category = item.category;
        article.dataset.id = item.link;
        if (item.myRating !== null && item.myRating !== undefined) {
            article.dataset.rating = item.myRating;
        }

        const stamp = this.createStampElement(item);
        article.appendChild(stamp);

        // header
        const header = document.createElement('div');
        header.className = 'review-header';

        const title = document.createElement('h3');
        title.className = 'review-title';
        const link = document.createElement('a');
        link.href = item.link;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = item.title;
        title.appendChild(link);
        header.appendChild(title);

        const ratingDiv = document.createElement('div');
        ratingDiv.className = 'review-rating';
        ratingDiv.innerHTML = this.createRatingHTML(item.myRating);
        header.appendChild(ratingDiv);

        article.appendChild(header);

        // meta
        const metaHTML = this.createMetaHTML(item);
        if (metaHTML) {
            const metaDiv = document.createElement('div');
            metaDiv.innerHTML = metaHTML;
            article.appendChild(metaDiv.firstElementChild);
        }

        // genres
        const genresHTML = this.createGenresHTML(item);
        if (genresHTML) {
            const genresDiv = document.createElement('div');
            genresDiv.innerHTML = genresHTML;
            article.appendChild(genresDiv.firstElementChild);
        }

        // content（多视图时 createContentHTML 会返回多个块，需全部插入）
        const contentHTML = this.createContentHTML(item);
        if (contentHTML) {
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = contentHTML;
            while (contentDiv.firstChild) {
                article.appendChild(contentDiv.firstChild);
            }
        }

        // footer
        const footerHTML = this.createFooterHTML(item);
        if (footerHTML) {
            const footerDiv = document.createElement('div');
            footerDiv.innerHTML = footerHTML;
            article.appendChild(footerDiv.firstElementChild);
        }

        return article;
    }

    createRatingHTML(rating) {
        if (rating === null || rating === undefined) return '<div class="review-rating"><span style="color:var(--light-text);font-size:0.8rem;">未评</span></div>';
        const starRating = rating / 2;
        const fullStars = Math.floor(starRating);
        const hasHalf = (starRating - fullStars) >= 0.25;
        let html = `<span class="rating-score">${rating}</span>`;
        for (let i = 1; i <= 5; i++) {
            if (i <= fullStars) {
                html += `<span class="star filled">★</span>`;
            } else if (i === fullStars + 1 && hasHalf) {
                html += `<span class="star half">★</span>`;
            } else {
                html += `<span class="star empty">★</span>`;
            }
        }
        return html;
    }

    getStampInfo(rating) {
        if (rating === null || rating === undefined) return null;
        const texts = {
            10: '夯', 9: '顶级', 8: '上佳', 7: '人上人', 6: '不错',
            5: 'NPC', 4: '不行', 3: '拉', 2: '拉胯', 1: '拉完了', 0: '纯垃圾'
        };
        const colors = {
            10: '#e74c3c', 9: '#e67e22', 8: '#f39c12', 7: '#f1c40f', 6: '#2ecc71',
            5: '#16a085', 4: '#1abc9c', 3: '#3498db', 2: '#95a5a6', 1: '#7f8c8d', 0: '#000000'
        };
        return { text: texts[rating] || '拉完了', color: colors[rating] || '#7f8c8d' };
    }

    createStampElement(item) {
        const stamp = document.createElement('div');
        stamp.className = 'review-stamp';
        const info = this.getStampInfo(item.myRating);
        if (info) {
            stamp.textContent = info.text;
        } else {
            switch (item.category) {
                case 'movie':
                    stamp.textContent = '影';
                    break;
                case 'book':
                    stamp.textContent = '书';
                    break;
                case 'music':
                    stamp.textContent = '音';
                    break;
                case 'game':
                    stamp.textContent = '游';
                    break;
                case 'drama':
                    stamp.textContent = '剧';
                    break;
                default:
                    stamp.textContent = '记';
            }
        }

        return stamp;
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
        return `<div class="review-meta">${parts.map(p => `<span class="review-meta-item">${escapeHtml(p)}</span>`).join('<span class="review-meta-item">·</span>')}</div>`;
    }

    createGenresHTML(item) {
        const genres = item.genres || [];
        if (genres.length === 0) return '';
        return `<div class="review-genres">${genres.map(g => `<span class="review-genre" data-tag="${escapeHtml(g)}">${escapeHtml(g)}</span>`).join('')}</div>`;
    }

    createContentHTML(item) {
        // 多次观看：分块渲染
        if (item.views && item.views.length > 0) {
            return item.views.map((view, index) => {
                let reviewHtml = view.review || '';
                if (this.md) reviewHtml = this.md.render(reviewHtml);
                const label = view.label || (index === 0 ? '首刷' : `第${index + 1}刷`);
                const date = view.date ? formatDate(view.date) : '';
                const ratingHtml = (view.rating !== null && view.rating !== undefined)
                    ? `<span class="review-view-rating">${this.createRatingHTML(view.rating)}</span>`
                    : '';
                // 有评分的视图在评价结尾盖等级章；最后一次影评的等级由卡片角落大章（myRating）代表，避免重复
                const isLast = index === item.views.length - 1;
                const stampInfo = isLast ? null : this.getStampInfo(view.rating);
                const stampHtml = stampInfo
                    ? `<span class="review-view-stamp" style="color:${stampInfo.color}">${escapeHtml(stampInfo.text)}</span>`
                    : '';
                return `<div class="review-view-block">
                    <div class="review-view-header">
                        <span class="review-view-label">${escapeHtml(label)}</span>
                        ${date ? `<span class="review-view-date">${date}</span>` : ''}
                        ${ratingHtml}
                    </div>
                    <div class="review-content">${reviewHtml}</div>
                    ${stampHtml}
                </div>`;
            }).join('');
        }

        // 单次观看：保持原逻辑
        if (!item.review) return '';
        let html = item.review;
        if (this.md) {
            html = this.md.render(html);
        }
        return `<div class="review-content">${html}</div>`;
    }

    createFooterHTML(item) {
        const hasViews = item.views && item.views.length > 0;
        const date = hasViews ? '' : formatDate(item.createdAt);
        const doubanRating = item.doubanRating ? `豆瓣 <strong>${item.doubanRating}</strong>` : '';
        const tagsHTML = (item.tags && item.tags.length > 0) ?
            item.tags.map(t => `<span class="review-tag" data-tag="${escapeHtml(t)}">${escapeHtml(t)}</span>`).join('') : '';

        // 多视图时日期已在各视图块内显示；无任何 footer 内容则不渲染
        if (!date && !doubanRating && !tagsHTML) return '';

        return `
            <div class="review-footer">
                ${date ? `<span class="review-date">${date}</span>` : ''}
                ${doubanRating ? `<span class="review-douban-rating">${doubanRating}</span>` : ''}
                ${tagsHTML ? `<div class="review-tags">${tagsHTML}</div>` : ''}
            </div>
        `;
    }

    renderStats(items) {
        const allItems = this.getCategoryItems(this.currentCategory);
        const reviewedItems = items.filter(i => i.myRating !== null && i.myRating !== undefined);
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
                this.filterByTag(el.getAttribute('data-tag'));
            });
        });
    }

}



document.addEventListener('DOMContentLoaded', () => {
    new ReviewsManager();
});
