/**
 * 工具页标签导航(域公共组件)
 *
 * 职责: 在小工具&小游戏页面顶部生成工具/游戏标签栏,
 *       从 tools.json + games.json 加载全部工具,当前页面高亮对应标签。
 *
 * 加载: 工具类页面(tools.html 及各个工具页)在 HTML 中引用本文件。
 */

/**
 * 异步加载工具与游戏数据并渲染标签
 * @param {string} currentPage - 当前页面文件名(如 dice-tool.html),用于高亮
 */
async function loadToolTabs(currentPage) {
   try {
       // 并行加载工具和游戏数据(互不依赖,提升加载速度)
       const [toolsResponse, gamesResponse] = await Promise.all([
           fetch('./JSON/tools.json'),
           fetch('./JSON/games.json')
       ]);

       // 任一请求失败则抛出错误,进入 catch
       if (!toolsResponse.ok || !gamesResponse.ok) {
           throw new Error('Failed to load data');
       }

       // 解析 JSON 数据
       const tools = await toolsResponse.json();
       const games = await gamesResponse.json();

       // 合并工具和游戏为统一的标签项列表
       const allItems = [...tools, ...games];
       renderTabs(allItems, currentPage);
   } catch (error) {
       // 加载失败: 记录错误,页面其余功能不受影响
       console.error('加载标签数据失败:', error);
   }
}

/**
 * 渲染标签栏
 * 将工具/游戏列表渲染为按钮,当前页面所在标签高亮
 * @param {Array} items - 工具/游戏项数组,每项含 {link, icon, title}
 * @param {string} currentPage - 当前页面文件名
 */
function renderTabs(items, currentPage) {
   // 标签容器: 页面中 <div class="tabs"> 元素
   const tabsContainer = document.querySelector('.tabs');
   // 容器不存在(非工具页)则跳过
   if (!tabsContainer) return;

   // 生成标签按钮 HTML: 点击跳转到对应工具页面,当前页加 active 类
   const tabsHTML = items.map(item => {
       const isActive = item.link === currentPage ? 'active' : '';
       return `<button class="tab-btn ${isActive}" onclick="location.href='${item.link}'">${item.icon} ${item.title}</button>`;
   }).join('');

   // 写入容器
   tabsContainer.innerHTML = tabsHTML;
}

/**
 * 获取当前页面文件名(用于标签高亮判断)
 * @returns {string} 如 'dice-tool.html'
 */
function getCurrentPageName() {
   const path = window.location.pathname;
   const page = path.substring(path.lastIndexOf('/') + 1);
   return page;
}

// DOM 就绪后: 获取当前页面并加载标签
document.addEventListener('DOMContentLoaded', () => {
   const currentPage = getCurrentPageName();
   loadToolTabs(currentPage);
});
