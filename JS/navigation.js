/**
 * 响应式导航栏功能模块
 * 提供移动设备导航菜单切换功能、无障碍支持及错误处理
 */

/**
 * 初始化导航栏功能
 * 检查必要DOM元素并绑定事件监听器
 */
function initNavigation() {
    // 获取导航相关DOM元素
    const navToggle = document.querySelector('.nav-toggle');
    const nav = document.querySelector('.nav');
    
    // 验证必要元素存在性
    if (navToggle && nav) {
        // 为导航切换按钮添加点击事件处理器
        navToggle.addEventListener('click', function() {
            // 切换导航菜单显示状态
            nav.classList.toggle('active');
            
            // 切换按钮自身的活动状态（用于图标变化等样式）
            this.classList.toggle('active');
            
            // 更新无障碍属性，提高可访问性
            const expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', !expanded);
            
            // 开发环境调试信息
            console.log('导航菜单已' + (nav.classList.contains('active') ? '展开' : '收起'));
        });
    } else {
        // 错误处理与调试提示
        if (navToggle === null && nav !== null) {
            console.warn('未找到.nav-toggle元素，但存在.nav元素。请确保HTML结构完整。');
        } else if (nav === null) {
            console.warn('未找到.nav元素。导航功能无法初始化。');
        }
    }
}

/**
 * 页面初始化处理
 * 确保DOM完全加载后执行导航栏初始化
 */
if (document.readyState === 'loading') {
    // DOM加载中，等待加载完成
    document.addEventListener('DOMContentLoaded', initNavigation);
} else {
    // DOM已加载完成，立即初始化
    initNavigation();
}