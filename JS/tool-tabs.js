async function loadToolTabs(currentPage) {
    try {
        const [toolsResponse, gamesResponse] = await Promise.all([
            fetch('./JSON/tools.json'),
            fetch('./JSON/games.json')
        ]);

        if (!toolsResponse.ok || !gamesResponse.ok) {
            throw new Error('Failed to load data');
        }

        const tools = await toolsResponse.json();
        const games = await gamesResponse.json();

        const allItems = [...tools, ...games];
        renderTabs(allItems, currentPage);
    } catch (error) {
        console.error('加载标签数据失败:', error);
    }
}

function renderTabs(items, currentPage) {
    const tabsContainer = document.querySelector('.tabs');
    if (!tabsContainer) return;

    const tabsHTML = items.map(item => {
        const isActive = item.link === currentPage ? 'active' : '';
        return `<button class="tab-btn ${isActive}" onclick="location.href='${item.link}'">${item.icon} ${item.title}</button>`;
    }).join('');

    tabsContainer.innerHTML = tabsHTML;
}

function getCurrentPageName() {
    const path = window.location.pathname;
    const page = path.substring(path.lastIndexOf('/') + 1);
    return page;
}

document.addEventListener('DOMContentLoaded', () => {
    const currentPage = getCurrentPageName();
    loadToolTabs(currentPage);
});
