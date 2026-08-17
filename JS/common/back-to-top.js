/**
 * 返回顶部按钮(全站通用 UI 组件)
 *
 * 职责: 页面滚动超过 400px 时显示"回到顶部"浮动按钮,
 * 点击后平滑滚动到顶部。页面加载后自动初始化,无需手动调用。
 *
 * 加载: 所有页面在 common/navigation.js 之后引入本文件即可。
 *
 * 兼容: 同时暴露全局函数 initBackToTopButton(),
 *       供页面脚本(如 posts.js/reviews.js)在 init 中显式调用。
 */

(function () {
    'use strict';

    /**
     * 初始化返回顶部按钮(幂等: 已存在则跳过)
     * 创建按钮元素、绑定滚动显示/隐藏、点击平滑滚动到顶部
     */
    function initBackToTopButton() {
        // 已初始化过则不重复创建
        if (document.getElementById('back-to-top')) return;

        // 创建返回顶部按钮
        const btn = document.createElement('button');
        btn.id = 'back-to-top';
        btn.className = 'back-to-top';
        btn.title = '回到顶部';
        btn.innerHTML = '↑';
        document.body.appendChild(btn);

        // 滚动超过 400px 显示,否则隐藏
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) {
                btn.classList.add('visible');
            } else {
                btn.classList.remove('visible');
            }
        }, { passive: true });

        // 点击平滑滚动到顶部
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // 暴露为全局函数(兼容页面脚本的显式调用)
    window.initBackToTopButton = initBackToTopButton;

    // DOM 就绪后自动初始化(页面无需手动调用)
    document.addEventListener('DOMContentLoaded', initBackToTopButton);
})();
