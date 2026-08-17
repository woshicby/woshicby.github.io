// 个人成果数据管理和渲染
class StudyManager extends FilterableListManager {
   constructor() {
       super();
       this.data = null;
       this.publications = [];
       this.categories = [
           { type: 'all', name: '全部' },
           { type: 'journal', name: '期刊论文' },
           { type: 'conference', name: '会议论文' }
       ];
       this.init();
   }

   async init() {
       try {
           console.log('开始初始化个人成果管理器');
           await this.loadData();
           console.log('成功加载数据，论文总数:', this.publications.length);
           this.extractTags();
           console.log('提取标签:', this.tags.length, '个');
           this.renderAcademicProfiles();
           this.renderPublicationsList();
           this.renderTags();
           this.renderReviews();
           this.bindFilterEvents();
           this.bindSearch();
           this.bindClearFilter();
           this.checkUrlParams();
       } catch (error) {
           console.error('加载数据失败:', error);
           document.getElementById('achievements-list').innerHTML = '<div class="error">加载数据失败</div>';
       }
   }

   async loadData() {
       const data = await fetchJSON('JSON/study-data.json', null);
       if (data) {
           this.data = data;
           this.publications = this.data.publications || [];
           console.log('成功从JSON文件加载数据');
       } else {
           console.warn('使用示例数据');
           this.data = this.getSampleData();
           this.publications = this.data.publications;
       }
   }

   getSampleData() {
       return {
           academicProfiles: [
               { name: "ORCID", id: "0000-0000-0000-0000", url: "https://orcid.org" },
               { name: "Google Scholar", id: "示例ID", url: "https://scholar.google.com" }
           ],
           publications: [
               {
                   id: 1,
                   title: "示例论文1",
                   journal: "示例期刊",
                   date: "2024-01-01",
                   type: "journal",
                   typeName: "期刊论文",
                   authors: "作者A; 作者B",
                   url: "https://example.com",
                   tags: ["示例标签"]
               }
           ],
           reviews: [
               { id: 1, journal: "示例期刊", count: 1 }
           ]
       };
   }

   extractTags() {
       const tagSet = new Set();

       this.publications.forEach(pub => {
           if (pub.tags) {
               pub.tags.forEach(tag => tagSet.add(tag));
           }
       });

       this.tags = Array.from(tagSet).sort();
   }

   renderAcademicProfiles() {
       const container = document.getElementById('personal-details');
       if (!container || !this.data) return;

       const profiles = this.data.academicProfiles || [];
       container.innerHTML = profiles.map(profile => `
           <div class="detail-item">
               <strong>${profile.name}：</strong>
               <a href="${profile.url}" target="_blank" rel="noopener noreferrer">${profile.id}</a>
           </div>
       `).join('');
   }

   renderPublicationsList(filteredPubs = null) {
       const pubsToRender = filteredPubs || this.publications;
       const container = document.getElementById('achievements-list');
       if (!container) return;

       if (pubsToRender.length === 0) {
           container.innerHTML = '<div class="no-posts">没有找到相关论文</div>';
           return;
       }

       const pubsHTML = pubsToRender.map(pub => this.createPublicationHTML(pub)).join('');
       container.innerHTML = pubsHTML;

       this.bindPublicationFilterEvents();
   }

   createPublicationHTML(pub) {
       const tagsHTML = pub.tags ? 
           `<div class="post-tags">${pub.tags.map(tag => 
               `<a href="?tag=${encodeURIComponent(tag)}" class="tag-badge" data-tag="${tag}">${tag}</a>`
           ).join('')}</div>` : '';

       return `
           <div class="achievement-item" data-type="${pub.type}">
               <div class="achievement-title">
                   <strong><a href="${pub.url}" target="_blank" rel="noopener noreferrer">${pub.title}</a></strong>
               </div>
               <div class="achievement-meta">
                   <span class="journal">${pub.journal}</span>
                   <span class="date">${pub.date}</span>
                   <span class="type">${pub.typeName}</span>
               </div>
               <div class="achievement-authors">
                   <strong>作者：</strong>
                   <span>${pub.authors}</span>
               </div>
               ${tagsHTML}
           </div>
       `;
   }

   renderTags() {
       const container = document.getElementById('tags-container');
       if (!container) return;

       container.innerHTML = this.tags.map(tag => 
           `<a href="?tag=${encodeURIComponent(tag)}" class="tag-badge" data-tag="${tag}">${tag}</a>`
       ).join('');

       document.querySelectorAll('[data-tag]').forEach(link => {
           link.addEventListener('click', (e) => {
               e.preventDefault();
               const target = e.target.closest('[data-tag]');
               const tag = target.getAttribute('data-tag');
               this.filterByTag(tag);
           });
       });
   }

   renderReviews() {
       const container = document.getElementById('review-activity');
       if (!container || !this.data) return;

       const reviews = this.data.reviews || [];
       container.innerHTML = reviews.map(review => `
           <div class="review-item">
               <div class="review-title">
                   <strong>评审活动：</strong>
                   <span>${review.journal}</span>
               </div>
               <div class="review-count">
                   <strong>评审数量：</strong>
                   <span>${review.count} 篇</span>
               </div>
           </div>
       `).join('');
   }

   bindFilterEvents() {
       document.querySelectorAll('[data-type]').forEach(link => {
           link.addEventListener('click', (e) => {
               e.preventDefault();
               const target = e.target.closest('[data-type]');
               const type = target.getAttribute('data-type');
               this.filterByType(type);
           });
       });
   }

   bindPublicationFilterEvents() {
       const container = document.getElementById('achievements-list');
       if (!container) return;
       
       container.querySelectorAll('[data-tag]').forEach(link => {
           link.addEventListener('click', (e) => {
               e.preventDefault();
               const target = e.target.closest('[data-tag]');
               const tag = target.getAttribute('data-tag');
               this.filterByTag(tag);
           });
       });
   }

   filterByType(type) {
       const urlParams = getUrlParams();
       urlParams.delete('type');
       if (type !== 'all') {
           urlParams.append('type', type);
       }
       urlParams.delete('search');
       setUrlParams(urlParams);
       this.applyFilters();
   }

   getSearchClearParams() { return ['tag', 'type']; }

   getClearFilterParams() { return ['tag', 'search', 'type']; }

   applyFilters() {
       const urlParams = getUrlParams();
       const type = urlParams.get('type') || 'all';
       const tags = urlParams.getAll('tag');
       const search = urlParams.get('search');

       let filteredPubs = this.publications;

       if (type !== 'all') {
           filteredPubs = filteredPubs.filter(pub => pub.type === type);
       }

       if (tags.length > 0) {
           filteredPubs = filteredPubs.filter(pub => 
               pub.tags && pub.tags.some(tag => tags.includes(tag))
           );
       }

       if (search) {
           const searchTerm = search.toLowerCase();
           filteredPubs = filteredPubs.filter(pub => 
               pub.title.toLowerCase().includes(searchTerm) ||
               pub.journal.toLowerCase().includes(searchTerm) ||
               pub.authors.toLowerCase().includes(searchTerm) ||
               (pub.tags && pub.tags.some(tag => tag.toLowerCase().includes(searchTerm)))
           );
       }

       this.renderPublicationsList(filteredPubs);
       this.updateFilterInfo(type, tags, search);
       this.updateActiveStates(type, tags);
   }

   updateFilterInfo(type, tags, search) {
       const entries = [];
       if (type && type !== 'all') entries.push({ type: '类型', value: type, paramType: 'type' });
       tags.forEach(tag => entries.push({ type: '标签', value: tag, paramType: 'tag' }));
       if (search) entries.push({ type: '搜索', value: search, paramType: 'search' });
       super.updateFilterInfo(entries);
   }

   updateActiveStates(type, tags) {
       document.querySelectorAll('[data-type]').forEach(link => {
           const linkType = link.getAttribute('data-type');
           if ((type === 'all' && linkType === 'all') || (linkType === type)) {
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
   }
}

document.addEventListener('DOMContentLoaded', () => {
   new StudyManager();
});
