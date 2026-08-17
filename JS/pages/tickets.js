/**
 * 票据收藏页面脚本
 * 对应页面: tickets.html
 * 功能: 展示票据收藏(电影票/演出票等),支持类型/地点/场馆筛选、详情弹窗、统计汇总。
 */

class TicketsManager extends FilterableListManager {
    /** 构造函数: 初始化管理器 */
    constructor() {
        super();
        this.allTickets = [];
        this.currentType = '';
        this.masonryDestroys = [];
        this.currentLocation = null;
        this.currentHall = null;
        this.currentSeat = null;
        this.init();
    }

    /**
     * 初始化: 加载数据 + 渲染
     */
    async init() {
        try {
            await this.loadData();
            this.bindTypeTabs();
            this.bindSearch();
            this.bindClearFilter();
            this.bindAdvancedFilters();
            this.bindDetailClose();
            this.checkUrlParams();
            initBackToTopButton();
        } catch (error) {
            console.error('加载票据数据失败:', error);
            document.getElementById('tickets-list').innerHTML = '<div class="error">加载票据数据失败</div>';
        }
    }

    /**
     * 从 URL 参数恢复筛选状态
     */
    checkUrlParams() {
        const urlParams = getUrlParams();
        const search = urlParams.get('search') || '';
        const type = urlParams.get('type') || '';
        const location = urlParams.get('location') || null;
        const hall = urlParams.get('hall') || null;
        const seat = urlParams.get('seat') || null;

        // 恢复搜索框值（直接赋值不会触发 input 事件）
        if (search) {
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.value = search;
        }

        // 恢复类型筛选状态
        if (type) {
            this.currentType = type;
            document.querySelectorAll('.type-tab').forEach(tab => {
                tab.classList.toggle('active', tab.getAttribute('data-type') === type);
            });
        }

        this.currentLocation = location;
        this.currentHall = hall;
        this.currentSeat = seat;

        this.renderLocationFilter();
        this.renderHallFilter();
        this.renderSeatFilter();
        this.applyFilters();
    }

    /**
     * 移除筛选条件
     */
    removeFilter(paramType, value = null) {
        if (paramType === 'search') {
            const searchInput = document.getElementById('search-input');
            if (searchInput) searchInput.value = '';
        } else if (paramType === 'type') {
            this.currentType = '';
            document.querySelectorAll('.type-tab').forEach(tab => {
                tab.classList.toggle('active', !tab.getAttribute('data-type'));
            });
        } else if (paramType === 'location') {
            this.currentLocation = null;
            this.currentHall = null;
            this.currentSeat = null;
        } else if (paramType === 'hall') {
            this.currentHall = null;
            this.currentSeat = null;
        } else if (paramType === 'seat') {
            this.currentSeat = null;
        }
        this.renderLocationFilter();
        this.renderHallFilter();
        this.renderSeatFilter();
        super.removeFilter(paramType, value);
    }

    /**
     * 清除所有筛选
     */
    clearFilter() {
        this.currentType = '';
        this.currentLocation = null;
        this.currentHall = null;
        this.currentSeat = null;
        // 重置类型标签UI
        document.querySelectorAll('.type-tab').forEach(tab => {
            tab.classList.toggle('active', !tab.getAttribute('data-type'));
        });
        this.renderLocationFilter();
        this.renderHallFilter();
        this.renderSeatFilter();
        super.clearFilter();
    }

    getClearFilterParams() {
        return ['type', 'search', 'location', 'hall', 'seat'];
    }

    getSearchClearParams() {
        return ['type', 'location', 'hall', 'seat'];
    }

    /**
     * 搜索票据
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
        // 重置JS状态
        this.currentType = '';
        this.currentLocation = null;
        this.currentHall = null;
        this.currentSeat = null;
        document.querySelectorAll('.type-tab').forEach(tab => {
            tab.classList.toggle('active', !tab.getAttribute('data-type'));
        });
        this.renderLocationFilter();
        this.renderHallFilter();
        this.renderSeatFilter();
        this.applyFilters();
    }

    /**
     * 加载票据数据
     */
    async loadData() {
        const data = await fetchJSON('JSON/tickets.json', []);
        const imageMap = await fetchJSON('JSON/ticket-images.json', {});
        this._imageMap = imageMap;

        // 根据 日期_标题 自动匹配图片
        data.forEach(ticket => {
            const date = ticket.date || '';
            const date8 = date.substring(0, 10).replace(/-/g, '') || '';
            const title = ticket.title || '';
            const key = `${date8}_${title}`;
            ticket.images = imageMap[key] || [];
        });

        this.allTickets = data;
        document.getElementById('stat-total').textContent = data.length;
    }

    /** 更新高级筛选的 URL 参数 */
    updateAdvancedFilterUrl() {
        const urlParams = getUrlParams();
        if (this.currentLocation) urlParams.set('location', this.currentLocation);
        else urlParams.delete('location');
        if (this.currentHall) urlParams.set('hall', this.currentHall);
        else urlParams.delete('hall');
        if (this.currentSeat) urlParams.set('seat', this.currentSeat);
        else urlParams.delete('seat');
        setUrlParams(urlParams);
    }

    /**
     * 绑定类型标签页
     */
    bindTypeTabs() {
        document.querySelectorAll('.type-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.currentType = tab.getAttribute('data-type') || '';
                document.querySelectorAll('.type-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                // 更新 URL 中的 type 参数
                const urlParams = getUrlParams();
                if (this.currentType) urlParams.set('type', this.currentType);
                else urlParams.delete('type');
                setUrlParams(urlParams);
                // 重置高级筛选
                this.currentLocation = null;
                this.currentHall = null;
                this.currentSeat = null;
                this.updateAdvancedFilterUrl();
                this.renderLocationFilter();
                this.renderHallFilter();
                this.renderSeatFilter();
                this.applyFilters();
            });
        });
    }

    /**
     * 应用筛选条件
     */
    applyFilters() {
        const urlParams = getUrlParams();
        const search = urlParams.get('search') || '';

        let filtered = this.allTickets;

        if (this.currentType) {
            filtered = filtered.filter(t => t.type === this.currentType);
        }

        if (search) {
            const term = search.toLowerCase();
            filtered = filtered.filter(t =>
                (t.title || '').toLowerCase().includes(term) ||
                (t.location || '').toLowerCase().includes(term)
            );
        }

        // 高级筛选：影院
        if (this.currentLocation) {
            filtered = filtered.filter(t => t.location === this.currentLocation);
        }

        // 高级筛选：影厅
        if (this.currentHall) {
            filtered = filtered.filter(t => t.hall === this.currentHall);
        }

        // 高级筛选：座位
        if (this.currentSeat) {
            filtered = filtered.filter(t => (t.seat || []).some(s => s === this.currentSeat));
        }

        document.getElementById('stat-current').textContent = filtered.length;
        document.getElementById('stat-amount').textContent = this.formatAmountWithAvg(filtered) || '-';
        this.renderList(filtered);

        const filterEntries = [];
        if (this.currentType) {
            const typeLabels = {
                'movie': '电影', 'show': '演出', 'train': '火车',
                'flight': '飞机', 'attraction': '门票', 'other': '其他'
            };
            filterEntries.push({
                type: '类型', value: typeLabels[this.currentType] || this.currentType,
                paramType: 'type'
            });
        }
        if (search) {
            filterEntries.push({ type: '搜索', value: search, paramType: 'search' });
        }
        if (this.currentLocation) {
            filterEntries.push({ type: '影院', value: this.currentLocation, paramType: 'location' });
        }
        if (this.currentHall) {
            filterEntries.push({ type: '影厅', value: this.currentHall, paramType: 'hall' });
        }
        if (this.currentSeat) {
            filterEntries.push({ type: '座位', value: this.currentSeat, paramType: 'seat' });
        }
        this.updateFilterInfo(filterEntries);
    }

    /**
     * 绑定高级筛选
     */
    bindAdvancedFilters() {
        // 展开/收起
        const toggle = document.getElementById('advanced-filter-toggle');
        const options = document.getElementById('advanced-filter-options');
        if (toggle && options) {
            toggle.addEventListener('click', () => {
                options.classList.toggle('collapsed');
            });
        }

        this.renderLocationFilter();
        this.renderHallFilter();
        this.renderSeatFilter();
    }

    /** 获取当前筛选后的数据（用于生成选项，不含高级筛选本身的条件） */
    getFilteredTickets() {
        let items = this.allTickets;
        if (this.currentType) {
            items = items.filter(t => t.type === this.currentType);
        }
        if (this.currentLocation) {
            items = items.filter(t => t.location === this.currentLocation);
        }
        return items;
    }

    /** 获取仅按类型筛选的数据（用于生成影院选项，保留所有影院） */
    getTicketsByType() {
        let items = this.allTickets;
        if (this.currentType) {
            items = items.filter(t => t.type === this.currentType);
        }
        return items;
    }

    /** 获取按类型+影院+影厅筛选的数据（用于生成座位选项） */
    getTicketsByHall() {
        let items = this.allTickets;
        if (this.currentType) {
            items = items.filter(t => t.type === this.currentType);
        }
        if (this.currentLocation) {
            items = items.filter(t => t.location === this.currentLocation);
        }
        if (this.currentHall) {
            items = items.filter(t => t.hall === this.currentHall);
        }
        return items;
    }

    /** 渲染影院筛选按钮 */
    renderLocationFilter() {
        const container = document.getElementById('location-filter');
        if (!container) return;

        const items = this.getTicketsByType();
        const locationCount = {};
        items.forEach(t => {
            if (t.location) {
                locationCount[t.location] = (locationCount[t.location] || 0) + 1;
            }
        });

        const locations = Object.keys(locationCount).sort((a, b) => locationCount[b] - locationCount[a]);
        if (locations.length === 0) {
            container.parentElement.style.display = 'none';
            return;
        }
        container.parentElement.style.display = '';

        container.innerHTML = '';
        this.createFilterBtn(container, '', '全部', !this.currentLocation);
        locations.forEach(loc => {
            this.createFilterBtn(container, loc, `${loc} (${locationCount[loc]})`, this.currentLocation === loc);
        });

        this.bindAdvancedFilterEvents();
    }

    /** 渲染影厅筛选按钮（仅在选取影院后显示） */
    renderHallFilter() {
        const container = document.getElementById('hall-filter');
        if (!container) return;

        // 未选影院时隐藏
        if (!this.currentLocation) {
            container.parentElement.style.display = 'none';
            return;
        }

        const items = this.getFilteredTickets();
        const hallCount = {};
        items.forEach(t => {
            if (t.hall) {
                hallCount[t.hall] = (hallCount[t.hall] || 0) + 1;
            }
        });

        const halls = Object.keys(hallCount).sort((a, b) => hallCount[b] - hallCount[a]);
        if (halls.length === 0) {
            container.parentElement.style.display = 'none';
            return;
        }
        container.parentElement.style.display = '';

        container.innerHTML = '';
        this.createFilterBtn(container, '', '全部', !this.currentHall);
        halls.forEach(hall => {
            this.createFilterBtn(container, hall, `${hall} (${hallCount[hall]})`, this.currentHall === hall);
        });

        this.bindAdvancedFilterEvents();
    }

    /** 渲染座位筛选按钮（仅在选取影厅后显示） */
    renderSeatFilter() {
        const container = document.getElementById('seat-filter');
        if (!container) return;

        // 未选影厅时隐藏
        if (!this.currentHall) {
            container.parentElement.style.display = 'none';
            return;
        }

        const items = this.getTicketsByHall();
        let seatCount = {};
        items.forEach(t => {
            (t.seat || []).forEach(s => {
                seatCount[s] = (seatCount[s] || 0) + 1;
            });
        });

        const seats = Object.keys(seatCount).sort((a, b) => seatCount[b] - seatCount[a]);
        if (seats.length === 0) {
            container.parentElement.style.display = 'none';
            return;
        }
        container.parentElement.style.display = '';

        container.innerHTML = '';
        this.createFilterBtn(container, '', '全部', !this.currentSeat);
        seats.forEach(seat => {
            this.createFilterBtn(container, seat, `${seat} (${seatCount[seat]})`, this.currentSeat === seat);
        });

        this.bindAdvancedFilterEvents();
    }

    /** 创建筛选按钮（使用 DOM API 避免 XSS） */
    createFilterBtn(container, value, label, active) {
        const btn = document.createElement('button');
        btn.className = 'filter-btn' + (active ? ' active' : '');
        btn.dataset.value = value;
        btn.textContent = label;
        container.appendChild(btn);
    }

    /** 绑定高级筛选事件（每次渲染后重新绑定） */
    bindAdvancedFilterEvents() {
        // 影院筛选
        const locationFilter = document.getElementById('location-filter');
        if (locationFilter) {
            locationFilter.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const value = btn.getAttribute('data-value');
                    this.currentLocation = value || null;
                    this.currentHall = null;
                    this.currentSeat = null;
                    this.updateAdvancedFilterUrl();
                    this.renderLocationFilter();
                    this.renderHallFilter();
                    this.renderSeatFilter();
                    this.applyFilters();
                });
            });
        }

        // 影厅筛选
        const hallFilter = document.getElementById('hall-filter');
        if (hallFilter) {
            hallFilter.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const value = btn.getAttribute('data-value');
                    this.currentHall = value || null;
                    this.currentSeat = null;
                    this.updateAdvancedFilterUrl();
                    this.renderHallFilter();
                    this.renderSeatFilter();
                    this.applyFilters();
                });
            });
        }

        // 座位筛选
        const seatFilter = document.getElementById('seat-filter');
        if (seatFilter) {
            seatFilter.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const value = btn.getAttribute('data-value');
                    this.currentSeat = value || null;
                    this.updateAdvancedFilterUrl();
                    this.renderSeatFilter();
                    this.applyFilters();
                });
            });
        }
    }

    /**
     * 格式化价格
     */
    formatPrice(price) {
        if (price === null || price === undefined) return '';
        const num = typeof price === 'number' ? price : parseFloat(price);
        if (isNaN(num)) return '';
        return '¥' + (num % 1 === 0 ? num : num.toFixed(1));
    }

    /**
     * 计算总价
     */
    calcTotal(items) {
        return items.reduce((sum, t) => {
            const p = t.price;
            return sum + (p !== null && p !== undefined && !isNaN(p) ? parseFloat(p) : 0);
        }, 0);
    }

    /**
     * 计算总座位数
     */
    calcTotalSeats(items) {
        return items.reduce((sum, t) => sum + (t.seat || []).length, 0);
    }

    /** 格式化均价：精确到百分位，但不强制显示小数点后两位 */
    formatAvgPrice(num) {
        if (isNaN(num)) return '';
        if (num % 1 === 0) return num.toString();
        return parseFloat(num.toFixed(2)).toString();
    }

    /** 格式化总金额，多张票时附带平均每张票价 */
    formatAmountWithAvg(items) {
        const total = this.calcTotal(items);
        if (total <= 0) return null;
        const seats = this.calcTotalSeats(items);
        if (seats > 1) {
            const avg = this.formatAvgPrice(total / seats);
            return `${this.formatPrice(total)}（共${seats}张，均¥${avg}/张）`;
        }
        return this.formatPrice(total);
    }

    /**
     * 渲染票据列表
     */
    renderList(items) {
        const container = document.getElementById('tickets-list');

        // 销毁之前的 masonry 实例
        this.masonryDestroys.forEach(d => { if (d) d(); });
        this.masonryDestroys = [];

        if (items.length === 0) {
            container.innerHTML = '<div class="no-tickets">没有找到相关票据</div>';
            return;
        }

        // 按年→月分组
        const yearGroups = {};
        items.forEach(ticket => {
            const date = ticket.date || '';
            const year = date.substring(0, 4) || '未知';
            const month = date.substring(5, 7) || '??';
            if (!yearGroups[year]) yearGroups[year] = {};
            if (!yearGroups[year][month]) yearGroups[year][month] = [];
            yearGroups[year][month].push(ticket);
        });

        const years = Object.keys(yearGroups).sort((a, b) => b.localeCompare(a));

        let html = '<div class="tickets-timeline">';
        years.forEach(year => {
            const yearItems = Object.values(yearGroups[year]).flat();
            const yearTotal = this.formatAmountWithAvg(yearItems);
            const yearCount = yearItems.length;

            html += `<div class="timeline-year">`;
            html += `<div class="timeline-year-label">`;
            html += `<span class="timeline-year-text">${year}</span>`;
            html += `<span class="timeline-year-count">${yearCount}条</span>`;
            if (yearTotal) {
                html += `<span class="timeline-amount">${yearTotal}</span>`;
            }
            html += `</div>`;

            const months = Object.keys(yearGroups[year]).sort((a, b) => b.localeCompare(a));
            months.forEach(month => {
                const monthItems = yearGroups[year][month];
                const monthTotal = this.formatAmountWithAvg(monthItems);
                const monthNum = parseInt(month, 10);
                const monthLabel = isNaN(monthNum) ? month : `${year}年${monthNum}月`;
                const needMonthGroup = months.length > 1 || monthItems.length >= 3;

                if (needMonthGroup) {
                    html += `<div class="timeline-month">`;
                    html += `<div class="timeline-month-label">`;
                    html += `<span class="timeline-month-text">${monthLabel}</span>`;
                    html += `<span class="timeline-month-count">${monthItems.length}条</span>`;
                    if (monthTotal) {
                        html += `<span class="timeline-month-amount">${monthTotal}</span>`;
                    }
                    html += `</div>`;
                }

                const containerId = `masonry-${year}-${month}`;
                html += `<div class="timeline-masonry" id="${containerId}"></div>`;

                if (needMonthGroup) {
                    html += `</div>`;
                }
            });

            html += `</div>`;
        });
        html += '</div>';

        container.innerHTML = html;

        // 为每个分组创建瀑布流
        years.forEach(year => {
            const months = Object.keys(yearGroups[year]).sort((a, b) => b.localeCompare(a));
            months.forEach(month => {
                const masonryContainer = document.getElementById(`masonry-${year}-${month}`);
                if (!masonryContainer) return;
                const elements = yearGroups[year][month].map(ticket => this.createTicketElement(ticket));

                const destroy = MasonryLayout({
                    container: masonryContainer,
                    items: elements,
                    columnMinWidth: 300,
                    columnGap: 20,
                    watchImages: true
                });

                this.masonryDestroys.push(destroy);
            });
        });

        this.bindTicketEvents();
    }

    /**
     * 创建票据卡片元素
     */
    createTicketElement(ticket) {
        const article = document.createElement('article');
        article.className = 'ticket-card';

        const dateStr = ticket.date ? ticket.date.substring(0, 10) : '';
        const seatStr = ticket.seat && ticket.seat.length > 0 ? ticket.seat.join(', ') : '';
        const priceStr = this.formatPrice(ticket.price);
        const images = ticket.images || [];

        // 图片区域
        const imageWrapper = document.createElement('div');
        imageWrapper.className = 'ticket-image-wrapper';

        if (images.length > 0) {
            const slider = document.createElement('div');
            slider.className = 'ticket-image-slider';

            const track = document.createElement('div');
            track.className = 'ticket-image-track';

            images.forEach(src => {
                const slide = document.createElement('div');
                slide.className = 'ticket-image-slide';
                const img = document.createElement('img');
                img.src = src;
                img.alt = ticket.title;
                img.loading = 'lazy';
                slide.appendChild(img);
                track.appendChild(slide);
            });

            slider.appendChild(track);
            imageWrapper.appendChild(slider);

            // 多图时添加箭头和指示器
            if (images.length > 1) {
                const prevBtn = document.createElement('button');
                prevBtn.className = 'slider-arrow slider-prev';
                prevBtn.innerHTML = '‹';
                prevBtn.setAttribute('aria-label', '上一张');
                imageWrapper.appendChild(prevBtn);

                const nextBtn = document.createElement('button');
                nextBtn.className = 'slider-arrow slider-next';
                nextBtn.innerHTML = '›';
                nextBtn.setAttribute('aria-label', '下一张');
                imageWrapper.appendChild(nextBtn);

                const dots = document.createElement('div');
                dots.className = 'slider-dots';
                images.forEach((_, i) => {
                    const dot = document.createElement('span');
                    dot.className = 'slider-dot' + (i === 0 ? ' active' : '');
                    dots.appendChild(dot);
                });
                imageWrapper.appendChild(dots);

                // 多图计数
                const count = document.createElement('span');
                count.className = 'ticket-image-count';
                count.textContent = `1/${images.length}`;
                imageWrapper.appendChild(count);
            }
        } else {
            const placeholder = document.createElement('div');
            placeholder.className = 'ticket-no-image-placeholder';
            placeholder.textContent = '🎫';
            imageWrapper.appendChild(placeholder);
        }

        // 日期标签
        const dateBadge = document.createElement('span');
        dateBadge.className = 'ticket-date-badge';
        dateBadge.textContent = dateStr;
        imageWrapper.appendChild(dateBadge);

        article.appendChild(imageWrapper);

        // 信息区域
        const body = document.createElement('div');
        body.className = 'ticket-card-body';

        const title = document.createElement('h3');
        title.className = 'ticket-card-title';
        title.textContent = ticket.title;
        body.appendChild(title);

        // 元数据（分行显示，带 emoji 前缀，日期和影院不加 emoji）
        const metaLines = [];
        if (ticket.location) metaLines.push(ticket.location);
        if (ticket.hall) metaLines.push(`🎬 ${ticket.hall}`);
        if (seatStr) metaLines.push(`💺 ${seatStr}`);
        if (priceStr) {
            const seatCount = (ticket.seat || []).length;
            if (seatCount > 1 && ticket.price) {
                const perPrice = this.formatAvgPrice(ticket.price / seatCount);
                metaLines.push(`💰 共${seatCount}张 ${priceStr}（¥${perPrice}/张）`);
            } else {
                metaLines.push(`💰 ${priceStr}`);
            }
        }
        if (ticket.platform) metaLines.push(`🎫 ${ticket.platform}`);

        if (metaLines.length > 0) {
            const meta = document.createElement('div');
            meta.className = 'ticket-card-meta';
            meta.innerHTML = metaLines.map(line => `<div>${line}</div>`).join('');
            body.appendChild(meta);
        }

        article.appendChild(body);

        return article;
    }

    /**
     * 绑定票据事件
     */
    bindTicketEvents() {
        // 卡片点击 → 打开详情查看
        document.querySelectorAll('.ticket-card').forEach(card => {
            card.addEventListener('click', (e) => {
                // 点击箭头/指示器不触发详情
                if (e.target.closest('.slider-arrow')) return;
                this.openDetail(card);
            });
        });

        // 多图滑动
        document.querySelectorAll('.ticket-image-wrapper').forEach(wrapper => {
            const track = wrapper.querySelector('.ticket-image-track');
            if (!track) return;

            const slides = track.querySelectorAll('.ticket-image-slide');
            const dots = wrapper.querySelectorAll('.slider-dot');
            const prevBtn = wrapper.querySelector('.slider-prev');
            const nextBtn = wrapper.querySelector('.slider-next');
            const countLabel = wrapper.querySelector('.ticket-image-count');
            const total = slides.length;

            if (total <= 1) return;

            let currentIndex = 0;

            const showSlide = (index) => {
                currentIndex = (index + total) % total;
                track.style.transform = `translateX(-${currentIndex * 100}%)`;
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
        });
    }

    // ========== 详情查看 ==========

    /**
     * 打开票据详情查看窗口
     * @param {HTMLElement} card - 被点击的票据卡片元素
     */
    /**
     * 打开票据详情
     */
    openDetail(card) {
        const overlay = document.getElementById('ticket-detail-overlay');
        const content = document.getElementById('ticket-detail-content');
        if (!overlay || !content) return;

        // 从卡片提取数据
        const title = card.querySelector('.ticket-card-title')?.textContent || '';
        const metaLines = Array.from(card.querySelectorAll('.ticket-card-meta > div')).map(div => div.innerHTML);
        const dateBadge = card.querySelector('.ticket-date-badge')?.textContent || '';
        const images = Array.from(card.querySelectorAll('.ticket-image-slide img')).map(img => img.src);

        // 构建详情HTML
        let html = '';

        // 图片区域（大图查看，支持多图切换）
        if (images.length > 0) {
            html += `<div class="detail-image-section">`;
            html += `<div class="detail-image-wrapper">`;
            html += `<div class="detail-image-track" style="transform: translateX(0)">`;
            images.forEach((src, i) => {
                html += `<div class="detail-image-slide"><img src="${src}" alt="${title}" /></div>`;
            });
            html += `</div>`;

            if (images.length > 1) {
                html += `<button class="detail-arrow detail-prev" aria-label="上一张">‹</button>`;
                html += `<button class="detail-arrow detail-next" aria-label="下一张">›</button>`;
                html += `<div class="detail-dots">`;
                images.forEach((_, i) => {
                    html += `<span class="detail-dot${i === 0 ? ' active' : ''}"></span>`;
                });
                html += `</div>`;
                html += `<span class="detail-image-count">1/${images.length}</span>`;
            }
            html += `</div>`;
            html += `</div>`;
        }

        // 信息区域
        html += `<div class="detail-info-section">`;
        if (dateBadge) {
            html += `<div class="detail-date">${dateBadge}</div>`;
        }
        html += `<h2 class="detail-title">${title}</h2>`;
        if (metaLines.length > 0) {
            html += `<div class="detail-meta">`;
            metaLines.forEach(line => {
                html += `<span class="detail-meta-item">${line}</span>`;
            });
            html += `</div>`;
        }
        html += `</div>`;

        content.innerHTML = html;
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';

        // 绑定详情窗口内的图片切换
        if (images.length > 1) {
            this.bindDetailSlider(content, images.length);
        }
    }

    /**
     * 绑定详情窗口内的多图切换
     */
    /**
     * 绑定详情图片轮播
     */
    bindDetailSlider(content, total) {
        const track = content.querySelector('.detail-image-track');
        const dots = content.querySelectorAll('.detail-dot');
        const prevBtn = content.querySelector('.detail-prev');
        const nextBtn = content.querySelector('.detail-next');
        const countLabel = content.querySelector('.detail-image-count');
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
     * 关闭详情查看窗口
     */
    /**
     * 关闭详情
     */
    closeDetail() {
        const overlay = document.getElementById('ticket-detail-overlay');
        if (!overlay) return;
        overlay.classList.remove('active');
        document.body.style.overflow = '';
        // 清空内容（停止图片加载）
        const content = document.getElementById('ticket-detail-content');
        if (content) content.innerHTML = '';
    }

    /**
     * 绑定详情窗口的关闭事件（全局，只绑定一次）
     */
    /**
     * 绑定详情关闭
     */
    bindDetailClose() {
        if (this._detailCloseBound) return;
        this._detailCloseBound = true;

        const overlay = document.getElementById('ticket-detail-overlay');
        const closeBtn = document.getElementById('ticket-detail-close');

        // 点击叉号关闭
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.closeDetail());
        }

        // 点击遮罩层空白处关闭
        if (overlay) {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) this.closeDetail();
            });
        }

        // ESC 键关闭
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && overlay?.classList.contains('active')) {
                this.closeDetail();
            }
        });
    }
}

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    new TicketsManager();
});
