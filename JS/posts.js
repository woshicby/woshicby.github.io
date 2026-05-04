// 博文数据管理和渲染
class PostManager {
    constructor() {
        this.posts = [];
        this.categories = [];
        this.tags = [];
        this.seriesMeta = [];
        this.currentPage = 0;
        this.postsPerPage = 5;
        this.filteredPosts = null;
        this.isLoading = false;
        this.init();
    }

    async init() {
        try {
            console.log('开始初始化博文管理器');
            await this.loadPosts();
            console.log('成功加载数据，文章总数:', this.posts.length);
            this.extractCategoriesAndTags();
            console.log('提取分类:', this.categories.length, '个，标签:', this.tags.length, '个');
            this.renderPostsList();
            console.log('文章列表渲染完成');
            this.renderCategories();
            this.renderSeries();
            this.renderTimeline();
            this.renderTags();
            this.bindSearch();
            this.bindClearFilter();
            this.bindScrollLoad();
            this.createBackToTopButton();
            this.checkUrlParams();
        } catch (error) {
            console.error('加载博文数据失败:', error);
            document.getElementById('posts-list').innerHTML = '<div class="error">加载博文失败</div>';
        }
    }

    async loadPosts() {
        try {
            // 首先尝试从 posts-list.json 加载文件列表
            const listResponse = await fetch('JSON/posts-list.json');
            
            if (listResponse.ok) {
                const postsList = await listResponse.json();
                console.log('成功加载posts-list.json，文件数量:', postsList.length);
                
                // 逐个读取 md 文件并解析
                const postsPromises = postsList.map(async (postInfo) => {
                    try {
                        console.log(`正在加载文件: ${postInfo.file}`);
                        const mdResponse = await fetch(`posts/${postInfo.file}`);
                        if (mdResponse.ok) {
                            const mdContent = await mdResponse.text();
                            console.log(`文件 ${postInfo.file} 内容长度: ${mdContent.length}`);
                            const parsedPost = this.parseMarkdown(mdContent);
                            console.log(`文件 ${postInfo.file} 解析结果:`, parsedPost);
                            parsedPost.id = postInfo.id;
                            return parsedPost;
                        } else {
                            console.error(`文件 ${postInfo.file} 加载失败，状态码: ${mdResponse.status}`);
                        }
                    } catch (error) {
                        console.error(`加载文件 ${postInfo.file} 失败:`, error);
                        return null;
                    }
                });
                
                this.posts = (await Promise.all(postsPromises)).filter(post => post !== null);
                console.log('成功加载所有md文件，文章数量:', this.posts.length);
                console.log('文章列表预览:', this.posts.map(p => p.title));
            } else {
                // 如果没有 posts-list.json，尝试从 posts.json 加载
                console.log('posts-list.json 不存在，尝试从 posts.json 加载');
                const response = await fetch('JSON/posts.json');
                if (response.ok) {
                    this.posts = await response.json();
                    console.log('成功加载posts.json，文章数量:', this.posts.length);
                } else {
                    console.warn('posts.json 也不存在，使用示例数据');
                    this.posts = this.getSamplePosts();
                }
            }

            const seriesResponse = await fetch('JSON/posts-series.json');
            if (seriesResponse.ok) {
                this.seriesMeta = await seriesResponse.json();
                console.log('成功加载posts-series.json，系列数量:', this.seriesMeta.length);
            } else {
                console.warn('posts-series.json加载失败，使用空数组');
                this.seriesMeta = [];
            }
        } catch (error) {
            console.error('加载博文数据失败:', error.message);
            console.warn('将使用示例博文数据');
            this.posts = this.getSamplePosts();
        }
    }

    parseMarkdown(content) {
        const frontmatterRegex = /^---\s*([\s\S]*?)\s*---\s*([\s\S]*)$/;
        const match = content.match(frontmatterRegex);
        
        if (!match) {
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
            update_date: metadata.update_date || null,
            content: markdownContent,
            excerpt: metadata.excerpt || this.extractExcerpt(markdownContent),
            categories: metadata.categories || [],
            tags: metadata.tags || [],
            series: metadata.series || null,
            series_order: metadata.series_order || null
        };
    }

    parseFrontmatter(frontmatter) {
        const metadata = {};
        const lines = frontmatter.split('\n');
        
        lines.forEach(line => {
            line = line.trim();
            if (!line || line.startsWith('#')) return;
            const [key, ...valueParts] = line.split(':');
            const cleanKey = key.trim();
            let cleanValue = valueParts.join(':').trim();
            
            if (cleanValue.startsWith('[') && cleanValue.endsWith(']')) {
                cleanValue = cleanValue.substring(1, cleanValue.length - 1)
                    .split(',')
                    .map(item => item.trim().replace(/^['"']|['"']$/g, ''));
            } else if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) || 
                       (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
                cleanValue = cleanValue.substring(1, cleanValue.length - 1);
            }
            
            metadata[cleanKey] = cleanValue;
        });
        
        return metadata;
    }

    extractExcerpt(content) {
        const plainText = content
            .replace(/#{1,6}\s+/g, '')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/`(.*?)`/g, '$1')
            .replace(/```[\s\S]*?```/g, '[代码块]')
            .replace(/!?\[([^\]]+)\]\([^)]+\)/g, '$1')
            .replace(/^>\s+/gm, '')
            .trim();
        
        return plainText.length > 200 ? plainText.substring(0, 200) + '...' : plainText;
    }

    extractCategoriesAndTags() {
        const categorySet = new Set();
        const tagSet = new Set();

        this.posts.forEach(post => {
            if (post.categories) {
                post.categories.forEach(category => categorySet.add(category));
            }
            if (post.tags) {
                post.tags.forEach(tag => tagSet.add(tag));
            }
        });

        this.categories = Array.from(categorySet).sort();
        this.tags = Array.from(tagSet).sort();

        this.seriesCount = {};
        this.posts.forEach(post => {
            if (post.series) {
                this.seriesCount[post.series] = (this.seriesCount[post.series] || 0) + 1;
            }
        });
    }

    renderPostsList(filteredPosts = null, append = false) {
        if (filteredPosts !== null) {
            this.filteredPosts = filteredPosts;
            this.currentPage = 0;
        }

        const postsToRender = this.filteredPosts || this.posts;
        const postsListElement = document.getElementById('posts-list');

        if (postsToRender.length === 0) {
            postsListElement.innerHTML = '<div class="no-posts">没有找到相关博文</div>';
            this.removeLoadMoreSentinel();
            return;
        }

        const startIndex = append ? this.currentPage * this.postsPerPage : 0;
        const endIndex = Math.min(startIndex + this.postsPerPage, postsToRender.length);

        if (!append) {
            postsListElement.innerHTML = '';
        }

        const postsToAppend = postsToRender.slice(startIndex, endIndex);
        const postsHTML = postsToAppend.map(post => this.createPostHTML(post)).join('');

        if (append) {
            postsListElement.insertAdjacentHTML('beforeend', postsHTML);
        } else {
            postsListElement.innerHTML = postsHTML;
        }

        this.currentPage = Math.ceil(endIndex / this.postsPerPage);
        this.updateLoadMoreSentinel(endIndex < postsToRender.length);

        this.bindPostFilterEvents();
    }

    updateLoadMoreSentinel(hasMore) {
        this.removeLoadMoreSentinel();
        if (!hasMore) return;

        const sentinel = document.createElement('div');
        sentinel.id = 'load-more-sentinel';
        sentinel.className = 'load-more-sentinel';
        const postsListElement = document.getElementById('posts-list');
        postsListElement.appendChild(sentinel);

        if (this.scrollObserver) {
            this.scrollObserver.observe(sentinel);
        }
    }

    removeLoadMoreSentinel() {
        const existing = document.getElementById('load-more-sentinel');
        if (existing) existing.remove();
    }

    bindScrollLoad() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.isLoading) {
                    const postsToRender = this.filteredPosts || this.posts;
                    const currentEnd = this.currentPage * this.postsPerPage;
                    if (currentEnd < postsToRender.length) {
                        this.isLoading = true;
                        this.renderPostsList(null, true);
                        this.isLoading = false;
                    }
                }
            });
        }, { rootMargin: '200px' });

        this.scrollObserver = observer;
    }

    observeSentinel() {
        if (this.scrollObserver) {
            const sentinel = document.getElementById('load-more-sentinel');
            if (sentinel) {
                this.scrollObserver.observe(sentinel);
            }
        }
    }

    renderSeries() {
        const seriesContainer = document.getElementById('series-container');
        if (!seriesContainer) return;

        const grouped = {};
        this.posts.forEach(post => {
            if (post.series) {
                if (!grouped[post.series]) {
                    grouped[post.series] = [];
                }
                grouped[post.series].push(post);
            }
        });

        const seriesOrder = this.seriesMeta.map(s => s.name);
        const sortedKeys = Object.keys(grouped).sort((a, b) => {
            const iA = seriesOrder.indexOf(a);
            const iB = seriesOrder.indexOf(b);
            if (iA === -1 && iB === -1) return a.localeCompare(b);
            if (iA === -1) return 1;
            if (iB === -1) return -1;
            return iA - iB;
        });

        if (sortedKeys.length === 0) {
            seriesContainer.innerHTML = '<div class="no-series">暂无系列</div>';
            return;
        }

        let html = '';
        sortedKeys.forEach(key => {
            const posts = grouped[key];
            const meta = this.seriesMeta.find(s => s.name === key);
            const slug = meta ? meta.slug : encodeURIComponent(key);
            html += `<a href="posts.html?series=${encodeURIComponent(key)}" class="series-btn" data-series="${key}" title="${meta ? meta.description : ''}">`;
            html += `${key}<span class="series-count">${posts.length}</span>`;
            html += `</a>`;
        });

        seriesContainer.innerHTML = html;

        seriesContainer.querySelectorAll('.series-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const series = btn.getAttribute('data-series');
                this.filterBySeries(series);
            });
        });
    }

    renderTimeline() {
        const timelineContainer = document.getElementById('timeline-container');
        if (!timelineContainer) return;

        const grouped = {};
        this.posts.forEach(post => {
            const date = new Date(post.date);
            const key = `${date.getFullYear()}年${date.getMonth() + 1}月`;
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(post);
        });

        const sortedKeys = Object.keys(grouped).sort((a, b) => {
            const [yA, mA] = a.match(/(\d+)年(\d+)月/).slice(1).map(Number);
            const [yB, mB] = b.match(/(\d+)年(\d+)月/).slice(1).map(Number);
            return yB !== yA ? yB - yA : mB - mA;
        });

        let html = '';
        sortedKeys.forEach(key => {
            const posts = grouped[key];
            html += `<div class="timeline-group">`;
            html += `<div class="timeline-header" data-expanded="false">`;
            html += `<span class="timeline-arrow">▶</span>`;
            html += `<span class="timeline-label">${key}</span>`;
            html += `<span class="timeline-count">${posts.length}</span>`;
            html += `</div>`;
            html += `<div class="timeline-items" style="display:none;">`;
            posts.forEach(post => {
                const day = new Date(post.date).getDate();
                html += `<div class="timeline-item" data-post-id="${post.id}" title="${post.title}">`;
                html += `<span class="timeline-day">${day}日</span>`;
                html += `<span class="timeline-title">${post.title}</span>`;
                html += `</div>`;
            });
            html += `</div></div>`;
        });

        timelineContainer.innerHTML = html;

        timelineContainer.querySelectorAll('.timeline-header').forEach(header => {
            header.addEventListener('click', () => {
                const items = header.nextElementSibling;
                const arrow = header.querySelector('.timeline-arrow');
                const isExpanded = header.getAttribute('data-expanded') === 'true';

                if (isExpanded) {
                    items.style.display = 'none';
                    arrow.textContent = '▶';
                    header.setAttribute('data-expanded', 'false');
                } else {
                    items.style.display = 'block';
                    arrow.textContent = '▼';
                    header.setAttribute('data-expanded', 'true');
                }
            });
        });

        timelineContainer.querySelectorAll('.timeline-item').forEach(item => {
            item.addEventListener('click', () => {
                const postId = item.getAttribute('data-post-id');
                const postElement = document.querySelector(`.post-item a[href="post-detail.html?id=${postId}"]`);
                if (postElement) {
                    const article = postElement.closest('.post-item');
                    if (article) {
                        article.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        article.classList.add('post-item-highlight');
                        setTimeout(() => article.classList.remove('post-item-highlight'), 2000);
                        return;
                    }
                }
                this.loadAllPostsForJump(postId);
            });
        });
    }

    loadAllPostsForJump(targetPostId) {
        const postsToRender = this.filteredPosts || this.posts;
        this.filteredPosts = postsToRender;
        this.currentPage = 0;
        this.removeLoadMoreSentinel();

        const postsListElement = document.getElementById('posts-list');
        const postsHTML = postsToRender.map(post => this.createPostHTML(post)).join('');
        postsListElement.innerHTML = postsHTML;
        this.currentPage = Math.ceil(postsToRender.length / this.postsPerPage);
        this.bindPostFilterEvents();

        const postElement = document.querySelector(`.post-item a[href="post-detail.html?id=${targetPostId}"]`);
        if (postElement) {
            const article = postElement.closest('.post-item');
            if (article) {
                setTimeout(() => {
                    article.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    article.classList.add('post-item-highlight');
                    setTimeout(() => article.classList.remove('post-item-highlight'), 2000);
                }, 100);
            }
        }
    }

    createBackToTopButton() {
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
        });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    createPostHTML(post) {
        const categoriesHTML = post.categories ? 
            `<div class="post-categories">${post.categories.map(cat => 
                `<a href="?category=${encodeURIComponent(cat)}" class="category-badge" data-category="${cat}">${cat}</a>`
            ).join('')}</div>` : '';

        const tagsHTML = post.tags ? 
            `<div class="post-tags">${post.tags.map(tag => 
                `<a href="?tag=${encodeURIComponent(tag)}" class="tag-badge" data-tag="${tag}">${tag}</a>`
            ).join('')}</div>` : '';

        let dateHTML = `<span class="post-date">${this.formatDate(post.date)}</span>`;
        if (post.update_date) {
            dateHTML += `<span class="post-update-date">（更新于 ${this.formatDate(post.update_date)}）</span>`;
        }
        if (post.series) {
            dateHTML += `<span class="series-badge" data-series="${post.series}">${post.series}${post.series_order ? ` · 第${post.series_order}/${this.seriesCount[post.series]}篇` : ''}</span>`;
        }

        return `
            <article class="post-item">
                <h3 class="post-title"><a href="post-detail.html?id=${post.id}">${post.title}</a></h3>
                <div class="post-meta">
                    ${dateHTML}
                </div>
                <div class="post-excerpt">${post.excerpt || '阅读全文...'}</div>
                ${categoriesHTML}
                ${tagsHTML}
            </article>
        `;
    }

    renderCategories() {
        const categoriesElement = document.getElementById('categories-list');
        categoriesElement.innerHTML = this.categories.map(category => 
            `<a href="?category=${encodeURIComponent(category)}" class="category-badge" data-category="${category}">${category}</a>`
        ).join('');

        // 绑定分类点击事件
        document.querySelectorAll('[data-category]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.closest('[data-category]');
                const category = target.getAttribute('data-category');
                this.filterByCategory(category);
            });
        });
    }

    renderTags() {
        const tagsContainer = document.getElementById('tags-container');
        tagsContainer.innerHTML = this.tags.map(tag => 
            `<a href="?tag=${encodeURIComponent(tag)}" class="tag-badge" data-tag="${tag}">${tag}</a>`
        ).join('');

        // 绑定标签点击事件
        document.querySelectorAll('[data-tag]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.closest('[data-tag]');
                const tag = target.getAttribute('data-tag');
                this.filterByTag(tag);
            });
        });
    }

    bindSearch() {
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value;
            this.searchPosts(searchTerm);
        });
    }

    bindPostFilterEvents() {
        const postsList = document.getElementById('posts-list');
        
        postsList.querySelectorAll('[data-category]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.closest('[data-category]');
                const category = target.getAttribute('data-category');
                this.filterByCategory(category);
            });
        });

        postsList.querySelectorAll('[data-tag]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = e.target.closest('[data-tag]');
                const tag = target.getAttribute('data-tag');
                this.filterByTag(tag);
            });
        });

        postsList.querySelectorAll('[data-series]').forEach(badge => {
            badge.addEventListener('click', (e) => {
                e.preventDefault();
                const series = badge.getAttribute('data-series');
                this.filterBySeries(series);
            });
        });
    }

    filterByCategory(category) {
        const urlParams = new URLSearchParams(window.location.search);
        const categories = urlParams.getAll('category');
        
        if (categories.includes(category)) {
            const newCategories = categories.filter(c => c !== category);
            urlParams.delete('category');
            newCategories.forEach(c => urlParams.append('category', c));
        } else {
            urlParams.append('category', category);
        }
        
        urlParams.delete('search');
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
        
        this.applyFilters();
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

    filterBySeries(series) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete('category');
        urlParams.delete('tag');
        urlParams.delete('search');
        urlParams.set('series', series);
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams.toString()}`);
        
        this.applyFilters();
    }

    searchPosts(searchTerm) {
        const urlParams = new URLSearchParams(window.location.search);
        
        if (!searchTerm.trim()) {
            urlParams.delete('search');
            window.history.replaceState({}, '', `${window.location.pathname}${urlParams.toString() ? '?' + urlParams.toString() : ''}`);
            this.applyFilters();
            return;
        }

        urlParams.set('search', searchTerm);
        // 移除分类和标签参数，因为搜索是独立的过滤方式
        urlParams.delete('category');
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
            day: 'numeric'
        });
    }

    applyFilters() {
        const urlParams = new URLSearchParams(window.location.search);
        const categories = urlParams.getAll('category');
        const tags = urlParams.getAll('tag');
        const series = urlParams.get('series');
        const search = urlParams.get('search');

        let filteredPosts = this.posts;

        if (categories.length > 0) {
            filteredPosts = filteredPosts.filter(post => 
                post.categories && post.categories.some(cat => categories.includes(cat))
            );
        }

        if (tags.length > 0) {
            filteredPosts = filteredPosts.filter(post => 
                post.tags && post.tags.some(tag => tags.includes(tag))
            );
        }

        if (series) {
            filteredPosts = filteredPosts.filter(post => post.series === series);
            filteredPosts.sort((a, b) => (a.series_order || 0) - (b.series_order || 0));
        }

        if (search) {
            const searchTerm = search.toLowerCase();
            filteredPosts = filteredPosts.filter(post => 
                post.title.toLowerCase().includes(searchTerm) ||
                (post.excerpt && post.excerpt.toLowerCase().includes(searchTerm)) ||
                (post.categories && post.categories.some(cat => cat.toLowerCase().includes(searchTerm))) ||
                (post.tags && post.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
            );
        }

        this.renderPostsList(filteredPosts);
        this.updateSeriesInfo(series);
        this.updateFilterInfo(categories, tags, search, series);
        this.updateActiveStates(categories, tags, series);
    }

    updateSeriesInfo(series) {
        const titleEl = document.getElementById('posts-title');
        const descEl = document.getElementById('series-description');

        if (series) {
            titleEl.textContent = series;
            const meta = this.seriesMeta.find(s => s.name === series);
            if (meta && meta.description) {
                descEl.textContent = meta.description;
                descEl.style.display = 'block';
            } else {
                descEl.style.display = 'none';
            }
        } else {
            titleEl.textContent = '博文列表';
            descEl.style.display = 'none';
        }
    }

    updateFilterInfo(categories, tags, search, series) {
        const filterInfo = document.getElementById('filter-info');
        const filterTags = document.getElementById('filter-tags');
        
        if (!filterInfo || !filterTags) {
            return;
        }

        filterTags.innerHTML = '';

        if (series) {
            const tagElement = this.createFilterTag('系列', series, 'series');
            filterTags.appendChild(tagElement);
        }

        categories.forEach(category => {
            const tagElement = this.createFilterTag('分类', category, 'category');
            filterTags.appendChild(tagElement);
        });

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
        urlParams.delete('category');
        urlParams.delete('tag');
        urlParams.delete('series');
        urlParams.delete('search');
        window.history.replaceState({}, '', window.location.pathname);
        
        this.applyFilters();
        document.getElementById('search-input').value = '';
    }

    updateActiveStates(categories, tags, series) {
        document.querySelectorAll('[data-category]').forEach(link => {
            const category = link.getAttribute('data-category');
            if (categories.includes(category)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        document.querySelectorAll('[data-tag]').forEach(link => {
            const tag = link.getAttribute('data-tag');
            if (tags.includes(tag)) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });

        document.querySelectorAll('[data-series]').forEach(badge => {
            const s = badge.getAttribute('data-series');
            if (series && s === series) {
                badge.classList.add('active');
            } else {
                badge.classList.remove('active');
            }
        });
    }

    // 示例博文数据
    getSamplePosts() {
        return [
            {
                id: 1,
                title: "Markdown功能完整示例",
                date: "2024-06-30",
                content: "# Markdown功能完整示例\n\n## 1. 文本格式\n\n### 1.1 基础格式\n\n**粗体文本** 和 *斜体文本*，以及 ***粗斜体文本***。\n\n~~删除线文本~~ 和 <u>下划线文本</u>（HTML语法）。\n\n`行内代码块` 用于展示代码片段。\n\n### 1.2 特殊强调\n\n> 这是一个引用块，用于引用他人的言论或重要内容。\n\n> 嵌套引用示例：\n>> 这是嵌套的引用内容\n>>> 多层嵌套也是可以的\n\n## 2. 列表\n\n### 2.1 无序列表\n\n- 无序列表项1\n- 无序列表项2\n  - 嵌套无序列表项2.1\n  - 嵌套无序列表项2.2\n    - 深层嵌套列表项\n- 无序列表项3\n\n### 2.2 有序列表\n\n1. 有序列表项1\n2. 有序列表项2\n   1. 嵌套有序列表项2.1\n   2. 嵌套有序列表项2.2\n3. 有序列表项3\n\n### 2.3 任务列表\n\n- [x] 已完成任务\n- [ ] 未完成任务\n- [ ] 另一个未完成任务\n  - [x] 子任务已完成\n  - [ ] 子任务未完成\n\n## 3. 链接与图片\n\n### 3.1 链接\n\n[Markdown官方文档](https://daringfireball.net/projects/markdown/)\n\n[带标题的链接](https://example.com \"示例网站\")\n\n<https://example.com> 直接URL链接\n\n### 3.2 图片\n\n![示例图片描述](https://via.placeholder.com/150)\n\n![带标题的图片](https://via.placeholder.com/150 \"示例图片标题\")\n\n## 4. 代码\n\n### 4.1 行内代码\n\n使用 `console.log(\"Hello World\")` 输出信息。\n\n### 4.2 代码块\n\n```javascript\nfunction greet(name) {\n  return `Hello, ${name}!`;\n}\n\n// 调用函数\nconsole.log(greet(\"World\"));\n```\n\n```python\n# Python示例代码\ndef factorial(n):\n    if n <= 1:\n        return 1\n    else:\n        return n * factorial(n-1)\n\nprint(factorial(5))\n```\n\n```html\n<!DOCTYPE html>\n<html>\n<head>\n    <title>示例HTML</title>\n</head>\n<body>\n    <h1>Hello World</h1>\n</body>\n</html>\n```\n\n## 5. 表格\n\n| 名称 | 类型 | 说明 |\n| --- | --- | --- |\n| id | 数字 | 唯一标识符 |\n| title | 文本 | 标题内容 |\n| status | 文本 | 状态信息 |\n\n### 5.1 对齐方式\n\n| 左对齐 | 居中对齐 | 右对齐 |\n| :--- | :---: | ---: |\n| 内容1 | 内容2 | 内容3 |\n| 较长内容 | 中等长度 | 简短 |\n\n## 6. 分隔线\n\n---\n\n***\n\n___\n\n## 7. 脚注\n\n这是一个带有脚注的文本[^1]。\n\n这是另一个脚注[^note]。\n\n[^1]: 这是第一个脚注的内容。\n\n[^note]: 这是第二个脚注的内容，可以包含更多详细信息。\n\n## 8. 特殊字符转义\n\n\\* 这不是斜体文本 \\\n\\` 这不是行内代码 \\\n\\# 这不是标题 \\\n\\[\\]\\(\\) 这不是链接语法\n\n## 9. 自动链接\n\n<https://example.com>\n\n<example@example.com>\n\n## 10. 文本高亮\n\n==高亮文本== (GitHub风格扩展)\n\n## 11. 数学公式\n\n行内公式：$E = mc^2$\n\n块级公式：\n\n$$\n\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}\n$$\n\n## 12. 定义列表\n\n术语1\n: 这是术语1的定义\n: 这是术语1的另一个定义\n\n术语2\n: 这是术语2的定义\n\n## 13. HTML混合使用\n\n### 13.1 基本HTML标签\n\n<div style=\"color: blue;\">使用HTML标签设置蓝色文本</div>\n\n### 13.2 复杂HTML结构\n\n<table border=\"1\">\n  <tr>\n    <th>表头1</th>\n    <th>表头2</th>\n  </tr>\n  <tr>\n    <td>单元格1</td>\n    <td>单元格2</td>\n  </tr>\n</table>\n\n## 14. 目录\n\n[TOC]\n\n## 15. 上标与下标\n\nH~2~O 表示水分子\n\nX^2^ 表示X的平方\n\n---\n\n这个示例文件包含了几乎所有常用的Markdown语法元素，包括一些扩展功能。可以用它来全面测试Markdown到JSON的转换工具。",
                excerpt: "这是一个包含所有常见Markdown功能的示例文件，用于测试转换工具。",
                categories: ["技术", "教程"],
                tags: ["Markdown", "示例", "格式"]
            },
            {
                id: 2,
                title: '现在使用的是示例内容',
                date: '2024-01-15',
                excerpt: '这是第二篇示例博文的摘要内容。',
                categories: ['随笔'],
                tags: ['生活', '感悟']
            }
        ];
    }
}

// 初始化博文管理器
document.addEventListener('DOMContentLoaded', () => {
    new PostManager();
});
