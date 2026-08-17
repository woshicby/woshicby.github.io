/**
* 背景图片懒加载功能
* 确保页面内容优先加载，背景图片延后加载
*
* 实现原理:
* - 用 JS 预加载背景图(Image 对象),加载完成后给 body 添加 .background-loaded 类
* - CSS 中 body.background-loaded::before 才显示背景图,避免背景图阻塞首屏
* - 对博客列表/详情页,等待内容渲染后再加载背景(避免与内容加载竞争)
*/

/**
 * 背景懒加载器
 * 负责延迟加载全站背景图,并根据页面类型选择合适的加载时机。
 */
class BackgroundLazyLoader {
   /** 构造函数: 初始化状态并触发加载流程 */
   constructor() {
       this.backgroundLoaded = false;   // 背景图是否已加载完成
       this.init();
   }

   /**
    * 初始化: 根据 DOM 就绪状态决定立即执行还是等待 DOMContentLoaded
    */
   init() {
       if (document.readyState === 'loading') {
           // DOM 还在加载: 等待 DOMContentLoaded 事件
           document.addEventListener('DOMContentLoaded', () => this.setupLoader());
       } else {
           // DOM 已就绪: 直接开始
           this.setupLoader();
       }
   }

   /**
    * 设置加载器: 根据当前页面类型选择不同的加载时机
    * - posts 页: 等待博文列表渲染后加载
    * - post-detail 页: 等待博文内容渲染后加载
    * - 其他页: 延迟 500ms 加载
    */
   setupLoader() {
       const currentPage = this.getCurrentPage();
       
       if (currentPage === 'posts') {
           this.waitForPostsLoad();
       } else if (currentPage === 'post-detail') {
           this.waitForPostDetailLoad();
       } else {
           this.loadBackgroundWithDelay();
       }
   }

   /**
    * 获取当前页面类型
    * @returns {'posts'|'post-detail'|'other'} 页面类型标识
    */
   getCurrentPage() {
       const path = window.location.pathname;
       if (path.includes('posts.html')) return 'posts';
       if (path.includes('post-detail.html')) return 'post-detail';
       return 'other';
   }

   /**
    * 等待博文列表加载后加载背景
    * 每 100ms 检查 #posts-list 是否有内容,最多等 5 秒(超时也强制加载)
    */
   waitForPostsLoad() {
       const checkInterval = setInterval(() => {
           const postsList = document.getElementById('posts-list');
           // 博文列表渲染出内容后立即加载背景
           if (postsList && postsList.children.length > 0) {
               clearInterval(checkInterval);
               this.loadBackground();
           }
       }, 100);

       // 5 秒超时保护: 即使列表没渲染完也加载背景
       setTimeout(() => {
           clearInterval(checkInterval);
           this.loadBackground();
       }, 5000);
   }

   /**
    * 等待博文详情加载后加载背景
    * 每 100ms 检查 #post-content 是否有内容(>100字符),最多等 5 秒
    */
   waitForPostDetailLoad() {
       const checkInterval = setInterval(() => {
           const postContent = document.getElementById('post-content');
           // 博文正文渲染出足够内容后加载背景
           if (postContent && postContent.innerHTML.length > 100) {
               clearInterval(checkInterval);
               this.loadBackground();
           }
       }, 100);

       // 5 秒超时保护
       setTimeout(() => {
           clearInterval(checkInterval);
           this.loadBackground();
       }, 5000);
   }

   /**
    * 延迟加载背景(普通页面)
    * 延迟 500ms,给页面主要元素渲染留出时间
    */
   loadBackgroundWithDelay() {
       setTimeout(() => {
           this.loadBackground();
       }, 500);
   }

   /**
    * 核心: 预加载背景图片
    * 用 Image 对象预加载,成功/失败都给出日志;
    * 成功后给 body 添加 .background-loaded 类触发 CSS 显示背景。
    */
   loadBackground() {
       // 已加载过则不再重复加载
       if (this.backgroundLoaded) return;

       const img = new Image();
       img.onload = () => {
           // 背景加载成功: 添加类名,让 CSS 显示背景图
           document.body.classList.add('background-loaded');
           this.backgroundLoaded = true;
           console.log('背景图片加载完成');
       };
       img.onerror = () => {
           // 背景加载失败: 记录警告(页面仍正常,只是无背景)
           console.warn('背景图片加载失败');
       };
       // 开始预加载背景图(注意: 文件名 body_backgrond 是历史拼写,保留)
       img.src = 'images/body_backgrond.jpg';
   }
}

// 实例化: 页面加载即开始懒加载流程
const backgroundLazyLoader = new BackgroundLazyLoader();
