/**
 * 小工具&小游戏首页脚本
 * 对应页面: tools.html
 * 功能: 从 tools.json 和 games.json 加载数据,渲染工具卡片和游戏卡片。
 */

/**
 * 异步加载工具数据并渲染卡片
 * 从 JSON/tools.json 获取工具列表,失败时显示错误提示
 */
async function loadTools() {
   try {
       const response = await fetch('./JSON/tools.json');
       if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
       }
       const tools = await response.json();
       renderTools(tools);
   } catch (error) {
       console.error('加载工具数据失败:', error);
       // 加载失败: 在网格中显示错误提示,而不是空白
       const toolsGrid = document.querySelector('.tools-grid');
       if (toolsGrid) {
           toolsGrid.innerHTML = '<p class="error-message">加载工具数据失败，请刷新页面重试。</p>';
       }
   }
}

/**
 * 渲染工具卡片到 .tools-grid 容器
 * @param {Array} tools - 工具列表,每项含 {id, icon, title, description, link, buttonText}
 */
function renderTools(tools) {
   const toolsGrid = document.querySelector('.tools-grid');
   if (!toolsGrid) return;

   // 生成工具卡片 HTML
   toolsGrid.innerHTML = tools.map(tool => `
       <div class="tool-card" id="${tool.id}">
           <div class="tool-card-icon">${tool.icon}</div>
           <div class="tool-card-content">
               <h3>${tool.title}</h3>
               <p>${tool.description}</p>
               <a href="${tool.link}" class="tool-card-button">${tool.buttonText}</a>
           </div>
       </div>
   `).join('');
}

/**
 * 异步加载游戏数据并渲染卡片
 * 从 JSON/games.json 获取游戏列表,失败时显示错误提示
 */
async function loadGames() {
   try {
       const response = await fetch('./JSON/games.json');
       if (!response.ok) {
           throw new Error(`HTTP error! status: ${response.status}`);
       }
       const games = await response.json();
       renderGames(games);
   } catch (error) {
       console.error('加载游戏数据失败:', error);
       const gamesGrid = document.querySelector('.games-grid');
       if (gamesGrid) {
           gamesGrid.innerHTML = '<p class="error-message">加载游戏数据失败，请刷新页面重试。</p>';
       }
   }
}

/**
 * 渲染游戏卡片到 .games-grid 容器
 * @param {Array} games - 游戏列表,每项含 {id, icon, title, description, link, buttonText}
 */
function renderGames(games) {
   const gamesGrid = document.querySelector('.games-grid');
   if (!gamesGrid) return;

   // 生成游戏卡片 HTML
   gamesGrid.innerHTML = games.map(game => `
       <div class="game-card" id="${game.id}">
           <div class="tool-card-icon">${game.icon}</div>
           <div class="game-card-content">
               <h3>${game.title}</h3>
               <p>${game.description}</p>
               <a href="${game.link}" class="game-card-button">${game.buttonText}</a>
           </div>
       </div>
   `).join('');
}

// DOM 就绪后: 同时加载工具和游戏
document.addEventListener('DOMContentLoaded', () => {
   loadTools();
   loadGames();
});
