document.addEventListener('DOMContentLoaded', function() {
    const NAV_ITEMS = [
        { href: './index.html', label: '首页' },
        { href: './posts.html', label: '博客文章' },
        { href: './reviews.html', label: '书影音记录' },
        { href: './moments.html', label: '灵感碎片' },
        { href: './study.html', label: '个人成果' },
        { href: './video.html', label: '视频展示' },
        { href: './tools.html', label: '小工具&小游戏' },
        { href: './sports.html', label: '体育运动' },
        { href: './races.html', label: '赛事' }
    ];

    function renderNav() {
        const navUl = document.querySelector('.nav ul.clearfix');
        if (!navUl) return;

        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const themeToggle = navUl.querySelector('.theme-toggle');

        const navLinksHTML = NAV_ITEMS.map(item => {
            const page = item.href.split('/').pop();
            const isActive = page === currentPage;
            return `<li><a href="${item.href}"${isActive ? ' class="active"' : ''}>${item.label}</a></li>`;
        }).join('');

        if (themeToggle) {
            const toggleLi = themeToggle.closest('li');
            if (toggleLi) {
                navUl.innerHTML = navLinksHTML;
                navUl.appendChild(toggleLi);
            } else {
                navUl.innerHTML = navLinksHTML + `<li><label class="theme-toggle">${themeToggle.outerHTML.replace(/<label[^>]*>|<\/label>/g, '')}</label></li>`;
            }
        } else {
            navUl.innerHTML = navLinksHTML + `<li>
                <label class="theme-toggle">
                    <input type="checkbox" id="themeToggle">
                    <span class="theme-toggle-slider"></span>
                </label>
            </li>`;
        }
    }

    function initNavigation() {
        renderNav();

        const navToggle = document.querySelector('.nav-toggle');
        const nav = document.querySelector('.nav');

        if (navToggle && nav) {
            navToggle.addEventListener('click', function() {
                nav.classList.toggle('active');
                this.classList.toggle('active');
                const expanded = this.getAttribute('aria-expanded') === 'true';
                this.setAttribute('aria-expanded', !expanded);
            });
        }
    }

    initNavigation();
});
