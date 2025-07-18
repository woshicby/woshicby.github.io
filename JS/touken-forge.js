/**
 * 刀剑乱舞锻刀模拟器
 * 模拟《刀剑乱舞online》中的锻刀功能
 */

// 刀剑数据库 - 包含名称、稀有度和获取概率
const swordDatabase = {
    // 稀有度1（普通）
    common: [
        { id: "tantou_1", name: "平野藤四郎", imageUrl: "../images/touken/default_sword.jpg" },
        { id: "tantou_2", name: "前田藤四郎", imageUrl: "../images/touken/default_sword.jpg" },
        { id: "wakizashi_1", name: "厚藤四郎", imageUrl: "../images/touken/default_sword.jpg" },
        { id: "wakizashi_2", name: "博多藤四郎", imageUrl: "../images/touken/default_sword.jpg" },
    ],
    // 稀有度2（稀有）
    rare: [
        { id: "tachi_1", name: "加州清光", imageUrl: "../images/touken/default_sword.jpg" },
        { id: "tachi_2", name: "大和守安定", imageUrl: "../images/touken/default_sword.jpg" },
        { id: "uchigatana_1", name: "歌仙兼定", imageUrl: "../images/touken/default_sword.jpg" },
        { id: "uchigatana_2", name: "堀川国広", imageUrl: "../images/touken/default_sword.jpg" },
    ],
    // 稀有度3（非常稀有）
    veryRare: [
        { id: "tachi_3", name: "三日月宗近", imageUrl: "../images/touken/default_sword.jpg" },
        { id: "tachi_4", name: "小狐丸", imageUrl: "../images/touken/default_sword.jpg" },
        { id: "uchigatana_3", name: "鹤丸国永", imageUrl: "../images/touken/default_sword.jpg" },
        { id: "uchigatana_4", name: "一期一振", imageUrl: "../images/touken/default_sword.jpg" },
    ],
    // 稀有度4（传说）
    legendary: [
        { id: "tachi_5", name: "大般若长光", imageUrl: "../images/touken/default_sword.jpg" },
        { id: "tachi_6", name: "数珠丸恒次", imageUrl: "../images/touken/default_sword.jpg" },
    ]
};

// 默认图片，用于未获取到刀剑图片时显示
const defaultSwordImage = "../images/touken/default_sword.jpg";

// 游戏状态
let gameState = {
    resources: {
        charcoal: 500, // 木炭
        steel: 500,    // 玄铁
        coolant: 500,  // 冷却材料
        whetstone: 500 // 砥石
    },
    forging: false,    // 是否正在锻造
    forgeTime: 0,      // 锻造剩余时间（秒）
    collection: [],    // 已收集的刀剑
    recipe: {          // 当前配方
        charcoal: 0,
        steel: 0,
        coolant: 0,
        whetstone: 0
    }
};

// DOM元素
let elements = {};

// 当DOM加载完成后初始化游戏
document.addEventListener('DOMContentLoaded', function() {
    initGame();
});

// 初始化游戏
function initGame() {
    // 获取DOM元素
    elements = {
        charcoalInput: document.getElementById('charcoalInput'),
        steelInput: document.getElementById('steelInput'),
        coolantInput: document.getElementById('coolantInput'),
        whetstoneInput: document.getElementById('whetstoneInput'),
        
        charcoalValue: document.getElementById('charcoalValue'),
        steelValue: document.getElementById('steelValue'),
        coolantValue: document.getElementById('coolantValue'),
        whetstoneValue: document.getElementById('whetstoneValue'),
        
        forgeButton: document.getElementById('forgeButton'),
        forgeStatus: document.getElementById('forgeStatus'),
        forgeTimer: document.getElementById('forgeTimer'),
        
        resultContainer: document.getElementById('resultContainer'),
        resultImage: document.getElementById('resultImage'),
        resultName: document.getElementById('resultName'),
        resultRarity: document.getElementById('resultRarity'),
        
        collectionCount: document.getElementById('collectionCount'),
        collectionList: document.getElementById('collectionList'),
        
        resourcesButton: document.getElementById('resourcesButton')
    };
    
    // 设置初始资源显示
    updateResourceDisplay();
    
    // 添加事件监听器
    elements.forgeButton.addEventListener('click', startForging);
    elements.resourcesButton.addEventListener('click', addResources);
    
    // 设置输入限制
    setupInputLimits();
    
    // 加载收藏
    loadCollection();
    
    // 显示收藏数量
    updateCollectionDisplay();
}

// 设置输入限制
function setupInputLimits() {
    const inputs = [
        elements.charcoalInput,
        elements.steelInput,
        elements.coolantInput,
        elements.whetstoneInput
    ];
    
    inputs.forEach(input => {
        // 限制输入范围为0-999
        input.addEventListener('input', function() {
            let value = parseInt(this.value) || 0;
            if (value < 0) value = 0;
            if (value > 999) value = 999;
            this.value = value;
            
            // 检查是否超过可用资源
            const resourceType = this.id.replace('Input', '');
            const availableResource = gameState.resources[resourceType];
            if (value > availableResource) {
                this.value = availableResource;
            }
        });
    });
}

// 更新资源显示
function updateResourceDisplay() {
    elements.charcoalValue.textContent = gameState.resources.charcoal;
    elements.steelValue.textContent = gameState.resources.steel;
    elements.coolantValue.textContent = gameState.resources.coolant;
    elements.whetstoneValue.textContent = gameState.resources.whetstone;
}

// 开始锻造
function startForging() {
    if (gameState.forging) return;
    
    // 获取输入的资源量
    const recipe = {
        charcoal: parseInt(elements.charcoalInput.value) || 0,
        steel: parseInt(elements.steelInput.value) || 0,
        coolant: parseInt(elements.coolantInput.value) || 0,
        whetstone: parseInt(elements.whetstoneInput.value) || 0
    };
    
    // 检查是否有足够的资源
    for (const [resource, amount] of Object.entries(recipe)) {
        if (gameState.resources[resource] < amount) {
            alert(`资源不足：${getResourceName(resource)}`);
            return;
        }
    }
    
    // 检查是否至少使用了一种资源
    const totalResources = Object.values(recipe).reduce((sum, val) => sum + val, 0);
    if (totalResources === 0) {
        alert("请至少使用一种资源进行锻造");
        return;
    }
    
    // 扣除资源
    for (const [resource, amount] of Object.entries(recipe)) {
        gameState.resources[resource] -= amount;
    }
    
    // 更新资源显示
    updateResourceDisplay();
    
    // 保存当前配方
    gameState.recipe = recipe;
    
    // 设置锻造状态
    gameState.forging = true;
    gameState.forgeTime = calculateForgeTime(recipe);
    
    // 更新UI
    elements.forgeButton.disabled = true;
    elements.forgeStatus.textContent = "锻造中...";
    elements.forgeTimer.textContent = formatTime(gameState.forgeTime);
    elements.forgeTimer.style.display = "block";
    
    // 清空输入框
    elements.charcoalInput.value = "";
    elements.steelInput.value = "";
    elements.coolantInput.value = "";
    elements.whetstoneInput.value = "";
    
    // 开始倒计时
    const timerInterval = setInterval(() => {
        gameState.forgeTime--;
        elements.forgeTimer.textContent = formatTime(gameState.forgeTime);
        
        if (gameState.forgeTime <= 0) {
            clearInterval(timerInterval);
            completeForgingProcess();
        }
    }, 1000);
}

// 计算锻造时间（秒）
function calculateForgeTime(recipe) {
    // 基础时间为30秒
    let baseTime = 30;
    
    // 根据资源总量增加时间
    const totalResources = Object.values(recipe).reduce((sum, val) => sum + val, 0);
    const additionalTime = Math.floor(totalResources / 100) * 10;
    
    return baseTime + additionalTime;
}

// 完成锻造过程
function completeForgingProcess() {
    // 重置锻造状态
    gameState.forging = false;
    
    // 更新UI
    elements.forgeButton.disabled = false;
    elements.forgeStatus.textContent = "锻造完成！";
    elements.forgeTimer.style.display = "none";
    
    // 根据配方确定结果
    const result = determineForgeResult(gameState.recipe);
    
    // 显示结果
    displayForgeResult(result);
    
    // 添加到收藏
    addToCollection(result);
}

// 根据配方确定锻造结果
function determineForgeResult(recipe) {
    // 计算总资源量
    const totalResources = Object.values(recipe).reduce((sum, val) => sum + val, 0);
    
    // 计算各资源的比例
    const charcoalRatio = recipe.charcoal / totalResources;
    const steelRatio = recipe.steel / totalResources;
    const coolantRatio = recipe.coolant / totalResources;
    const whetstoneRatio = recipe.whetstone / totalResources;
    
    // 计算稀有度概率
    let rarityProbabilities = {
        common: 0.6,     // 60%概率获得普通刀剑
        rare: 0.3,       // 30%概率获得稀有刀剑
        veryRare: 0.09,  // 9%概率获得非常稀有刀剑
        legendary: 0.01  // 1%概率获得传说刀剑
    };
    
    // 根据资源总量和比例调整概率
    if (totalResources > 300) {
        // 资源总量大于300时，提高稀有度概率
        rarityProbabilities.common -= 0.1;
        rarityProbabilities.rare += 0.05;
        rarityProbabilities.veryRare += 0.04;
        rarityProbabilities.legendary += 0.01;
    }
    
    if (steelRatio > 0.5) {
        // 玄铁比例大于50%时，提高稀有度概率
        rarityProbabilities.common -= 0.1;
        rarityProbabilities.rare += 0.05;
        rarityProbabilities.veryRare += 0.04;
        rarityProbabilities.legendary += 0.01;
    }
    
    if (whetstoneRatio > 0.3) {
        // 砥石比例大于30%时，提高传说刀剑概率
        rarityProbabilities.common -= 0.05;
        rarityProbabilities.legendary += 0.05;
    }
    
    // 确保概率总和为1
    const totalProbability = Object.values(rarityProbabilities).reduce((sum, val) => sum + val, 0);
    for (const rarity in rarityProbabilities) {
        rarityProbabilities[rarity] /= totalProbability;
    }
    
    // 随机确定稀有度
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedRarity = "common";
    
    for (const [rarity, probability] of Object.entries(rarityProbabilities)) {
        cumulativeProbability += probability;
        if (random <= cumulativeProbability) {
            selectedRarity = rarity;
            break;
        }
    }
    
    // 从选定稀有度中随机选择一把刀剑
    const swordsOfRarity = swordDatabase[selectedRarity];
    const selectedSword = swordsOfRarity[Math.floor(Math.random() * swordsOfRarity.length)];
    
    // 返回结果
    return {
        ...selectedSword,
        rarity: selectedRarity
    };
}

// 显示锻造结果
function displayForgeResult(result) {
    // 显示结果容器
    elements.resultContainer.style.display = "block";
    
    // 设置图片 - 先尝试加载指定图片，失败时使用默认图片
    const img = new Image();
    img.onerror = function() {
        elements.resultImage.src = defaultSwordImage;
    };
    img.onload = function() {
        elements.resultImage.src = result.imageUrl;
    };
    img.src = result.imageUrl;
    
    elements.resultImage.alt = result.name;
    
    // 设置名称
    elements.resultName.textContent = result.name;
    
    // 设置稀有度
    elements.resultRarity.textContent = getRarityText(result.rarity);
    elements.resultRarity.className = `rarity ${result.rarity}`;
}

// 添加到收藏
function addToCollection(sword) {
    // 检查是否已经收藏
    const existingSword = gameState.collection.find(item => item.id === sword.id);
    
    if (existingSword) {
        // 如果已经收藏，增加数量
        existingSword.count = (existingSword.count || 1) + 1;
    } else {
        // 如果未收藏，添加到收藏
        gameState.collection.push({
            ...sword,
            count: 1
        });
    }
    
    // 保存收藏
    saveCollection();
    
    // 更新收藏