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
           await this.preloadMediaSizes();   // 预读所有媒体尺寸,布局从第一帧就正确
           this.extractTags();
           this.renderMomentsList();
           this.renderTags();
           this.renderStats();
           this.bindSearch();
           this.bindClearFilter();
           this.bindDetailEvents();
           this.checkUrlParams();
       } catch (error) {
           console.error('加载灵感碎片数据失败:', error);
           document.getElementById('moments-list').innerHTML = '<div class="error">加载灵感碎片失败</div>';
       }
   }

   /**
    * 预读所有媒体(图片/视频)的原始尺寸,渲染时用作占位宽高
    * 使瀑布流首次布局即正确,无需隐藏/重排,无闪动
    */
   async preloadMediaSizes() {
       this.mediaSizes = new Map();
       const tmp = document.createElement('div');
       const pending = [];
       this.moments.forEach(moment => {
           tmp.innerHTML = this.md ? this.md.render(moment.content || '') : '';
           tmp.querySelectorAll('img').forEach(img => {
               const url = img.getAttribute('src');
               if (url && !this.mediaSizes.has(url)) {
                   this.mediaSizes.set(url, null);
                   pending.push(new Promise(resolve => {
                       const probe = new Image();
                       probe.onload = () => { this.mediaSizes.set(url, { w: probe.naturalWidth, h: probe.naturalHeight }); resolve(); };
                       probe.onerror = () => resolve();
                       probe.src = url;
                   }));
               }
           });
           tmp.querySelectorAll('video').forEach(v => {
               const url = v.getAttribute('src');
               if (url && !this.mediaSizes.has(url)) {
                   this.mediaSizes.set(url, null);
                   pending.push(new Promise(resolve => {
                       const probe = document.createElement('video');
                       probe.preload = 'metadata';
                       probe.onloadedmetadata = () => { this.mediaSizes.set(url, { w: probe.videoWidth, h: probe.videoHeight }); resolve(); };
                       probe.onerror = () => resolve();
                       probe.src = url;
                   }));
               }
           });
           tmp.innerHTML = '';
       });
       // 等待全部尺寸就绪(5 秒兜底,个别媒体异常不影响)
       await Promise.race([
           Promise.all(pending),
           new Promise(r => setTimeout(r, 5000))
       ]);
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

       // 给媒体设占位宽高(来自预读尺寸),布局从第一帧就正确
       items.forEach(item => {
           item.querySelectorAll('img, video').forEach(media => {
               const url = media.getAttribute('src');
               const size = this.mediaSizes && this.mediaSizes.get(url);
               if (size && size.w && size.h) {
                   media.style.aspectRatio = `${size.w} / ${size.h}`;
               }
           });
       });

       this.masonryDestroy = MasonryLayout({
           container: momentsListElement,
           items: items,
           columnMinWidth: 320,
           columnGap: 20,
           watchImages: true   // 兜底: 媒体加载后若尺寸有变再重排(通常占位已准确,无变化)
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

       // 图片懒加载(布局已由 aspect-ratio 占位保证正确,懒加载不影响排布)
       content.querySelectorAll('img').forEach(img => {
           img.loading = 'lazy';
       });
       content.querySelectorAll('video').forEach(video => {
           video.preload = 'metadata';
       });

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
               e.stopPropagation();
               const tagName = tag.getAttribute('data-tag');
               this.filterByTag(tagName);
           });
       });

       // 卡片点击打开详情
       momentsList.querySelectorAll('.moment-item').forEach(card => {
           card.addEventListener('click', (e) => {
               if (e.target.closest('.moment-tag')) return;
               if (e.target.closest('a')) return;
               // 点击播放控件不打开详情(避免媒体控制被冒泡吞掉)
               if (e.target.closest('audio, video')) return;
               this.openMomentDetail(card.dataset.id);
           });
       });
   }

   // === 详情弹窗 ===
   bindDetailEvents() {
       const overlay = document.getElementById('moment-detail-overlay');
       const closeBtn = document.getElementById('moment-detail-close');
       if (!overlay || !closeBtn) return;

       closeBtn.addEventListener('click', () => this.closeMomentDetail());

       // 点击背景关闭
       overlay.addEventListener('click', (e) => {
           if (e.target === overlay) this.closeMomentDetail();
       });

       // ESC 关闭
       document.addEventListener('keydown', (e) => {
           if (e.key === 'Escape' && overlay.classList.contains('active')) {
               this.closeMomentDetail();
           }
       });
   }

   openMomentDetail(id) {
       const overlay = document.getElementById('moment-detail-overlay');
       const content = document.getElementById('moment-detail-content');
       if (!overlay || !content) return;

       const moment = this.moments.find(m => String(m.id) === String(id));
       if (!moment) return;

       // 记录源卡片媒体的元素(移入详情,关闭时移回)
       const srcCard = document.querySelector(`.moment-item[data-id="${id}"]`);
       const srcMedia = srcCard ? Array.from(srcCard.querySelectorAll('audio, video')) : [];

       // 暂停其他卡片的媒体(保留进度)
       document.querySelectorAll('.moment-item audio, .moment-item video').forEach(m => {
           if (srcMedia.includes(m)) return;
           try { m.pause(); } catch (e) { /* ignore */ }
       });

       let html = '<div class="moment-detail-header">';
       html += `<span class="moment-detail-date">${this.formatDateTime(moment.created_at)}</span>`;
       if (moment.tags && moment.tags.length > 0) {
           html += `<div class="moment-detail-tags">${moment.tags.map(t => `<span class="moment-tag">${t}</span>`).join('')}</div>`;
       }
       html += '</div>';

       html += '<div class="moment-detail-body">';
       html += this.md ? this.md.render(moment.content || '') : (moment.content || '');
       html += '</div>';

       content.innerHTML = html;

       // 懒加载弹窗内图片
       content.querySelectorAll('img').forEach(img => { img.loading = 'lazy'; });

       // 详情媒体 = 实时镜像(卡片媒体保持单实例继续播放,声音永不切换)
       // 详情里的镜像控件通过监听卡片媒体状态实时同步,并可直接控制播放
       const renderedMedia = Array.from(content.querySelectorAll('.moment-detail-body audio, .moment-detail-body video'));
       this._detailMirrors = [];
       renderedMedia.forEach((el, i) => {
           const cardMedia = srcMedia[i];
           if (!cardMedia) return;
           const mirror = this.createMediaMirror(cardMedia);
           if (mirror) {
               el.replaceWith(mirror.el);
               this._detailMirrors.push(mirror);
           }
       });

       overlay.classList.add('active');
       document.body.style.overflow = 'hidden';
   }

   /**
    * 生成详情里的媒体镜像控件(实时画面 + 控制条),控制卡片媒体
    * 功能对齐原生控件: 播放/暂停、拖进度、倍速、音量
    */
   createMediaMirror(media) {
       const wrap = document.createElement('div');
       wrap.className = 'moment-mirror';

       let rafId = null;
       let mediaArea = null;
       if (media.tagName === 'VIDEO') {
           const canvas = document.createElement('canvas');
           canvas.className = 'moment-mirror-canvas';
           canvas.style.cursor = 'pointer';
           wrap.appendChild(canvas);
           mediaArea = canvas;
           const draw = () => {
               if (media.readyState >= 2) {
                   const w = media.videoWidth || 640;
                   const h = media.videoHeight || 360;
                   if (canvas.width !== w || canvas.height !== h) {
                       canvas.width = w;
                       canvas.height = h;
                   }
                   canvas.getContext('2d').drawImage(media, 0, 0, w, h);
               }
               rafId = requestAnimationFrame(draw);
           };
           draw();
       } else {
           // 音频没有画面,直接就是控制条(紧凑)
           wrap.classList.add('moment-mirror-audio-mode');
       }

       // 控制条
       const controls = document.createElement('div');
       controls.className = 'moment-mirror-controls';

       // 播放/暂停按钮(SVG)
       const btn = document.createElement('button');
       btn.className = 'moment-mirror-btn';
       btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
       const ICON_PLAY = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>';
       const ICON_PAUSE = '<svg viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>';

       // 进度条
       const bar = document.createElement('div');
       bar.className = 'moment-mirror-progress';
       const fill = document.createElement('div');
       fill.className = 'moment-mirror-progress-fill';
       bar.appendChild(fill);

       // 时间
       const time = document.createElement('span');
       time.className = 'moment-mirror-time';

       // 倍速按钮(点击展开菜单选择,与原生控件一致)
       const speedBtn = document.createElement('button');
       speedBtn.className = 'moment-mirror-speed';
       speedBtn.textContent = '1x';
       const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];
       const speedMenu = document.createElement('div');
       speedMenu.className = 'moment-mirror-speed-menu';
       speedMenu.style.display = 'none';
       SPEEDS.forEach(s => {
           const item = document.createElement('button');
           item.type = 'button';
           item.className = 'moment-mirror-speed-item';
           item.textContent = s + 'x';
           item.addEventListener('click', (e) => {
               e.stopPropagation();
               try { media.playbackRate = s; } catch (err) { /* ignore */ }
               speedMenu.style.display = 'none';
           });
           speedMenu.appendChild(item);
       });
       controls.appendChild(speedMenu);   // 挂到控制条下,菜单相对控制条弹出(避免顶到弹窗顶部)
       const closeSpeedMenu = () => { speedMenu.style.display = 'none'; };

       // 音量按钮
       const muteBtn = document.createElement('button');
       muteBtn.className = 'moment-mirror-btn moment-mirror-mute';
       const ICON_SOUND = '<svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>';
       const ICON_MUTED = '<svg viewBox="0 0 24 24"><path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/></svg>';

       controls.appendChild(btn);
       controls.appendChild(bar);
       controls.appendChild(time);
       controls.appendChild(speedBtn);
       controls.appendChild(muteBtn);
       wrap.appendChild(controls);

       const fmt = (s) => {
           s = Math.floor(s || 0);
           return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
       };
       const update = () => {
           btn.innerHTML = (media.paused || media.ended) ? ICON_PLAY : ICON_PAUSE;
           const dur = media.duration || 0;
           const pct = dur ? (media.currentTime / dur * 100) : 0;
           fill.style.width = pct + '%';
           time.textContent = fmt(media.currentTime) + ' / ' + fmt(dur);
           speedBtn.textContent = (media.playbackRate || 1) + 'x';
           const curRate = media.playbackRate || 1;
           speedMenu.querySelectorAll('.moment-mirror-speed-item').forEach(it => {
               it.classList.toggle('active', parseFloat(it.textContent) === curRate);
           });
           muteBtn.innerHTML = media.muted ? ICON_MUTED : ICON_SOUND;
       };
       const onPlay = () => update();
       const onPause = () => update();
       const onTime = () => update();
       const onRate = () => update();
       const onVol = () => update();
       media.addEventListener('play', onPlay);
       media.addEventListener('pause', onPause);
       media.addEventListener('timeupdate', onTime);
       media.addEventListener('ratechange', onRate);
       media.addEventListener('volumechange', onVol);
       media.addEventListener('loadedmetadata', update);
       update();

       // 播放/暂停(按钮 + 画面区域都触发)
       const togglePlay = (e) => {
           if (e) e.stopPropagation();
           if (media.paused || media.ended) {
               const p = media.play();
               if (p && p.catch) p.catch(() => {});
           } else {
               media.pause();
           }
       };
       btn.addEventListener('click', togglePlay);
       if (mediaArea) mediaArea.addEventListener('click', togglePlay);

       // 进度条点击 seek
       bar.addEventListener('click', (e) => {
           e.stopPropagation();
           const rect = bar.getBoundingClientRect();
           const pct = (e.clientX - rect.left) / rect.width;
           if (media.duration) {
               try { media.currentTime = pct * media.duration; } catch (err) { /* ignore */ }
           }
       });

       // 倍速菜单展开/收起
       speedBtn.addEventListener('click', (e) => {
           e.stopPropagation();
           speedMenu.style.display = speedMenu.style.display === 'none' ? 'block' : 'none';
       });
       document.addEventListener('click', closeSpeedMenu);

       // 静音切换
       muteBtn.addEventListener('click', (e) => {
           e.stopPropagation();
           try { media.muted = !media.muted; } catch (err) { /* ignore */ }
           muteBtn.innerHTML = media.muted ? ICON_MUTED : ICON_SOUND;
       });

       return {
           el: wrap,
           cleanup: () => {
               if (rafId) cancelAnimationFrame(rafId);
               document.removeEventListener('click', closeSpeedMenu);
               media.removeEventListener('play', onPlay);
               media.removeEventListener('pause', onPause);
               media.removeEventListener('timeupdate', onTime);
               media.removeEventListener('ratechange', onRate);
               media.removeEventListener('volumechange', onVol);
               media.removeEventListener('loadedmetadata', update);
           }
       };
   }

   closeMomentDetail() {
       const overlay = document.getElementById('moment-detail-overlay');
       if (!overlay) return;

       // 清理详情里的媒体镜像(解绑 rAF 与监听);卡片媒体一直保持播放,无需切换
       if (this._detailMirrors) {
           this._detailMirrors.forEach(m => { if (m.cleanup) m.cleanup(); });
           this._detailMirrors = null;
       }

       overlay.classList.remove('active');
       document.body.style.overflow = '';
       const content = document.getElementById('moment-detail-content');
       if (content) content.innerHTML = '';
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
               content: "【测试内容】这是一条包含图片的灵感碎片：\n![测试图片](./images/moments/20260329_103500.jpg)",
               tags: ["测试", "图片"],
               created_at: "2026-03-29T10:35:00"
           },
           {
               id: 3,
               content: "【测试内容】这是一条包含音频的灵感碎片：\n<audio controls src=\"./audios/moments/20260329_120000.mp3\"></audio>",
               tags: ["测试", "音频"],
               created_at: "2026-03-29T12:00:00"
           },
           {
               id: 4,
               content: "【测试内容】这是一条包含视频的灵感碎片：\n<video controls src=\"./videos/moments/20260329_130000.mp4\"></video>",
               tags: ["测试", "视频"],
               created_at: "2026-03-29T13:00:00"
           }
       ];
   }
}

document.addEventListener('DOMContentLoaded', () => {
   new MomentsManager();
});
