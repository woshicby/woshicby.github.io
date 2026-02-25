/**
 * B站视频展示功能模块
 * 使用B站官方嵌入式播放器在网页中展示视频内容
 * 支持响应式布局，在PC端横排显示多个视频，移动端仅显示第一个视频
 * 包含视频渲染、用户信息获取与展示功能
 */

/**
 * B站视频展示配置参数
 * @type {Object}
 * @property {string} uid - B站用户UID，用于获取用户信息
 * @property {string} container - 视频容器的CSS选择器
 * @property {string} userContainer - 用户信息卡片的CSS选择器
 * @property {Array<string>} videos - 要展示的B站视频BV号列表
 */
const BILIBILI_CONFIG = {
    uid: '10924343',  // B站用户UID
    container: '#bilibili-videos', // 视频容器选择器
    userContainer: '#bilibili-user-card', // 用户信息容器选择器
    videos: [
        // 要展示的B站视频BV号列表
        'BV1dSvXBaEeq',
        'BV1onigBLEK3',
        'BV1YPuLzMEpB',
        'BV1zKT3zYEL8',
        'BV1VA72zUEmA',
        'BV1jG7nz2E1M',
        'BV1b3jBz7EvQ',
        'BV18EZzYjEBT'
    ]
};

/**
 * 检测当前设备是否为移动设备
 * 使用屏幕宽度和User-Agent双重检测，确保准确性
 * @function isMobileDevice
 * @returns {boolean} - 如果是移动设备返回true，否则返回false
 */
function isMobileDevice() {
    // 检测条件：屏幕宽度小于等于480px，或User-Agent包含Android/iOS设备标识
    return window.innerWidth <= 480 || 
           navigator.userAgent.match(/Android/i) || 
           navigator.userAgent.match(/iPhone|iPad|iPod/i);
}

/**
 * 初始化B站视频展示功能
 * 检查容器元素、清空内容、验证配置，然后渲染视频和用户信息
 * @function initBilibiliVideos
 * @returns {void}
 */
function initBilibiliVideos() {
    // 获取视频容器元素
    const container = document.querySelector(BILIBILI_CONFIG.container);
    // 错误处理：检查容器元素是否存在
    if (!container) return;
    
    // 清空容器内容，准备渲染
    container.innerHTML = '';
    
    // 验证视频配置 - 检查是否有可用视频
    if (!BILIBILI_CONFIG.videos || BILIBILI_CONFIG.videos.length === 0) {
        showError('暂无视频');
        return;
    }
    
    // 添加样式类以便响应式布局
    container.classList.add('video-container');
    
    // 渲染嵌入式视频播放器
    renderEmbeddedVideos();
    
    // 设置窗口大小变化事件监听器，用于响应式调整
    window.addEventListener('resize', handleResize);
}

/**
 * 渲染嵌入式视频播放器
 * @function renderEmbeddedVideos
 * @description 根据设备类型动态生成B站视频嵌入式播放器
 * @returns {void}
 */
function renderEmbeddedVideos() {
    // 获取视频容器元素
    const container = document.querySelector(BILIBILI_CONFIG.container);
    // 检测当前设备是否为移动设备
    const isMobile = isMobileDevice();
    
    // 响应式处理：移动设备只显示第一个视频，桌面设备显示所有视频
    const videosToShow = isMobile ? BILIBILI_CONFIG.videos.slice(0, 1) : BILIBILI_CONFIG.videos;
    
    videosToShow.forEach((bvid, index) => {
        const videoWrapper = document.createElement('div');
        videoWrapper.className = `video-wrapper video-${index + 1}`;
        
        // 使用B站官方嵌入式播放器，移动端高度较小
        const height = isMobile ? 250 : 300;
        
        videoWrapper.innerHTML = `
            <div class="bilibili-player-container">
                <iframe src="//player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0"
                    allowfullscreen="allowfullscreen" width="100%" height="${height}" 
                    scrolling="no" frameborder="0" sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"></iframe>
            </div>
            <div class="video-title">
                <a href="https://www.bilibili.com/video/${bvid}" target="_blank">在B站观看</a>
            </div>
        `;
        
        container.appendChild(videoWrapper);
    });
}

/**
 * 处理窗口大小变化事件
 * @function handleResize
 * @description 响应窗口大小变化，动态调整视频显示数量和尺寸
 * @returns {void}
 */
function handleResize() {
    // 获取视频容器元素
    const container = document.querySelector(BILIBILI_CONFIG.container);
    // 检测当前设备是否为移动设备
    const isMobile = isMobileDevice();
    
    // 响应式逻辑：移动设备只保留第一个视频
    if (isMobile && container.children.length > 1) {
        // 清空容器并重新渲染（只显示第一个视频）
        container.innerHTML = '';
        renderEmbeddedVideos();
    } 
    // 响应式逻辑：桌面设备加载所有视频
    else if (!isMobile && container.children.length === 1 && BILIBILI_CONFIG.videos.length > 1) {
        // 保留第一个视频，添加其余视频
        for (let i = 1; i < BILIBILI_CONFIG.videos.length; i++) {
            const bvid = BILIBILI_CONFIG.videos[i];
            const videoWrapper = document.createElement('div');
            videoWrapper.className = `video-wrapper video-${i + 1}`;
            
            // 根据屏幕宽度调整视频高度
            let height = 300;
            if (window.innerWidth <= 768) {
                height = 250;
            } else if (window.innerWidth <= 992) {
                height = 280;
            }
            
            videoWrapper.innerHTML = `
                <div class="bilibili-player-container">
                    <iframe src="//player.bilibili.com/player.html?bvid=${bvid}&page=1&high_quality=1&danmaku=0"
                        allowfullscreen="allowfullscreen" width="100%" height="${height}" 
                        scrolling="no" frameborder="0" sandbox="allow-top-navigation allow-same-origin allow-forms allow-scripts"></iframe>
                </div>
                <div class="video-title">
                    <a href="https://www.bilibili.com/video/${bvid}" target="_blank">在B站观看</a>
                </div>
            `;
            
            container.appendChild(videoWrapper);
        }
    }
}

/**
 * 显示错误信息
 * @function showError
 * @description 在视频容器中显示错误消息
 * @param {string} message - 要显示的错误消息文本
 * @returns {void}
 */
function showError(message) {
    // 获取视频容器元素
    const container = document.querySelector(BILIBILI_CONFIG.container);
    // 在容器中渲染错误提示信息
    container.innerHTML = `<div class="loading">${message}</div>`;
}

/**
 * 获取B站用户信息（通过CORS代理）
 * @function fetchBilibiliUserInfo
 * @description 使用公共CORS代理服务获取B站用户详细信息
 * @param {number|string} uid - B站用户ID
 * @param {Function} callback - 回调函数，参数为(error, userInfo)
 * @returns {void}
 */
function fetchBilibiliUserInfo(uid, callback) {
    const staticUserData = {
        name: '一条咸鱼by菌',
        face: 'images/b站头像.gif',
        sign: '竹笛/跑步/游戏/日常/动态UP是也~哈工大读博中~催更唠嗑取谱群：629521223',
        follower: 1539,
        following: 2369,
        likes: '1.3万',
        plays: '18.0万'
    };
    
    callback(null, staticUserData);
}

/**
 * 渲染用户信息卡片
 * @function renderUserCard
 * @description 将用户信息渲染成HTML卡片并显示在页面上
 * @param {Object} userInfo - B站用户信息对象
 * @param {string} userInfo.name - 用户名称
 * @param {string} userInfo.face - 用户头像URL
 * @param {string} userInfo.sign - 用户签名
 * @param {number} userInfo.follower - 粉丝数
 * @param {number} userInfo.following - 关注数
 * @returns {void}
 */
function renderUserCard(userInfo) {
    // 获取用户信息容器元素
    const container = document.querySelector(BILIBILI_CONFIG.userContainer);
    
    // 错误处理：检查容器元素是否存在
    if (!container) {
        console.error('用户信息容器未找到');
        return;
    }
    
    // 错误处理：检查用户信息是否有效
    if (!userInfo) {
        container.innerHTML = '<div class="error">用户信息获取失败</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="user-avatar">
            <img src="${userInfo.face}" alt="${userInfo.name}" onerror="this.src='default-avatar.jpg'">
        </div>
        <div class="user-details">
            <h3>${userInfo.name}</h3>
            <p class="user-sign">${userInfo.sign || '暂无签名'}</p>
            <div class="user-stats">
                <span>粉丝: ${userInfo.follower}</span>
                <span>关注: ${userInfo.following}</span>
                <span>获赞: ${userInfo.likes}</span>
                <span>播放: ${userInfo.plays}</span>
            </div>
        </div>
    `;
}

/**
 * 初始化用户信息
 * @function initBilibiliUserInfo
 * @description 初始化用户信息显示，包括设置加载状态和获取用户数据
 * @returns {void}
 */
function initBilibiliUserInfo() {
    // 获取用户信息容器元素
    const container = document.querySelector(BILIBILI_CONFIG.userContainer);
    
    // 错误处理：检查容器元素是否存在
    if (!container) {
        console.error('用户信息容器未找到');
        return;
    }
    
    // 设置加载状态提示
    container.innerHTML = '<div class="loading">加载用户信息中...</div>';
    
    // 调用API获取用户信息
    fetchBilibiliUserInfo(BILIBILI_CONFIG.uid, (error, userInfo) => {
        // 错误处理：处理API调用失败情况
        if (error) {
            console.error('获取B站用户信息出错:', error);
            container.innerHTML = '<div class="error">加载用户信息失败</div>';
            return;
        }
        
        // 成功获取用户信息，渲染用户卡片
        renderUserCard(userInfo);
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initBilibiliVideos();
    initBilibiliUserInfo();
});