/**
 * 主题切换功能实现
 * 负责管理网站的日/夜间模式切换、用户偏好存储和系统主题检测
 */

// 等待DOM加载完成
document.addEventListener('DOMContentLoaded', function() {
    // 获取主题切换按钮
    const themeToggle = document.getElementById('themeToggle');
    
    // 如果存在主题切换按钮，初始化主题功能
    if (themeToggle) {
        initializeTheme();
        
        // 添加主题切换事件监听
        themeToggle.addEventListener('change', toggleTheme);
    }
});

/**
 * 初始化主题设置
 * 1. 检查localStorage中是否有保存的主题偏好
 * 2. 如果没有，则使用系统主题设置或默认使用浅色主题
 */
function initializeTheme() {
    const themeToggle = document.getElementById('themeToggle');
    
    // 检查localStorage中是否有保存的主题偏好
    const savedTheme = localStorage.getItem('theme');
    
    // 检查系统主题设置
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    // 确定初始主题
    let initialTheme;
    
    if (savedTheme) {
        // 如果有保存的主题，使用它
        initialTheme = savedTheme;
    } else {
        // 否则使用系统主题
        initialTheme = prefersDarkScheme ? 'dark' : 'light';
    }
    
    // 应用初始主题
    applyTheme(initialTheme);
    
    // 更新主题切换按钮状态
    themeToggle.checked = initialTheme === 'dark';
}

/**
 * 切换主题
 * 1. 根据当前主题切换到另一个主题
 * 2. 保存用户的主题偏好到localStorage
 */
function toggleTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const newTheme = themeToggle.checked ? 'dark' : 'light';
    
    // 应用新主题
    applyTheme(newTheme);
    
    // 保存主题偏好到localStorage
    localStorage.setItem('theme', newTheme);
    
    // 设置data-theme属性以明确指定用户的主题选择
    // 这样可以覆盖系统默认的媒体查询样式
    document.documentElement.setAttribute('data-theme', newTheme);
}

/**
 * 应用指定主题
 * @param {string} theme - 要应用的主题 ('light' 或 'dark')
 */
function applyTheme(theme) {
    const body = document.body;
    
    if (theme === 'dark') {
        // 应用深色主题
        body.classList.add('dark-theme');
        document.documentElement.setAttribute('data-theme', 'dark');
    } else {
        // 应用浅色主题
        body.classList.remove('dark-theme');
        document.documentElement.setAttribute('data-theme', 'light');
    }
}

/**
 * 监听系统主题变化
 * 如果用户没有明确设置主题偏好，跟随系统主题变化
 */
function setupSystemThemeListener() {
    // 监听系统主题变化
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        // 只有在用户没有明确设置主题偏好时，才跟随系统变化
        const savedTheme = localStorage.getItem('theme');
        const themeToggle = document.getElementById('themeToggle');
        
        if (!savedTheme && themeToggle) {
            const newTheme = e.matches ? 'dark' : 'light';
            applyTheme(newTheme);
            themeToggle.checked = newTheme === 'dark';
        }
    });
}

// 启用系统主题变化监听
setupSystemThemeListener();