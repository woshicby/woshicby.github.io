/**
 * 背景图片懒加载功能
 * 确保页面内容优先加载，背景图片延后加载
 */

class BackgroundLazyLoader {
    constructor() {
        this.backgroundLoaded = false;
        this.init();
    }

    init() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupLoader());
        } else {
            this.setupLoader();
        }
    }

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

    getCurrentPage() {
        const path = window.location.pathname;
        if (path.includes('posts.html')) return 'posts';
        if (path.includes('post-detail.html')) return 'post-detail';
        return 'other';
    }

    waitForPostsLoad() {
        const checkInterval = setInterval(() => {
            const postsList = document.getElementById('posts-list');
            if (postsList && postsList.children.length > 0) {
                clearInterval(checkInterval);
                this.loadBackground();
            }
        }, 100);

        setTimeout(() => {
            clearInterval(checkInterval);
            this.loadBackground();
        }, 5000);
    }

    waitForPostDetailLoad() {
        const checkInterval = setInterval(() => {
            const postContent = document.getElementById('post-content');
            if (postContent && postContent.innerHTML.length > 100) {
                clearInterval(checkInterval);
                this.loadBackground();
            }
        }, 100);

        setTimeout(() => {
            clearInterval(checkInterval);
            this.loadBackground();
        }, 5000);
    }

    loadBackgroundWithDelay() {
        setTimeout(() => {
            this.loadBackground();
        }, 500);
    }

    loadBackground() {
        if (this.backgroundLoaded) return;

        const img = new Image();
        img.onload = () => {
            document.body.classList.add('background-loaded');
            this.backgroundLoaded = true;
            console.log('背景图片加载完成');
        };

        img.onerror = () => {
            console.warn('背景图片加载失败');
        };

        img.src = 'images/body_backgrond.jpg';
    }
}

const backgroundLazyLoader = new BackgroundLazyLoader();
