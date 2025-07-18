/**
 * B站视频展示功能
 * 获取指定UID用户的最新视频并展示
 */

// 配置参数
const BILIBILI_CONFIG = {
    uid: '10824343',  // B站用户UID
    count: 5,         // 获取视频数量
    container: '#bilibili-videos' // 视频容器选择器
};

// 初始化函数
function initBilibiliVideos() {
    const container = document.querySelector(BILIBILI_CONFIG.container);
    if (!container) return;
    
    fetchLatestVideos();
}

// 获取最新视频
async function fetchLatestVideos() {
    try {
        // 使用B站API获取用户视频列表
        // 注意：由于跨域限制，这里使用jsonp方式请求
        // 或者考虑使用代理服务器转发请求
        
        // 方案1: 使用B站提供的jsonp API
        const script = document.createElement('script');
        script.src = `https://api.bilibili.com/x/space/arc/search?mid=${BILIBILI_CONFIG.uid}&ps=${BILIBILI_CONFIG.count}&jsonp=handleBilibiliResponse`;
        document.body.appendChild(script);
        
        // 方案2: 如果上述方法不可行，可以考虑使用第三方代理服务
        // const response = await fetch(`https://your-proxy-server.com/bilibili?uid=${BILIBILI_CONFIG.uid}&count=${BILIBILI_CONFIG.count}`);
        // const data = await response.json();
        // renderVideos(data.data.list.vlist);
    } catch (error) {
        console.error('获取B站视频失败:', error);
        showError('获取视频信息失败，请稍后再试');
    }
}

// JSONP回调函数
function handleBilibiliResponse(response) {
    if (response && response.data && response.data.list && response.data.list.vlist) {
        renderVideos(response.data.list.vlist);
    } else {
        showError('获取视频信息失败，请稍后再试');
    }
}

// 渲染视频列表
function renderVideos(videos) {
    const container = document.querySelector(BILIBILI_CONFIG.container);
    container.innerHTML = ''; // 清空加载提示
    
    if (!videos || videos.length === 0) {
        showError('暂无视频');
        return;
    }
    
    videos.forEach(video => {
        const videoCard = createVideoCard(video);
        container.appendChild(videoCard);
    });
}

// 创建视频卡片
function createVideoCard(video) {
    const card = document.createElement('div');
    card.className = 'video-card';
    card.onclick = () => window.open(`https://www.bilibili.com/video/${video.bvid}`, '_blank');
    
    // 格式化发布时间
    const publishDate = new Date(video.created * 1000).toLocaleDateString();
    
    card.innerHTML = `
        <div class="video-thumbnail">
            <img src="${video.pic}" alt="${video.title}">
        </div>
        <div class="video-info">
            <h3 class="video-title">${video.title}</h3>
            <div class="video-meta">
                <span>${video.play}播放</span>
                <span>${publishDate}</span>
            </div>
        </div>
    `;
    
    return card;
}

// 显示错误信息
function showError(message) {
    const container = document.querySelector(BILIBILI_CONFIG.container);
    container.innerHTML = `<div class="loading">${message}</div>`;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', initBilibiliVideos);