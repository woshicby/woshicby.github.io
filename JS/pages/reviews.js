/**
 * 书影音游剧记录页面脚本
 * 对应页面: reviews.html
 * 功能: 展示电影/书籍/音乐/游戏/剧场记录,支持分类/评分/地区/时间筛选、
 *       列表/时间轴双视图、详情弹窗(含关联票据)。
 */

class ReviewsManager extends FilterableListManager {
    /** 构造函数: 初始化管理器 */
    constructor() {
        super();
        this.allData = {};
        this.ticketsData = [];
        this.currentCategory = 'movie';
        this.currentStatus = null;
        this.currentRatingStatus = 'rated';
        this.currentRatingLevels = new Set();
        this.currentTimeFilter = 'all';
        this.currentRegion = null;
        this.currentSort = 'time';
        this.currentMonth = null;
        this.currentItems = [];
        this.currentView = 'list';
        this.masonryDestroys = [];
        this.init();
    }

    /**
     * 初始化: 加载数据 + 渲染
     */
    async init() {
        try {
            this.initMarkdown();
            await this.loadAllData();
            this.bindCategoryTabs();
            this.bindViewSwitcher();
            this.bindSearch();
            this.bindClearFilter();
            this.bindAdvancedFilters();
            this.bindReviewDetailClose();
            this.checkUrlParams();
            initBackToTopButton();
        } catch (error) {
            console.error('加载豆瓣记录失败:', error);
            document.getElementById('reviews-list').innerHTML = '<div class="error">加载豆瓣记录失败</div>';
        }
    }

    /**
     * 加载所有分类数据(书/影/音/游/剧)
     */
    async loadAllData() {
        const categories = ['movie', 'book', 'music', 'game', 'drama'];
        const promises = categories.map(async (cat) => {
            const data = await fetchJSON(`JSON/review-${cat}s.json`, {});
            this.allData[cat] = data;
        });
        await Promise.all(promises);
        // 加载票据数据（用于详情窗口中的观影记录）
        try {
            const ticketsData = await fetchJSON('JSON/tickets.json', []);
            const imageMap = await fetchJSON('JSON/ticket-images.json', {});
            // 根据 日期_标题 自动匹配图片
            ticketsData.forEach(ticket => {
                const date = ticket.date || '';
                const date8 = date.substring(0, 10).replace(/-/g, '') || '';
                const title = ticket.title || '';
                const key = `${date8}_${title}`;
                ticket.images = imageMap[key] || [];
            });
            this.ticketsData = ticketsData;
        } catch (e) {
            this.ticketsData = [];
        }
    }

    /**
     * 获取指定分类的条目
     */
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

    /**
     * 获取分类的状态列表
     */
    getStatuses(category) {
        const data = this.allData[category] || {};
        return Object.keys(data);
    }

    /**
     * 绑定分类标签页事件
     */
    bindCategoryTabs() {
        document.querySelectorAll('.category-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.getAttribute('data-category');
                this.switchCategory(category);
            });
        });
    }

    /**
     * 绑定视图切换(列表/时间轴)
     */
    bindViewSwitcher() {
        document.querySelectorAll('.view-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const view = tab.getAttribute('data-view');
                this.switchView(view);
            });
        });
    }

    /**
     * 切换视图模式
     */
    switchView(view) {
        if (this.currentView === view) return;
        this.currentView = view;
        document.querySelectorAll('.view-tab').forEach(tab => {
            tab.classList.toggle('active', tab.getAttribute('data-view') === view);
        });
        this.applyFilters();
    }

    /**
     * 切换分类
     */
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

    /**
     * 渲染状态标签
     */
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

    /**
     * 提取标签
     */
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

    /**
     * 渲染标签栏
     */
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

    /**
     * 绑定清除筛选
     */
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

    /**
     * 绑定高级筛选
     */
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

    /**
     * 重置高级筛选 UI
     */
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

    /**
     * 渲染地区筛选
     */
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

    /**
     * 渲染时间筛选
     */
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

    /**
     * 渲染月份筛选
     */
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

    /**
     * 从 URL 参数恢复筛选状态
     */
    checkUrlParams() {
        const urlParams = getUrlParams();
        const category = urlParams.get('category');
        const status = urlParams.get('status');
        const search = urlParams.get('search');
        const ratingStatus = urlParams.get('ratingStatus');
        const ratingLevel = urlParams.get('ratingLevel');
        const time = urlParams.get('time');
        const month = urlParams.get('month');
        const region = urlParams.get('region');
        const sort = urlParams.get('sort');

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

        // 评分状态
        if (ratingStatus) {
            this.currentRatingStatus = ratingStatus;
            const ratingStatusFilter = document.getElementById('rating-status-filter');
            if (ratingStatusFilter) {
                ratingStatusFilter.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-value') === ratingStatus);
                });
            }
        }

        // 评分等级
        if (ratingLevel) {
            ratingLevel.split(',').forEach(v => {
                const level = parseInt(v);
                if (!isNaN(level)) this.currentRatingLevels.add(level);
            });
            const ratingLevelFilter = document.getElementById('rating-level-filter');
            if (ratingLevelFilter) {
                ratingLevelFilter.querySelectorAll('.filter-btn').forEach(btn => {
                    const val = parseInt(btn.getAttribute('data-value'));
                    btn.classList.toggle('active', this.currentRatingLevels.has(val));
                });
            }
        }

        // 时间筛选
        if (time) {
            this.currentTimeFilter = time;
            const timeFilter = document.getElementById('time-filter');
            if (timeFilter) {
                timeFilter.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-value') === time);
                });
            }
        }

        // 月份
        if (month) {
            this.currentMonth = month;
            const monthFilter = document.getElementById('month-filter');
            if (monthFilter) {
                monthFilter.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-value') === month);
                });
            }
        }

        // 地区
        if (region) {
            this.currentRegion = region;
            const regionFilter = document.getElementById('region-filter');
            if (regionFilter) {
                regionFilter.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-value') === region);
                });
            }
        }

        // 排序
        if (sort) {
            this.currentSort = sort;
            const sortFilter = document.getElementById('sort-filter');
            if (sortFilter) {
                sortFilter.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-value') === sort);
                });
            }
        }

        this.renderTags();
        this.renderRegionFilter();
        this.renderTimeFilter();
        this.applyFilters();
    }

    /**
     * 更新 URL 参数(保持筛选状态可分享)
     */
    updateUrlParams() {
        const urlParams = getUrlParams();
        urlParams.set('category', this.currentCategory);
        if (this.currentStatus) {
            urlParams.set('status', this.currentStatus);
        } else {
            urlParams.delete('status');
        }

        // 评分状态
        if (this.currentRatingStatus !== 'rated') {
            urlParams.set('ratingStatus', this.currentRatingStatus);
        } else {
            urlParams.delete('ratingStatus');
        }

        // 评分等级
        if (this.currentRatingLevels.size > 0) {
            urlParams.set('ratingLevel', Array.from(this.currentRatingLevels).sort((a, b) => a - b).join(','));
        } else {
            urlParams.delete('ratingLevel');
        }

        // 时间筛选
        if (this.currentTimeFilter !== 'all') {
            urlParams.set('time', this.currentTimeFilter);
        } else {
            urlParams.delete('time');
        }

        // 月份
        if (this.currentMonth) {
            urlParams.set('month', this.currentMonth);
        } else {
            urlParams.delete('month');
        }

        // 地区
        if (this.currentRegion) {
            urlParams.set('region', this.currentRegion);
        } else {
            urlParams.delete('region');
        }

        // 排序
        if (this.currentSort !== 'time') {
            urlParams.set('sort', this.currentSort);
        } else {
            urlParams.delete('sort');
        }

        setUrlParams(urlParams);
    }

    /**
     * 移除筛选条件
     */
    removeFilter(paramType, value = null) {
        if (paramType === 'search') {
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.value = '';
        } else if (paramType === 'status') {
            this.currentStatus = null;
            document.querySelectorAll('.status-tab').forEach(tab => {
                tab.classList.toggle('active', tab.getAttribute('data-status') === '');
            });
            this.renderTags();
            this.renderRegionFilter();
            this.renderTimeFilter();
        } else if (paramType === 'ratingStatus') {
            this.currentRatingStatus = 'rated';
            const ratingStatusFilter = document.getElementById('rating-status-filter');
            if (ratingStatusFilter) {
                ratingStatusFilter.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-value') === 'rated');
                });
            }
        } else if (paramType === 'ratingLevel') {
            this.currentRatingLevels.clear();
            const ratingLevelFilter = document.getElementById('rating-level-filter');
            if (ratingLevelFilter) {
                ratingLevelFilter.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
            }
        } else if (paramType === 'time') {
            this.currentTimeFilter = 'all';
            this.currentMonth = null;
            const timeFilter = document.getElementById('time-filter');
            if (timeFilter) {
                timeFilter.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-value') === 'all');
                });
            }
            this.renderMonthFilter();
        } else if (paramType === 'month') {
            this.currentMonth = null;
            const monthFilter = document.getElementById('month-filter');
            if (monthFilter) {
                monthFilter.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-value') === '');
                });
            }
        } else if (paramType === 'region') {
            this.currentRegion = null;
            const regionFilter = document.getElementById('region-filter');
            if (regionFilter) {
                regionFilter.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-value') === '');
                });
            }
        } else if (paramType === 'sort') {
            this.currentSort = 'time';
            this.currentTimeFilter = 'all';
            this.currentMonth = null;
            const sortFilter = document.getElementById('sort-filter');
            if (sortFilter) {
                sortFilter.querySelectorAll('.filter-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.getAttribute('data-value') === 'time');
                });
            }
            this.renderTimeFilter();
        } else if (paramType === 'tag') {
            // 标签通过 URL 参数管理，updateUrlParams 不管理 tag，直接移除并更新 URL
            const urlParams = removeUrlParam(paramType, value);
            setUrlParams(urlParams);
        } else {
            // 其他参数由 updateUrlParams 统一管理（JS 状态已在上方更新）
            this.updateUrlParams();
        }

        this.applyFilters();
    }

    /**
     * 应用所有筛选条件
     */
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
        if (this.currentView === 'timeline') {
            this.renderTimelineList(items);
        } else {
            this.renderReviewsList(items);
        }
        this.renderStats(items);
        this.updateFilterInfo(tags, search);
        this.updateActiveStates(tags);
    }

    /**
     * 渲染卡片列表视图
     */
    renderReviewsList(items) {
        const container = document.getElementById('reviews-list');

        // 销毁所有瀑布流实例（列表视图 + 时间轴视图）
        if (this.masonryDestroy) this.masonryDestroy();
        this.masonryDestroy = null;
        this.masonryDestroys.forEach(d => { if (d) d(); });
        this.masonryDestroys = [];

        // 清除旧的 inline height（时间轴视图可能未设置，但列表视图会设置）
        container.style.height = '';

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

    /**
     * 渲染时间轴视图
     */
    renderTimelineList(items) {
        const container = document.getElementById('reviews-list');

        // 销毁所有瀑布流实例
        if (this.masonryDestroy) this.masonryDestroy();
        this.masonryDestroy = null;
        this.masonryDestroys.forEach(d => { if (d) d(); });
        this.masonryDestroys = [];

        // 清除旧的 inline height（列表视图的 MasonryLayout 会设置容器高度）
        container.style.height = '';

        if (items.length === 0) {
            container.innerHTML = '<div class="no-reviews">没有找到相关记录</div>';
            return;
        }

        // 按 createdAt 的年→月分组
        const yearGroups = {};
        items.forEach(item => {
            const date = item.createdAt || '';
            const year = date.substring(0, 4) || '未知';
            const month = date.substring(5, 7) || '??';
            if (!yearGroups[year]) yearGroups[year] = {};
            if (!yearGroups[year][month]) yearGroups[year][month] = [];
            yearGroups[year][month].push(item);
        });

        const years = Object.keys(yearGroups).sort((a, b) => b.localeCompare(a));
        let html = '<div class="reviews-timeline">';

        years.forEach(year => {
            const months = Object.keys(yearGroups[year]).sort((a, b) => b.localeCompare(a));
            let yearCount = 0;
            months.forEach(m => { yearCount += yearGroups[year][m].length; });

            html += `<div class="timeline-year">`;
            html += `<div class="timeline-year-label">`;
            html += `<span class="timeline-year-text">${year}年</span>`;
            html += `<span class="timeline-year-count">共 ${yearCount} 条</span>`;
            html += `</div>`;

            months.forEach(month => {
                const monthItems = yearGroups[year][month];
                const monthNum = parseInt(month, 10);
                const monthLabel = isNaN(monthNum) ? month : `${year}年${monthNum}月`;
                html += `<div class="timeline-month">`;
                html += `<div class="timeline-month-label">`;
                html += `<span class="timeline-month-text">${monthLabel}</span>`;
                html += `<span class="timeline-month-count">${monthItems.length} 条</span>`;
                html += `</div>`;
                html += `<div class="timeline-masonry" data-year="${year}" data-month="${month}"></div>`;
                html += `</div>`;
            });

            html += `</div>`;
        });

        html += '</div>';
        container.innerHTML = html;

        // 每个分组内创建瀑布流
        const masonryContainers = container.querySelectorAll('.timeline-masonry');
        masonryContainers.forEach(mc => {
            const year = mc.getAttribute('data-year');
            const month = mc.getAttribute('data-month');
            const monthItems = yearGroups[year][month] || [];
            const elements = monthItems.map(item => this.createReviewElement(item));
            const destroy = MasonryLayout({
                container: mc,
                items: elements,
                columnMinWidth: 340,
                columnGap: 30
            });
            this.masonryDestroys.push(destroy);
        });

        this.bindReviewEvents();
    }

    /**
     * 创建单条评价卡片元素
     */
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
        // showAllStamps=false：卡片视图，最后一次不盖章（卡片角落已有大章）
        const contentHTML = this.createContentHTML(item, false);
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

    /**
     * 生成评分 HTML(星星+分数)
     */
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

    /**
     * 获取评分对应的印章信息
     */
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

    /**
     * 创建评分印章元素
     */
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

    /**
     * 生成元信息 HTML
     */
    createMetaHTML(item) {
        const parts = [];
        const badges = [];
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
                // 兼容 platforms(数组,新) 与 platform(字符串,旧)
                if (item.platforms && item.platforms.length > 0) {
                    parts.push(item.platforms.join(' / '));
                } else if (item.platform) {
                    parts.push(item.platform);
                }
                if (item.hours !== null && item.hours !== undefined && item.hours > 0) {
                    parts.push(`游玩 ${item.hours} 小时`);
                }
                if (item.earlyAccess) badges.push({ text: '抢先体验', cls: 'review-badge-early' });
                break;
            case 'drama':
                if (item.type) parts.push(item.type);
                break;
        }
        if (parts.length === 0 && badges.length === 0) return '';
        const partsHTML = parts.length > 0
            ? parts.map(p => `<span class="review-meta-item">${escapeHtml(p)}</span>`).join('<span class="review-meta-item">·</span>')
            : '';
        const badgesHTML = badges.map(b => `<span class="review-badge ${b.cls || ''}">${escapeHtml(b.text)}</span>`).join('');
        return `<div class="review-meta">${partsHTML}${badgesHTML}</div>`;
    }

    /**
     * 生成类型标签 HTML
     */
    createGenresHTML(item) {
        const genres = item.genres || [];
        if (genres.length === 0) return '';
        return `<div class="review-genres">${genres.map(g => `<span class="review-genre" data-tag="${escapeHtml(g)}">${escapeHtml(g)}</span>`).join('')}</div>`;
    }

    /**
     * 生成内容 HTML
     */
    createContentHTML(item, showAllStamps = false) {
        // 多次观看（2次及以上）：分块渲染
        if (item.views && item.views.length > 1) {
            return item.views.map((view, index) => {
                let reviewHtml = view.review || '';
                if (this.md) reviewHtml = this.md.render(reviewHtml);
                const label = view.label || (index === 0 ? '首刷' : `第${index + 1}刷`);
                const date = view.date ? formatDate(view.date) : '';
                const ratingHtml = (view.rating !== null && view.rating !== undefined)
                    ? `<span class="review-view-rating">${this.createRatingHTML(view.rating)}</span>`
                    : '';
                // 卡片视图：最后一个视图不盖章（卡片角落有大章）；详情窗口：全部盖章
                const isLast = index === item.views.length - 1;
                const stampInfo = (showAllStamps || !isLast) ? this.getStampInfo(view.rating) : null;
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

        // 单次观看：从 views[0].review 或 item.review 获取内容
        const reviewText = (item.views && item.views.length === 1)
            ? (item.views[0].review || '')
            : (item.review || '');
        if (!reviewText) return '';
        let html = reviewText;
        if (this.md) {
            html = this.md.render(html);
        }
        // 单次评价：详情窗口显示印章（使用 myRating），卡片不显示
        const stampInfo = showAllStamps ? this.getStampInfo(item.myRating) : null;
        const stampHtml = stampInfo
            ? `<span class="review-view-stamp" style="color:${stampInfo.color}">${escapeHtml(stampInfo.text)}</span>`
            : '';
        return `<div class="review-view-block"><div class="review-content">${html}</div>${stampHtml}</div>`;
    }

    /**
     * 生成底部 HTML
     */
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

    /**
     * 渲染统计信息
     */
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

    /**
     * 更新筛选信息
     */
    updateFilterInfo(tags, search) {
        const filterInfo = document.getElementById('filter-info');
        const filterTags = document.getElementById('filter-tags');
        if (!filterInfo || !filterTags) return;

        filterTags.innerHTML = '';

        const entries = [];

        // 状态
        if (this.currentStatus) {
            const statusLabels = {
                'watched': '看过', 'watching': '在看', 'wantToWatch': '想看',
                'listened': '听过', 'listening': '在听', 'wantToListen': '想听',
                'read': '读过', 'reading': '在读', 'wantToRead': '想读',
                'played': '玩过', 'playing': '在玩', 'wantToPlay': '想玩'
            };
            entries.push({ type: '状态', value: statusLabels[this.currentStatus] || this.currentStatus, paramType: 'status' });
        }

        // 评分状态
        if (this.currentRatingStatus !== 'rated') {
            entries.push({ type: '评分状态', value: this.currentRatingStatus === 'unrated' ? '未评分' : '全部', paramType: 'ratingStatus' });
        }

        // 评分等级
        if (this.currentRatingLevels.size > 0) {
            const levels = Array.from(this.currentRatingLevels).sort((a, b) => a - b);
            entries.push({ type: '评分等级', value: levels.map(l => `${l}分`).join(','), paramType: 'ratingLevel', multi: true });
        }

        // 时间筛选
        if (this.currentTimeFilter !== 'all') {
            if (this.currentTimeFilter === 'unknown') {
                entries.push({ type: '时间', value: '未知', paramType: 'time' });
            } else {
                entries.push({ type: '时间', value: `${this.currentTimeFilter}年`, paramType: 'time' });
            }
        }

        // 月份
        if (this.currentMonth) {
            entries.push({ type: '月份', value: `${this.currentMonth}月`, paramType: 'month' });
        }

        // 地区
        if (this.currentRegion) {
            entries.push({ type: '地区', value: this.currentRegion, paramType: 'region' });
        }

        // 标签
        tags.forEach(tag => {
            entries.push({ type: '标签', value: tag, paramType: 'tag' });
        });

        // 搜索
        if (search) {
            entries.push({ type: '搜索', value: search, paramType: 'search' });
        }

        entries.forEach(entry => {
            const el = document.createElement('div');
            el.className = 'filter-tag';
            el.innerHTML = `<span>${entry.type}: ${entry.value}</span><button class="filter-tag-remove" data-type="${entry.paramType}" data-value="${entry.multi ? '' : escapeHtml(entry.value)}" title="移除">×</button>`;
            el.querySelector('.filter-tag-remove').addEventListener('click', () => {
                this.removeFilter(entry.paramType, entry.multi ? null : entry.value);
            });
            filterTags.appendChild(el);
        });

        filterInfo.style.display = filterTags.children.length > 0 ? 'flex' : 'none';
    }

    /**
     * 更新激活状态
     */
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

    /**
     * 绑定评价卡片事件
     */
    bindReviewEvents() {
        document.querySelectorAll('.review-genre, .review-tag').forEach(el => {
            el.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.filterByTag(el.getAttribute('data-tag'));
            });
        });

        // 卡片点击打开详情
        document.querySelectorAll('.review-item').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.closest('a')) return;
                if (e.target.closest('.review-genre, .review-tag')) return;
                this.openReviewDetail(card);
            });
        });
    }

    /**
     * 打开影评详情窗口
     */
    /**
     * 打开评价详情
     */
    openReviewDetail(card) {
        const overlay = document.getElementById('review-detail-overlay');
        const content = document.getElementById('review-detail-content');
        if (!overlay || !content) return;

        const link = card.dataset.id || '';
        const category = card.dataset.category || 'movie';
        const subjectMatch = link.match(/subject\/(\d+)/);
        const subjectId = subjectMatch ? subjectMatch[1] : '';

        // 从 allData 查找完整评论数据
        const items = this.getCategoryItems(category);
        const review = items.find(item => item.link === link);
        if (!review) return;

        let html = '';

        // === 豆瓣影片信息区域 ===
        html += '<div class="detail-review-section">';
        html += `<h2 class="detail-review-title">${review.title}</h2>`;

        // 豆瓣评分（信息区）
        if (review.doubanRating) {
            html += `<div class="detail-douban-rating">豆瓣评分: <strong>${review.doubanRating}</strong></div>`;
        }

        // 元数据（复用 createMetaHTML，支持所有分类）
        const metaHTML = this.createMetaHTML(review);
        if (metaHTML) {
            html += metaHTML;
        }

        // 类型标签（复用 createGenresHTML）
        const genresHTML = this.createGenresHTML(review);
        if (genresHTML) {
            html += genresHTML;
        }

        // 演员
        if (review.actors) {
            html += `<div class="detail-review-people"><span class="detail-people-label">主演:</span> ${review.actors}</div>`;
        }

        // 链接区域
        if (category === 'game') {
            // 游戏：显示 Steam 页面和/或豆瓣页面
            const isSteamLink = review.link && review.link.includes('steampowered.com');
            const isDoubanLink = review.link && review.link.includes('douban.com');
            const steamUrl = isSteamLink ? review.link : (review.appId ? `https://store.steampowered.com/app/${review.appId}/` : '');

            if (steamUrl) {
                html += `<a href="${steamUrl}" target="_blank" rel="noopener noreferrer" class="detail-review-link">🎮 Steam页面</a>`;
            }
            if (isDoubanLink) {
                html += `<a href="${review.link}" target="_blank" rel="noopener noreferrer" class="detail-review-link">📎 豆瓣页面</a>`;
            }
        } else {
            // 其他分类：显示豆瓣页面
            if (review.link) {
                html += `<a href="${review.link}" target="_blank" rel="noopener noreferrer" class="detail-review-link">📎 豆瓣页面</a>`;
            }
        }
        html += '</div>';

        // === 分割线 ===
        html += '<div class="detail-review-divider"></div>';

        // === 我的影评/评价模块 ===
        // showAllStamps=true：详情窗口所有评价都显示印章
        const contentHTML = this.createContentHTML(review, true);
        const hasRating = review.myRating !== null && review.myRating !== undefined;
        if (contentHTML || hasRating) {
            html += '<div class="detail-review-content-section">';
            const subtitleText = category === 'game' ? '我的评价' : '我的影评';
            html += `<h3 class="detail-review-subtitle">${subtitleText}</h3>`;

            // 我的评分（用 .review-rating 容器包裹，与评论卡片样式一致）
            if (hasRating) {
                html += `<div class="review-rating">${this.createRatingHTML(review.myRating)}</div>`;
            }

            // 评论内容（支持多次影评）
            if (contentHTML) {
                html += `<div class="detail-review-content-wrapper">${contentHTML}</div>`;
            }

            // 标签
            if (review.tags && review.tags.length) {
                html += `<div class="detail-review-tags">${review.tags.map(t => `<span class="review-tag">${t}</span>`).join('')}</div>`;
            }
            html += '</div>';
        }

        // === 分割线 + 观影记录区域 ===
        if (subjectId && this.ticketsData && this.ticketsData.length > 0) {
            const tickets = this.ticketsData.filter(t => t.subjectId === subjectId);
            if (tickets.length > 0) {
                html += '<div class="detail-review-divider"></div>';
                html += '<div class="detail-tickets-section">';
                html += `<h3 class="detail-tickets-title">观影记录（共${tickets.length}次）</h3>`;
                html += '<div class="detail-tickets-grid">';

                tickets.forEach((ticket, idx) => {
                    html += `<div class="detail-ticket-card" data-ticket-idx="${idx}">`;

                    // 票据图片（缩略图）
                    if (ticket.images && ticket.images.length > 0) {
                        html += '<div class="detail-ticket-thumb">';
                        html += `<img src="${ticket.images[0]}" alt="${ticket.title}" />`;
                        if (ticket.images.length > 1) {
                            html += `<span class="detail-ticket-img-count">${ticket.images.length}</span>`;
                        }
                        html += '</div>';
                    } else {
                        html += '<div class="detail-ticket-thumb detail-ticket-no-img"><span>🎬</span></div>';
                    }

                    // 票据信息（紧凑）
                    html += '<div class="detail-ticket-info">';
                    const dateStr = ticket.date ? ticket.date.substring(0, 10) : '';
                    if (dateStr) html += `<div class="detail-ticket-date">${dateStr}</div>`;
                    if (ticket.location) html += `<div class="detail-ticket-loc">${ticket.location}</div>`;
                    if (ticket.hall) html += `<div>🎬 ${ticket.hall}</div>`;
                    if (ticket.seat && ticket.seat.length) html += `<div>💺 ${ticket.seat.join(' / ')}</div>`;
                    const seatCount = (ticket.seat || []).length;
                    if (ticket.price) {
                        const priceStr = seatCount > 1 ? `¥${ticket.price}（共${seatCount}张）` : `¥${ticket.price}`;
                        html += `<div>💰 ${priceStr}</div>`;
                    }
                    html += '</div>';

                    html += '</div>';
                });

                html += '</div>';
                html += '</div>';
            }
        }

        content.innerHTML = html;
        content.classList.add('reviews-page');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // 绑定观影记录卡片点击（打开二层详情）
        content.querySelectorAll('.detail-ticket-card').forEach(card => {
            card.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(card.getAttribute('data-ticket-idx'), 10);
                const tickets = subjectId ? this.ticketsData.filter(t => t.subjectId === subjectId) : [];
                if (tickets[idx]) {
                    this.openTicketDetail(tickets[idx]);
                }
            });
        });
    }

    /**
     * 打开票据详情窗口（二层，在影评详情之上）
     */
    /**
     * 打开关联票据详情
     */
    openTicketDetail(ticket) {
        const overlay = document.getElementById('review-ticket-detail-overlay');
        const content = document.getElementById('review-ticket-detail-content');
        if (!overlay || !content) return;

        const title = ticket.title || '';
        const images = ticket.images || [];

        let html = '';

        // 图片区域（大图查看，支持多图切换）
        if (images.length > 0) {
            html += '<div class="detail-image-section">';
            html += '<div class="detail-image-wrapper">';
            html += '<div class="detail-image-track">';
            images.forEach((src) => {
                html += `<div class="detail-image-slide"><img src="${src}" alt="${title}" /></div>`;
            });
            html += '</div>';
            if (images.length > 1) {
                html += `<button class="detail-arrow detail-prev" aria-label="上一张">‹</button>`;
                html += `<button class="detail-arrow detail-next" aria-label="下一张">›</button>`;
                html += '<div class="detail-dots">';
                images.forEach((_, i) => {
                    html += `<span class="detail-dot${i === 0 ? ' active' : ''}"></span>`;
                });
                html += '</div>';
                html += `<span class="detail-image-count">1/${images.length}</span>`;
            }
            html += '</div>';
            html += '</div>';
        }

        // 信息区域
        html += '<div class="detail-info-section">';
        const dateStr = ticket.date ? ticket.date.substring(0, 16).replace('T', ' ') : '';
        if (dateStr) html += `<div class="detail-date">${dateStr}</div>`;
        html += `<h2 class="detail-title">${title}</h2>`;
        html += '<div class="detail-meta">';
        const seatCount = (ticket.seat || []).length;
        if (ticket.location) html += `<span class="detail-meta-item">${ticket.location}</span>`;
        if (ticket.hall) html += `<span class="detail-meta-item">🎬 ${ticket.hall}</span>`;
        if (ticket.seat && ticket.seat.length) html += `<span class="detail-meta-item">💺 ${ticket.seat.join(' / ')}</span>`;
        if (ticket.price) {
            const priceStr = seatCount > 1 ? `¥${ticket.price}（共${seatCount}张）` : `¥${ticket.price}`;
            html += `<span class="detail-meta-item">💰 ${priceStr}</span>`;
        }
        if (ticket.platform) html += `<span class="detail-meta-item">🎫 ${ticket.platform}</span>`;
        html += '</div>';
        html += '</div>';

        content.innerHTML = html;
        overlay.classList.add('active');

        // 绑定图片切换
        if (images.length > 1) {
            this.bindReviewDetailSlider(content, images.length);
        }
    }

    /**
     * 关闭票据详情窗口（二层）
     */
    /**
     * 关闭票据详情
     */
    closeTicketDetail() {
        const overlay = document.getElementById('review-ticket-detail-overlay');
        if (!overlay) return;
        overlay.classList.remove('active');
        const content = document.getElementById('review-ticket-detail-content');
        if (content) content.innerHTML = '';
    }

    /**
     * 绑定详情窗口内票据图片的多图切换
     */
    /**
     * 绑定详情图片轮播
     */
    bindReviewDetailSlider(wrapper, total) {
        const track = wrapper.querySelector('.detail-image-track');
        const dots = wrapper.querySelectorAll('.detail-dot');
        const prevBtn = wrapper.querySelector('.detail-prev');
        const nextBtn = wrapper.querySelector('.detail-next');
        const countLabel = wrapper.querySelector('.detail-image-count');
        let currentIndex = 0;

        const showSlide = (index) => {
            currentIndex = (index + total) % total;
            if (track) track.style.transform = `translateX(-${currentIndex * 100}%)`;
            dots.forEach((dot, i) => dot.classList.toggle('active', i === currentIndex));
            if (countLabel) countLabel.textContent = `${currentIndex + 1}/${total}`;
        };

        if (prevBtn) prevBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showSlide(currentIndex - 1);
        });
        if (nextBtn) nextBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showSlide(currentIndex + 1);
        });

        // 触摸滑动
        let startX = 0;
        let isDragging = false;
        if (track) {
            track.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                isDragging = true;
            }, { passive: true });
            track.addEventListener('touchend', (e) => {
                if (!isDragging) return;
                isDragging = false;
                const endX = e.changedTouches[0].clientX;
                const diff = startX - endX;
                if (Math.abs(diff) > 30) {
                    if (diff > 0) showSlide(currentIndex + 1);
                    else showSlide(currentIndex - 1);
                }
            }, { passive: true });
        }
    }

    /**
     * 关闭影评详情窗口
     */
    /**
     * 关闭评价详情
     */
    closeReviewDetail() {
        const overlay = document.getElementById('review-detail-overlay');
        if (!overlay) return;
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        const content = document.getElementById('review-detail-content');
        if (content) {
            content.innerHTML = '';
            content.classList.remove('reviews-page');
        }
    }

    /**
     * 绑定详情窗口关闭事件（全局，只绑定一次）
     * 一层和二层窗口都绑定，二层打开时阻止一层关闭
     */
    /**
     * 绑定详情关闭事件
     */
    bindReviewDetailClose() {
        if (this._reviewDetailCloseBound) return;
        this._reviewDetailCloseBound = true;

        const overlay1 = document.getElementById('review-detail-overlay');
        const closeBtn1 = document.getElementById('review-detail-close');
        const overlay2 = document.getElementById('review-ticket-detail-overlay');
        const closeBtn2 = document.getElementById('review-ticket-detail-close');

        // 二层窗口是否打开
        const isLayer2Active = () => overlay2?.classList.contains('active');

        // 一层关闭事件（二层打开时不关闭一层）
        if (closeBtn1) {
            closeBtn1.addEventListener('click', () => {
                if (isLayer2Active()) return;
                this.closeReviewDetail();
            });
        }
        if (overlay1) {
            overlay1.addEventListener('click', (e) => {
                if (e.target === overlay1) {
                    if (isLayer2Active()) return;
                    this.closeReviewDetail();
                }
            });
        }

        // 二层关闭事件
        if (closeBtn2) {
            closeBtn2.addEventListener('click', () => this.closeTicketDetail());
        }
        if (overlay2) {
            overlay2.addEventListener('click', (e) => {
                if (e.target === overlay2) this.closeTicketDetail();
            });
        }

        // ESC 键：二层打开时关闭二层，否则关闭一层
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (isLayer2Active()) {
                    this.closeTicketDetail();
                } else if (overlay1?.classList.contains('active')) {
                    this.closeReviewDetail();
                }
            }
        });
    }

}



document.addEventListener('DOMContentLoaded', () => {
    new ReviewsManager();
});
