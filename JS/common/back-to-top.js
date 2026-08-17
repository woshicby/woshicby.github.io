/**
 * 返回顶部按钮(全站通用 UI 组件)
 *
 * 职责: 页面滚动超过 400px 时显示"回到顶部"浮动按钮,
 * 点击后平滑滚动到顶部。页面加载后自动初始化,无需手动调用。
 *
 * 加载: 所有页面在 common/navigation.js 之后引入本文件即可。
 */

(function () {
    'use strict';

    function initBackToTopButton() {
        if (document.getElementById('back-to-top')) return;

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
        }, { passive: true });

        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    document.addEventListener('DOMContentLoaded', initBackToTopButton);
})();
