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
        const toolsGrid = document.querySelector('.tools-grid');
        if (toolsGrid) {
            toolsGrid.innerHTML = '<p class="error-message">加载工具数据失败，请刷新页面重试。</p>';
        }
    }
}

function renderTools(tools) {
    const toolsGrid = document.querySelector('.tools-grid');
    if (!toolsGrid) return;

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

function renderGames(games) {
    const gamesGrid = document.querySelector('.games-grid');
    if (!gamesGrid) return;

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

document.addEventListener('DOMContentLoaded', () => {
    loadTools();
    loadGames();
});
