class MomentsManager extends FilterableListManager {
   constructor() {
       super();
       this.moments = [];
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

   async loadMoments() {
       const data = await fetchJSON('JSON/moments.json', null);
       if (data) {
           this.moments = data;
           this.moments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
       } else {
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

       // 销毁之前的瀑布流实例
       if (this.masonryDestroy) this.masonryDestroy();

       if (momentsToRender.length === 0) {
           momentsListElement.innerHTML = '<div class="no-moments">没有找到相关的灵感碎片</div>';
           return;
       }

       const items = momentsToRender.map(moment => this.createMomentElement(moment));

       this.masonryDestroy = MasonryLayout({
           container: momentsListElement,
           items: items,
           columnMinWidth: 320,
           columnGap: 20
       });

       this.bindMomentFilterEvents();
   }

   createMomentElement(moment) {
       const article = document.createElement('article');
       article.className = 'moment-item';
       article.dataset.id = moment.id;

       const meta = document.createElement('div');
       meta.className = 'moment-meta';

       const date = document.createElement('span');
       date.className = 'moment-date';
       date.textContent = this.formatDateTime(moment.created_at);
       meta.appendChild(date);

       if (moment.tags && moment.tags.length > 0) {
           const tagsDiv = document.createElement('div');
           tagsDiv.className = 'moment-tags';
           moment.tags.forEach(tag => {
               const span = document.createElement('span');
               span.className = 'moment-tag';
               span.dataset.tag = tag;
               span.textContent = tag;
               tagsDiv.appendChild(span);
           });
           meta.appendChild(tagsDiv);
       }

       article.appendChild(meta);

       const content = document.createElement('div');
       content.className = 'moment-content';
       content.innerHTML = this.md ? this.md.render(moment.content || '') : (moment.content || '');
       article.appendChild(content);

       return article;
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

   formatDateTime(dateString) {
       return formatDate(dateString, {
           year: 'numeric',
           month: 'long',
           day: 'numeric',
           hour: '2-digit',
           minute: '2-digit'
       });
   }

   applyFilters() {
       const urlParams = getUrlParams();
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
       const entries = [];
       tags.forEach(tag => entries.push({ type: '标签', value: tag, paramType: 'tag' }));
       if (search) entries.push({ type: '搜索', value: search, paramType: 'search' });
       super.updateFilterInfo(entries);
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
