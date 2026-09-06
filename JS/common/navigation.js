/**
 * 全站导航栏生成脚本
 *
 * 职责: 在所有页面自动生成顶部导航栏(首页/博客/书影音/灵感碎片/个人成果/视频/工具/运动/赛事/票据),
 *       根据当前页面高亮对应导航项,并处理移动端汉堡菜单的展开/收起。
 *
 * 加载: 所有 HTML 在 <head> 中引用本文件,页面加载完成后自动执行。
 */

// 页面加载完成后初始化导航(保证 DOM 结构就绪)
document.addEventListener('DOMContentLoaded', function() {
    // ============ 导航配置 ============
    // 全站导航项列表: href 为目标页面, label 为显示文字
    const NAV_ITEMS = [
        { href: './index.html', label: '首页' },
        { href: './posts.html', label: '博客文章' },
        { href: './reviews.html', label: '书影音游剧记录' },
        { href: './moments.html', label: '灵感碎片' },
        { href: './study.html', label: '个人成果' },
        { href: './video.html', label: '视频展示' },
        { href: './tools.html', label: '小工具&小游戏' },
        { href: './sports.html', label: '体育运动' },
        { href: './races.html', label: '赛事' },
        { href: './tickets.html', label: '票据收藏' }
    ];

    /**
     * 渲染导航栏
     * 动态生成导航链接 HTML 并写入 .nav ul.clearfix 容器,
     * 根据当前页面路径为对应链接添加 active 高亮类,
     * 同时保留(或重建)导航栏内的主题切换开关。
     */
    function renderNav() {
        // 导航容器: 每个页面 HTML 中都有 <div class="nav"><ul class="clearfix">
        const navUl = document.querySelector('.nav ul.clearfix');
        // 若容器不存在(如某些特殊页面),直接跳过导航渲染
        if (!navUl) return;

        // 获取当前页面文件名(如 posts.html),用于高亮判断
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        // 查找导航容器中已有的主题切换开关(可能由 HTML 直接提供)
        const themeToggle = navUl.querySelector('.theme-toggle');

        // 遍历导航项生成 <li><a> 链接,当前页面的链接加 active 类
        const navLinksHTML = NAV_ITEMS.map(item => {
            const page = item.href.split('/').pop();        // 提取目标页面文件名
            const isActive = page === currentPage;          // 判断是否为当前页
            return `<li><a href="${item.href}"${isActive ? ' class="active"' : ''}>${item.label}</a></li>`;
        }).join('');

        if (themeToggle) {
            // 情况1: HTML 已提供主题开关 — 生成链接后把开关 <li> 移到末尾
            const toggleLi = themeToggle.closest('li');
            if (toggleLi) {
                navUl.innerHTML = navLinksHTML;             // 先写入全部导航链接
                navUl.appendChild(toggleLi);                // 再把开关移到末尾
            } else {
                // 开关不在 <li> 内: 用开关的 HTML 重新包裹成 <li> 追加
                navUl.innerHTML = navLinksHTML + `<li><label class="theme-toggle">${themeToggle.outerHTML.replace(/<label[^>]*>|<\/label>/g, '')}</label></li>`;
            }
        } else {
            // 情况2: HTML 未提供开关 — 动态生成一个完整的主题开关追加到末尾
            navUl.innerHTML = navLinksHTML + `<li>
                <label class="theme-toggle">
                    <input type="checkbox" id="themeToggle">
                    <span class="theme-toggle-slider"></span>
                </label>
            </li>`;
        }
    }

    /**
     * 初始化导航功能
     * 渲染导航栏,并绑定移动端汉堡菜单按钮的点击事件
     * (点击时切换菜单展开状态,同步 aria-expanded 无障碍属性)。
     */
    function initNavigation() {
        renderNav();

        // 移动端汉堡菜单按钮(HTML 中 .nav-toggle)
        const navToggle = document.querySelector('.nav-toggle');
        // 导航容器
        const nav = document.querySelector('.nav');

        // 绑定点击事件: 展开/收起导航,并更新无障碍状态
        if (navToggle && nav) {
            navToggle.addEventListener('click', function() {
                nav.classList.toggle('active');             // 导航展开/收起
                this.classList.toggle('active');            // 按钮图标(汉堡↔X)切换
                // 同步 aria-expanded 属性(辅助技术读取展开状态)
                const expanded = this.getAttribute('aria-expanded') === 'true';
                this.setAttribute('aria-expanded', !expanded);
            });
        }
    }

    /**
     * 检测导航是否换行(标题与导航不在同一行),动态添加 .nav-wrapped 类
     * 使换行时导航自动切换为两端对齐布局,不依赖固定断点
     * (导航项增减后断点自动跟随内容宽度,无需手动调整)
     */
    function initNavWrapDetection() {
        // 移动端形态断点: 仅用于区分"展开导航 vs 汉堡抽屉",与导航项数量无关。
        // 抽屉可容纳任意数量的导航项,故该值不随菜单增减而变化;
        // 如需调整设备形态分界(如希望平板也用抽屉),只改这里。
        const MOBILE_BREAKPOINT = 768;
        const header = document.querySelector('.header');
        const h1 = header ? header.querySelector('h1') : null;
        const nav = header ? header.querySelector('.nav') : null;
        if (!header || !h1 || !nav) return;

        let ticking = false;
        function updateNavWrap() {
            ticking = false;
            // 移动端(抽屉导航)不参与换行检测
            if (window.innerWidth <= MOBILE_BREAKPOINT) {
                header.classList.remove('nav-wrapped');
                return;
            }
            // 先移除类测"自然布局"(同一帧内完成,无闪烁),
            // 避免 .nav-wrapped 的样式自身造成"永远换行"的假象
            header.classList.remove('nav-wrapped');
            // 导航顶部低于标题底部 = 导航换行到第二行了
            const wrapped = nav.getBoundingClientRect().top > h1.getBoundingClientRect().bottom;
            header.classList.toggle('nav-wrapped', wrapped);
        }
        function onResize() {
            // requestAnimationFrame 节流: resize 高频触发时合并为每帧一次
            if (!ticking) {
                ticking = true;
                requestAnimationFrame(updateNavWrap);
            }
        }
        updateNavWrap();
        window.addEventListener('resize', onResize);
    }

    // 页面加载后立即初始化导航
    initNavigation();
    initNavWrapDetection();
});
