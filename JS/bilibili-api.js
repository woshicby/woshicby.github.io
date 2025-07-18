/**
 * B站视频展示功能
 * 使用B站官方嵌入式播放器展示视频
 * PC端横排显示，移动端只显示第一个
 */

// 配置参数
const BILIBILI_CONFIG = {
    uid: '10924343',  // B站用户UID
    container: '#bilibili-videos', // 视频容器选择器
    userContainer: '#bilibili-user-card', // 用户信息容器选择器
    videos: [
        // 这里添加你想要展示的B站视频BV号
        'BV1YPuLzMEpB',
        'BV1zKT3zYEL8',
        'BV1VA72zUEmA',
        'BV1jG7nz2E1M',
        'BV1b3jBz7EvQ',
        'BV18EZzYjEBT'
    ]
};

// 检测是否为移动设备
function isMobileDevice() {
    return window.innerWidth <= 480 || 
           navigator.userAgent.match(/Android/i) || 
           navigator.userAgent.match(/iPhone|iPad|iPod/i);
}

// 初始化函数
function initBilibiliVideos() {
    const container = document.querySelector(BILIBILI_CONFIG.container);
    if (!container) return;
    
    // 清空加载提示
    container.innerHTML = '';
    
    // 如果没有配置视频，显示提示信息
    if (!BILIBILI_CONFIG.videos || BILIBILI_CONFIG.videos.length === 0) {
        showError('暂无视频');
        return;
    }
    
    // 添加视频容器类
    container.classList.add('video-container');
    
    // 渲染视频
    renderEmbeddedVideos();
    
    // 监听窗口大小变化，动态调整视频显示
    window.addEventListener('resize', handleResize);
}

// 渲染嵌入式视频
function renderEmbeddedVideos() {
    const container = document.querySelector(BILIBILI_CONFIG.container);
    const isMobile = isMobileDevice();
    
    // 在移动设备上只加载第一个视频
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

// 处理窗口大小变化
function handleResize() {
    const container = document.querySelector(BILIBILI_CONFIG.container);
    const isMobile = isMobileDevice();
    
    // 如果是移动设备且有多个视频，则重新加载
    if (isMobile && container.children.length > 1) {
        container.innerHTML = '';
        renderEmbeddedVideos();
    } 
    // 如果不是移动设备且只有一个视频，则加载所有视频
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

// 显示错误信息
function showError(message) {
    const container = document.querySelector(BILIBILI_CONFIG.container);
    container.innerHTML = `<div class="loading">${message}</div>`;
}

// 获取B站用户信息（通过CORS代理）
function fetchBilibiliUserInfo(uid, callback) {
    // 使用公共CORS代理服务
    const proxyUrl = 'https://cors-anywhere.herokuapp.com/';
    const apiUrl = `https://api.bilibili.com/x/space/wbi/acc/info?mid=${uid}`;
    
    fetch(proxyUrl + apiUrl)
        .then(response => {
            if (!response.ok) throw new Error('请求失败');
            return response.json();
        })
        .then(data => {
            if (data.code === 0) {
                callback(null, data.data);
            } else {
                callback(new Error(data.message || '获取用户信息失败'));
            }
        })
        .catch(error => {
            callback(new Error(error.message || '请求失败'));
        });
}

// 渲染用户信息卡片
function renderUserCard(userInfo) {
    const container = document.querySelector(BILIBILI_CONFIG.userContainer);
    if (!container) {
        console.error('用户信息容器未找到');
        return;
    }
    
    if (!userInfo) {
        container.innerHTML = '<div class="error">用户信息获取失败</div>';
        return;
    }
    
    container.innerHTML = `
        <div class="user-card">
            <div class="user-avatar">
                <img src="${userInfo.face}" alt="${userInfo.name}" onerror="this.src='default-avatar.jpg'">
            </div>
            <div class="user-details">
                <h3>${userInfo.name}</h3>
                <p class="user-sign">${userInfo.sign || '暂无签名'}</p>
                <div class="user-stats">
                    <span>粉丝: ${userInfo.follower}</span>
                    <span>关注: ${userInfo.following}</span>
                </div>
            </div>
        </div>
    `;
}

// 初始化用户信息
function initBilibiliUserInfo() {
    const container = document.querySelector(BILIBILI_CONFIG.userContainer);
    if (!container) {
        console.error('用户信息容器未找到');
        return;
    }
    
    // 显示加载状态
    container.innerHTML = '<div class="loading">加载用户信息中...</div>';
    
    // 使用JSONP获取用户信息
    fetchBilibiliUserInfo(BILIBILI_CONFIG.uid, (error, userInfo) => {
        if (error) {
            console.error('获取B站用户信息出错:', error);
            container.innerHTML = '<div class="error">加载用户信息失败</div>';
            return;
        }
        renderUserCard(userInfo);
    });
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    initBilibiliVideos();
    initBilibiliUserInfo();
});