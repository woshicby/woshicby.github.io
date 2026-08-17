/**
 * 博客文章列表页面脚本
 * 对应页面: posts.html
 * 功能: 展示博文列表,支持分类/系列/标签/搜索筛选、时间线、无限滚动。
 */

// 博文数据管理和渲染
class PostManager extends FilterableListManager {
    /** 构造函数: 初始化管理器 */
    constructor() {
        super();
        this.posts = [];
        this.categories = [];
        this.seriesMeta = [];
        this.currentPage = 0;
        this.postsPerPage = 5;
        this.filteredPosts = null;
        this.isLoading = false;
        this.init();
    }

    /**
     * 初始化: 加载数据 + 渲染列表/侧边栏 + 绑定事件
     */
    async init() {
        try {
            await this.loadPosts();
            this.extractCategoriesAndTags();
            this.renderPostsList();
            this.renderCategories();
            this.renderSeries();
            this.renderTimeline();
            this.renderTags();
            this.bindSearch();
            this.bindClearFilter();
            this.bindScrollLoad();
            initBackToTopButton();
            this.checkUrlParams();
        } catch (error) {
            console.error('加载博文数据失败:', error);
            document.getElementById('posts-list').innerHTML = '<div class="error">加载博文失败</div>';
        }
    }

    /**
     * 加载博文列表数据(posts-list.json)
     */
    async loadPosts() {
        try {
            // 首先尝试从 posts-list.json 加载文件列表
            const postsList = await fetchJSON('JSON/posts-list.json', null);

            if (postsList) {
                
                // 逐个读取 md 文件并解析
                const postsPromises = postsList.map(async (postInfo) => {
                    try {
                        const mdResponse = await fetch(`posts/${encodeURIComponent(postInfo.file)}`);
                        if (mdResponse.ok) {
                            const mdContent = await mdResponse.text();
                            const parsedPost = this.parseMarkdown(mdContent);
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

            } else {
                this.posts = await this.getSamplePosts();
            }

            const seriesData = await fetchJSON('JSON/posts-series.json', null);
            if (seriesData) {
                this.seriesMeta = seriesData;
            } else {
                this.seriesMeta = [];
            }
        } catch (error) {
            console.error('加载博文数据失败:', error.message);
            this.posts = await this.getSamplePosts();
        }
    }

    /**
     * 解析 Markdown 博文(YAML 前置元数据 + 正文)
     * @param {string} content - Markdown 内容
     */
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

    /**
     * 解析 YAML 前置元数据
     */
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

    /**
     * 提取摘要(移除 Markdown 标记,取前 200 字)
     */
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

    /**
     * 提取全部分类和标签
     */
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

    /**
     * 渲染博文列表(支持分页追加)
     * @param {Array} [filteredPosts] - 筛选后的博文
     * @param {boolean} [append] - 是否追加
     */
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

    /**
     * 更新加载更多哨兵元素
     */
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

    /**
     * 移除加载更多哨兵
     */
    removeLoadMoreSentinel() {
        const existing = document.getElementById('load-more-sentinel');
        if (existing) existing.remove();
    }

    /**
     * 绑定滚动加载(无限滚动)
     */
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

    /**
     * 观察哨兵元素触发加载
     */
    observeSentinel() {
        if (this.scrollObserver) {
            const sentinel = document.getElementById('load-more-sentinel');
            if (sentinel) {
                this.scrollObserver.observe(sentinel);
            }
        }
    }

    /**
     * 渲染系列列表
     */
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

    /**
     * 渲染时间线
     */
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

    /**
     * 加载全部博文用于跳转
     */
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

    /**
     * 生成单篇博文卡片 HTML
     */
    createPostHTML(post) {
        const categoriesHTML = post.categories ? 
            `<div class="post-categories">${post.categories.map(cat => 
                `<a href="?category=${encodeURIComponent(cat)}" class="category-badge" data-category="${cat}">${cat}</a>`
            ).join('')}</div>` : '';

        const tagsHTML = post.tags ? 
            `<div class="post-tags">${post.tags.map(tag => 
                `<a href="?tag=${encodeURIComponent(tag)}" class="tag-badge" data-tag="${tag}">${tag}</a>`
            ).join('')}</div>` : '';

        let dateHTML = `<span class="post-date">${this.formatDateDefault(post.date)}</span>`;
        if (post.update_date) {
            dateHTML += `<span class="post-update-date">（更新于 ${this.formatDateDefault(post.update_date)}）</span>`;
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

    /**
     * 渲染分类栏
     */
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

    /**
     * 渲染标签栏
     */
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

    /**
     * 绑定筛选事件
     */
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

    /**
     * 按分类筛选
     */
    filterByCategory(category) {
        const urlParams = getUrlParams();
        const categories = urlParams.getAll('category');
        
        if (categories.includes(category)) {
            const newCategories = categories.filter(c => c !== category);
            urlParams.delete('category');
            newCategories.forEach(c => urlParams.append('category', c));
        } else {
            urlParams.append('category', category);
        }
        
        urlParams.delete('search');
        setUrlParams(urlParams);
        
        this.applyFilters();
    }

    /**
     * 按系列筛选
     */
    filterBySeries(series) {
        const urlParams = getUrlParams();
        urlParams.delete('category');
        urlParams.delete('tag');
        urlParams.delete('search');
        urlParams.set('series', series);
        setUrlParams(urlParams);
        
        this.applyFilters();
    }

    /**
     * 格式化日期显示
     */
    formatDateDefault(dateString) {
        return formatDate(dateString);
    }

    getSearchClearParams() {
        return ['category', 'tag'];
    }

    getClearFilterParams() {
        return ['category', 'tag', 'series', 'search'];
    }

    /**
     * 应用所有筛选条件
     */
    applyFilters() {
        const urlParams = getUrlParams();
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

    /**
     * 更新系列信息
     */
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

    /**
     * 更新筛选信息显示
     */
    updateFilterInfo(categories, tags, search, series) {
        const entries = [];
        categories.forEach(cat => entries.push({ type: '分类', value: cat, paramType: 'category' }));
        tags.forEach(tag => entries.push({ type: '标签', value: tag, paramType: 'tag' }));
        if (series) entries.push({ type: '系列', value: series, paramType: 'series' });
        if (search) entries.push({ type: '搜索', value: search, paramType: 'search' });
        super.updateFilterInfo(entries);
    }

    /**
     * 更新激活状态
     */
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

    // 示例博文数据(JSON 加载失败时的回退)
    async getSamplePosts() {
        const sample = await fetchJSON('JSON/sample-posts.json', []);
        return sample;
    }
}

// 初始化博文管理器
document.addEventListener('DOMContentLoaded', () => {
    new PostManager();
});
