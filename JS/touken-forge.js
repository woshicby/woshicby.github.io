// 刀剑乱舞锻刀模拟器核心逻辑

// 日志功能
let lastLogMessage = '';
let duplicateLogCount = 0;

function logEvent(message) {
    const now = new Date();
    const timestamp = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(/\//g, '-');
    
    const logArea = document.getElementById('logArea');
    if (!logArea) {
        console.error('日志区域元素未找到');
        return;
    }
    
    // 调试信息：记录日志调用情况
    console.groupCollapsed(`[日志事件] ${message.substring(0, 30)}${message.length > 30 ? '...' : ''}`);
    console.log('当前消息:', message);
    console.log('上条消息:', lastLogMessage);
    console.log('重复计数:', duplicateLogCount);
    console.log('日志区域:', logArea);
    console.groupEnd();
    
    // 防止重复消息记录
    if (message === lastLogMessage) {
        duplicateLogCount++;
        console.warn(`[重复日志阻止] 消息重复 ${duplicateLogCount} 次: "${message.substring(0, 30)}${message.length > 30 ? '...' : ''}"`);
        return;
    }
    
    duplicateLogCount = 0;
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    logEntry.textContent = `[${timestamp}] ${message}`;
    logArea.appendChild(logEntry);
    
    // 自动滚动到底部
    logArea.scrollTop = logArea.scrollHeight;
    
    lastLogMessage = message;
}

// 刀剑数据
const swords = [
    // 普通刀剑
    { name: "短刀", image: "images/swords/short_sword.png", rarity: "common" },
    { name: "胁差", image: "images/swords/wakizashi.png", rarity: "common" },
    
    // 稀有刀剑
    { name: "打刀", image: "images/swords/uchigatana.png", rarity: "rare" },
    { name: "太刀", image: "images/swords/tachi.png", rarity: "rare" },
    
    // 非常稀有刀剑
    { name: "大太刀", image: "images/swords/odachi.png", rarity: "veryRare" },
    { name: "枪", image: "images/swords/spear.png", rarity: "veryRare" },
    
    // 传说刀剑
    { name: "三日月宗近", image: "images/swords/mikazuki.png", rarity: "legendary" },
    { name: "小狐丸", image: "images/swords/kogitsune.png", rarity: "legendary" }
];

// 资源限制
const resourceLimits = {
    charcoal: { min: 50, max: 999 },
    steel: { min: 50, max: 999 },
    coolant: { min: 50, max: 999 },
    whetstone: { min: 50, max: 999 }
};

// 全局变量
let collection = JSON.parse(localStorage.getItem('toukenCollection')) || {};
let forgeTimer = null;
let currentForgeTime = 0;
let currentResources = null; // 保存当前锻造使用的资源

// 游戏状态
let gameState = {
    charcoal: 500000,
    steel: 500000,
    coolant: 500000,
    whetstone: 500000
};

// 初始化资源状态
function initResources() {
    console.group('资源初始化');
    const defaultResources = {
        charcoal: 500000,
        steel: 500000,
        coolant: 500000,
        whetstone: 500000
    };

    try {
        const saved = localStorage.getItem('toukenResources');
        if (saved) {
            console.log('从本地存储加载资源...');
            const parsed = JSON.parse(saved);
            console.log('解析的资源数据:', parsed);
            
            // 确保所有资源属性都存在且有效
            gameState.charcoal = Number.isSafeInteger(parsed.charcoal) ? parsed.charcoal : defaultResources.charcoal;
            gameState.steel = Number.isSafeInteger(parsed.steel) ? parsed.steel : defaultResources.steel;
            gameState.coolant = Number.isSafeInteger(parsed.coolant) ? parsed.coolant : defaultResources.coolant;
            gameState.whetstone = Number.isSafeInteger(parsed.whetstone) ? parsed.whetstone : defaultResources.whetstone;
            
            console.log('验证后的资源状态:', gameState);
        } else {
            console.log('使用默认资源值');
            Object.assign(gameState, defaultResources);
            saveResources(); // 首次初始化时保存默认值
        }
    } catch (e) {
        console.error('加载资源失败:', e);
        Object.assign(gameState, defaultResources);
        saveResources(); // 出错时恢复默认值并保存
    }
    
    console.log('最终资源状态:', gameState);
    updateAllResourceDisplays();
    console.groupEnd();
}

function updateAllResourceDisplays() {
    updateResourceDisplay('charcoal');
    updateResourceDisplay('steel');
    updateResourceDisplay('coolant');
    updateResourceDisplay('whetstone');
}

// 保存资源到本地存储
function saveResources() {
    console.group('保存资源');
    try {
        const resourcesToSave = {
            charcoal: gameState.charcoal,
            steel: gameState.steel,
            coolant: gameState.coolant,
            whetstone: gameState.whetstone,
            lastUpdated: Date.now() // 添加时间戳
        };
        console.log('保存的资源数据:', resourcesToSave);
        
        localStorage.setItem('toukenResources', JSON.stringify(resourcesToSave));
        console.log('资源保存成功');
    } catch (e) {
        console.error('保存资源失败:', e);
        // 尝试使用更简单的保存方式
        try {
            localStorage.setItem('toukenResources', JSON.stringify({
                charcoal: gameState.charcoal,
                steel: gameState.steel,
                coolant: gameState.coolant,
                whetstone: gameState.whetstone
            }));
            console.log('简化保存成功');
        } catch (e) {
            console.error('简化保存也失败:', e);
        }
    }
    console.groupEnd();
}

// 更新资源显示
function updateResourceDisplay(resourceType) {
    // 映射资源类型到正确的元素ID
    const elementIdMap = {
        charcoal: 'charcoalValue',
        steel: 'steelValue',
        coolant: 'coolantValue',
        whetstone: 'whetstoneValue'
    };
    
    const elementId = elementIdMap[resourceType];
    const displayElement = document.getElementById(elementId);
    
    if (displayElement) {
        displayElement.textContent = gameState[resourceType];
    }
}

// DOM元素
const elements = {
    charcoalInput: document.getElementById('charcoalInput'),
    steelInput: document.getElementById('steelInput'),
    coolantInput: document.getElementById('coolantInput'),
    whetstoneInput: document.getElementById('whetstoneInput'),
    forgeButton: document.getElementById('forgeButton'),
    speedUpButton: document.getElementById('speedUpButton'),
    forgeStatus: document.getElementById('forgeStatus'),
    forgeTimer: document.getElementById('forgeTimer'),
    resultContainer: document.getElementById('resultContainer'),
    resultImage: document.getElementById('resultImage'),
    resultName: document.getElementById('resultName'),
    rarityDisplay: document.getElementById('resultRarity'),
    collectionCount: document.getElementById('collectionCount'),
    collectionList: document.getElementById('collectionList')
};



// 初始化
function init() {
    // 加载收藏
    loadCollection();
    updateCollectionCount();
    
    // 设置资源输入框默认值
    elements.charcoalInput.value = 50;
    elements.steelInput.value = 50;
    elements.coolantInput.value = 50;
    elements.whetstoneInput.value = 50;
    
    // 确保只绑定一次事件监听器
    if (elements.forgeButton) {
        // 完全移除所有事件监听器
        const oldButton = elements.forgeButton;
        const newButton = oldButton.cloneNode(true);
        oldButton.parentNode.replaceChild(newButton, oldButton);
        elements.forgeButton = newButton;
        
        // 添加唯一标识的事件监听器
        let handler = function(event) {
            event.stopImmediatePropagation();
            if (isForging) return;
            startForging();
        };
        
        // 先移除所有可能的监听器
        newButton.removeEventListener('click', handler);
        newButton.addEventListener('click', handler, {once: true});
    }
    
    // 为资源输入框添加blur事件处理（只在失去焦点时修正）
    elements.charcoalInput.addEventListener('blur', validateResourceInput);
    elements.steelInput.addEventListener('blur', validateResourceInput);
    elements.coolantInput.addEventListener('blur', validateResourceInput);
    elements.whetstoneInput.addEventListener('blur', validateResourceInput);
    
    // 移除不存在的元素引用
    delete elements.skipButton;
    delete elements.resourcesButton;
}

// 资源输入验证
function validateResourceInput(e) {
    const input = e.target;
    // 从类似"charcoalInput"的ID中提取"charcoal"
    const resourceType = input.id.replace('Input', '').toLowerCase();
    const limits = resourceLimits[resourceType];
    
    let value = parseInt(input.value) || 0;
    value = Math.max(limits.min, Math.min(limits.max, value));
    input.value = value;
}

// 全局锻造状态
let isForging = false;

// 开始锻造
function startForging() {
    console.group('开始锻造流程');
    
    // 安全获取锻造资源输入值
    const getResourceValue = (elementId) => {
        const element = document.getElementById(elementId);
        return element ? Math.max(0, parseInt(element.value) || 0) : 0;
    };

    const resources = {
        charcoal: getResourceValue('charcoalInput'),
        steel: getResourceValue('steelInput'),
        coolant: getResourceValue('coolantInput'),
        whetstone: getResourceValue('whetstoneInput')
    };
    
    // 只在第一次调用时记录日志
    if (!isForging) {
        logEvent(`开始第${Object.values(collection).reduce((sum, item) => sum + item.count, 0) + 1}次锻刀，使用资源：木炭 ${resources.charcoal}，玄铁 ${resources.steel}，冷却材料 ${resources.coolant}，砥石 ${resources.whetstone}`);
    }
    
    // 清除现有计时器
    if (forgeTimer) {
        console.log("清除现有计时器");
        clearInterval(forgeTimer);
        forgeTimer = null;
    }
    
    // 验证资源
    if (!validateResources(resources)) {
        console.groupEnd();
        return;
    }
    
    // 检查资源是否充足
    let deductionSuccessful = true;
    console.group('资源验证');
    for (const [resource, amount] of Object.entries(resources)) {
        console.log(`验证 ${resource}: 当前=${gameState[resource]}, 需要=${amount}`);
        if (!gameState[resource] || gameState[resource] < amount) {
            console.error(`${resource}资源不足`);
            deductionSuccessful = false;
            break;
        }
    }
    console.groupEnd();
    
    if (!deductionSuccessful) {
        alert("资源不足！");
        console.groupEnd();
        return;
    }
    
    // 扣除资源
    console.group('扣除资源');
    for (const [resource, amount] of Object.entries(resources)) {
        gameState[resource] -= amount;
        console.log(`扣除 ${resource}: -${amount}, 剩余 ${gameState[resource]}`);
        updateResourceDisplay(resource);
    }
    saveResources(); // 立即保存
    console.groupEnd();
    
    // 保存当前资源
    currentResources = resources;
    
    // 更新UI状态
    elements.forgeButton.style.display = "none";
    elements.speedUpButton.style.display = "block";
    elements.speedUpButton.onclick = completeForging;
    elements.forgeStatus.textContent = "锻造中...";
    elements.forgeTimer.style.display = "block";
    
    // 设置锻造时间 (10-30秒)
    currentForgeTime = Math.floor(Math.random() * 20) + 10;
    console.log(`设置锻造时间: ${currentForgeTime}秒`);
    elements.forgeTimer.textContent = formatTime(currentForgeTime);
    
    // 开始倒计时
    forgeTimer = setInterval(() => {
        if (currentForgeTime > 0) {
            currentForgeTime--;
            elements.forgeTimer.textContent = formatTime(currentForgeTime);
        } else {
            clearInterval(forgeTimer);
            completeForging();
        }
    }, 1000);
    
    console.log("锻造流程启动成功");
    console.groupEnd();
    return true;
}

// 完成锻造
function completeForging() {
    console.log("开始完成锻造流程");
    
    // 清除计时器
    if (forgeTimer) {
        clearInterval(forgeTimer);
        forgeTimer = null;
    }

    // 重置状态变量
    isForging = false;
    currentForgeTime = 0;
    
    // 使用当前锻造资源计算稀有度概率
    const totalResources = currentResources.charcoal + currentResources.steel + 
                         currentResources.coolant + currentResources.whetstone;
    const rarityRoll = Math.random() * 100;
    
    let targetRarity;
    if (rarityRoll < 5 && totalResources > 1500) {
        targetRarity = "legendary";
    } else if (rarityRoll < 20 && totalResources > 1000) {
        targetRarity = "veryRare";
    } else if (rarityRoll < 50 && totalResources > 700) {
        targetRarity = "rare";
    } else {
        targetRarity = "common";
    }
    
    // 从对应稀有度中随机选择刀剑
    const availableSwords = swords.filter(sword => sword.rarity === targetRarity);
    const result = availableSwords[Math.floor(Math.random() * availableSwords.length)];
    
    // 显示结果
    showResult(result);
    
    // 添加到收藏
    addToCollection(result);
    
    // 记录锻造完成日志
    const rarityName = getRarityName(result.rarity);
    logEvent(`锻刀完成，获得${rarityName}刀剑：${result.name}`);
    
    // 完全重置UI状态
    elements.speedUpButton.style.display = "none";
    elements.forgeButton.style.display = "block";    
    elements.forgeButton.onclick = startForging;
    elements.forgeButton.disabled = false;
    elements.forgeStatus.textContent = "准备锻造";
    elements.forgeTimer.style.display = "none";
    elements.forgeTimer.textContent = "";
    console.log("锻造完成，所有状态已重置");
    // 安全地记录状态
    try {
        console.log("当前状态:", {
            isForging,
            forgeTimer,
            currentForgeTime,
            buttonText: elements.forgeButton?.textContent || 'undefined',
            timerDisplay: elements.forgeTimer?.style?.display || 'undefined'
        });
    } catch (err) {
        console.warn('状态记录失败:', err.message);
    }
}

// 显示结果
function showResult(sword) {
    elements.resultImage.src = sword.image;
    elements.resultImage.alt = sword.name;
    elements.resultName.textContent = sword.name;
    elements.rarityDisplay.textContent = getRarityName(sword.rarity);
    elements.rarityDisplay.className = `rarity ${sword.rarity}`;
    elements.resultContainer.style.display = "flex";
}

// 添加收藏
function addToCollection(sword) {
    if (!collection[sword.name]) {
        collection[sword.name] = {
            count: 1,
            image: sword.image,
            rarity: sword.rarity
        };
    } else {
        collection[sword.name].count++;
    }
    
    // 保存到本地存储
    localStorage.setItem('toukenCollection', JSON.stringify(collection));
    
    // 更新UI
    updateCollection();
    updateCollectionCount();
}

// 加载收藏
function loadCollection() {
    const collectionContainer = elements.collectionList;
    collectionContainer.innerHTML = '';
    
    for (const [name, data] of Object.entries(collection)) {
        const item = document.createElement('div');
        item.className = 'collection-item';
        item.innerHTML = `
            <img src="${data.image}" alt="${name}" class="collection-item-image">
            <div class="collection-item-name">${name}</div>
            <div class="collection-item-count">x${data.count}</div>
            <button class="delete-sword-btn" data-sword-name="${name}">刀解</button>
        `;
        collectionContainer.appendChild(item);
        
        // 添加删除按钮事件
        const deleteBtn = item.querySelector('.delete-sword-btn');
        deleteBtn.addEventListener('click', () => deleteSword(name));
    }
}

function deleteSword(swordName) {
    console.group('删除刀剑');
    if (!confirm(`确定要删除 ${swordName} 吗？`)) {
        console.log('用户取消删除');
        console.groupEnd();
        return;
    }
    
    if (collection[swordName]) {
        // 随机返还资源 (0-999)
        const returnedResources = {
            charcoal: Math.floor(Math.random() * 1000),
            steel: Math.floor(Math.random() * 1000),
            coolant: Math.floor(Math.random() * 1000),
            whetstone: Math.floor(Math.random() * 1000)
        };
        
        console.log('将返还资源:', returnedResources);
        console.log('删除前的资源状态:', gameState);
        
        // 更新资源
        gameState.charcoal += returnedResources.charcoal;
        gameState.steel += returnedResources.steel;
        gameState.coolant += returnedResources.coolant;
        gameState.whetstone += returnedResources.whetstone;
        
        // 更新资源显示
        updateResourceDisplay('charcoal');
        updateResourceDisplay('steel');
        updateResourceDisplay('coolant');
        updateResourceDisplay('whetstone');
        
        // 从集合中移除
        if (collection[swordName].count > 1) {
            collection[swordName].count--;
        } else {
            delete collection[swordName];
        }
        
        // 保存到本地存储
        localStorage.setItem('toukenCollection', JSON.stringify(collection));
        saveResources(); // 新增：立即保存资源状态
        
        console.log('删除后的资源状态:', gameState);
        console.log('保存后的本地存储:', localStorage.getItem('toukenResources'));
        
        // 更新UI
        loadCollection();
        updateCollectionCount();
        
        console.log(`已删除 ${swordName}，返还资源：木炭 ${returnedResources.charcoal}，玄铁 ${returnedResources.steel}，冷却材料 ${returnedResources.coolant}，砥石 ${returnedResources.whetstone}`);
        logEvent(`删除刀剑：${swordName}，返还资源：木炭 ${returnedResources.charcoal}，玄铁 ${returnedResources.steel}，冷却材料 ${returnedResources.coolant}，砥石 ${returnedResources.whetstone}`);
    } else {
        console.warn(`刀剑 ${swordName} 不存在于收藏中`);
    }
    console.groupEnd();
}

// 更新收藏计数
function updateCollectionCount() {
    const total = Object.values(collection).reduce((sum, item) => sum + item.count, 0);
    elements.collectionCount.textContent = total;
}

// 更新收藏显示
function updateCollection() {
    loadCollection();
}

// 重置资源
function resetResources() {
    elements.charcoalInput.value = resourceLimits.charcoal.min;
    elements.steelInput.value = resourceLimits.steel.min;
    elements.coolantInput.value = resourceLimits.coolant.min;
    elements.whetstoneInput.value = resourceLimits.whetstone.min;
}

// 验证资源
function validateResources(resources) {
    for (const [type, value] of Object.entries(resources)) {
        const limits = resourceLimits[type];
        if (value < limits.min || value > limits.max) {
            alert(`${type} 资源必须在 ${limits.min}-${limits.max} 之间`);
            return false;
        }
    }
    return true;
}

// 格式化时间
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `剩余: ${mins}分${secs < 10 ? '0' : ''}${secs}秒`;
}

// 获取稀有度名称
function getRarityName(rarity) {
    switch(rarity) {
        case 'common': return '普通';
        case 'rare': return '稀有';
        case 'veryRare': return '非常稀有';
        case 'legendary': return '传说';
        default: return '未知';
    }
}

// 启动应用
document.addEventListener('DOMContentLoaded', function() {
    console.group('应用初始化');
    try {
        // 先初始化资源状态
        initResources();
        
        // 然后初始化UI和其他状态
        init();
        
        console.log('应用初始化完成');
    } catch (e) {
        console.error('初始化失败:', e);
        // 恢复默认状态
        gameState = {
            charcoal: 500000,
            steel: 500000,
            coolant: 500000,
            whetstone: 500000
        };
        saveResources();
        updateAllResourceDisplays();
    }
    console.groupEnd();
    
    // 调试：立即检查资源状态
    setTimeout(() => {
        console.log('初始化后资源验证:', JSON.stringify(gameState));
        const saved = localStorage.getItem('toukenResources');
        console.log('本地存储当前值:', saved);
    }, 1000);
});