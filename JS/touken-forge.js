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

// 刀剑数据 - 按刀种分类
// 根据稀有度设置基础锻造时间（秒）
const rarityForgeTimes = {
    common: 10,
    rare: 45,
    veryRare: 88,
    legendary: 630
};

const swordTypes = {
    short: {
        name: "短刀",
        swords: [
            {name: "今剑", image: "images/swords/imakiri.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "平野藤四郎", image: "images/swords/hirano.png", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "厚藤四郎", image: "images/swords/atsushi.png", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "后藤藤四郎", image: "images/swords/gotou.png", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "信浓藤四郎", image: "images/swords/shinsaku.png", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "秋田藤四郎", image: "images/swords/akita.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "前田藤四郎", image: "images/swords/maeda.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "包丁藤四郎", image: "images/swords/houchou.png", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "博多藤四郎", image: "images/swords/hakata.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "乱藤四郎", image: "images/swords/midare.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "药研藤四郎", image: "images/swords/yagen.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "爱染国俊", image: "images/swords/aizen.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "太鼓钟贞宗", image: "images/swords/taikou.png", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "小夜左文字", image: "images/swords/sayo.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "不动行光", image: "images/swords/fudou.png", rarity: "legendary", forgeTime: rarityForgeTimes.legendary},
            {name: "毛利藤四郎", image: "images/swords/mouri.png", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "谦信景光", image: "images/swords/kenshin.png", rarity: "legendary", forgeTime: rarityForgeTimes.legendary}
        ],
        baseProbability: 0.4
    },
    wakizashi: {
        name: "胁差",
        swords: [
            {name: "堀川国广", image: "images/swords/horikawa.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "浦岛虎彻", image: "images/swords/urashima.png", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "鲶尾藤四郎", image: "images/swords/namazuo.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "骨喰藤四郎", image: "images/swords/honebami.png", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "笑面青江", image: "images/swords/kogitsune.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "物吉贞宗", image: "images/swords/monoyoshi.png", rarity: "legendary", forgeTime: rarityForgeTimes.legendary}
        ],
        baseProbability: 0.2
    },
    uchigatana: {
        name: "打刀",
        swords: [
            {name: "鸣狐", image: "images/swords/narukami.png", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "千子村正", image: "images/swords/sengoku.png", rarity: "legendary", forgeTime: rarityForgeTimes.legendary},
            {name: "龟甲贞宗", image: "images/swords/kikkou.png", rarity: "legendary", forgeTime: rarityForgeTimes.legendary},
            {name: "宗三左文字", image: "images/swords/souza.png", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "加州清光", image: "images/swords/kashuu.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "大和守安定", image: "images/swords/yamatonokami.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "歌仙兼定", image: "images/swords/kasen.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "和泉守兼定", image: "images/swords/izuminokami.png", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "陆奥守吉行", image: "images/swords/mutsunokami.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "山姥切国广", image: "images/swords/yamanbagiri.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "蜂须贺虎彻", image: "images/swords/hachisuka.png", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "长曾祢虎彻", image: "images/swords/nagasamune.png", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "大俱利伽罗", image: "images/swords/kurikara.png", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "压切长谷部", image: "images/swords/hasebe.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "同田贯正国", image: "images/swords/toudan.png", rarity: "rare", forgeTime: rarityForgeTimes.rare}
        ],
        baseProbability: 0.15
    },
    tachi: {
        name: "太刀",
        swords: [
            {name: "三日月宗近", image: "images/swords/mikazuki.png", rarity: "legendary", forgeTime: rarityForgeTimes.legendary},
            {name: "小狐丸", image: "images/swords/kogitsune.png", rarity: "legendary", forgeTime: rarityForgeTimes.legendary},
            {name: "数珠丸恒次", image: "images/swords/juzumaru.png", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "一期一振", image: "images/swords/ichigo.png", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "莺丸", image: "images/swords/uguisu.png", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "明石国行", image: "images/swords/akashi.png", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "烛台切光忠", image: "images/swords/shokudaikiri.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "小龙景光", image: "images/swords/kotetsu.png", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "江雪左文字", image: "images/swords/kousetsu.png", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "山伏国广", image: "images/swords/yamabushi.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "髭切", image: "images/swords/hizamaru.png", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "膝丸", image: "images/swords/hizamaru.png", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "狮子王", image: "images/swords/shishio.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "小乌丸", image: "images/swords/karasu.png", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "鹤丸国永", image: "images/swords/tsurumaru.png", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "小豆长光", image: "images/swords/azuki.png", rarity: "legendary", forgeTime: rarityForgeTimes.legendary}
        ],
        baseProbability: 0.1
    },
    odachi: {
        name: "大太刀",
        swords: [
            {name: "太郎太刀", image: "images/swords/taroutachi.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "次郎太刀", image: "images/swords/jiroutachi.png", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "萤丸", image: "images/swords/hotarumaru.png", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "石切丸", image: "images/swords/ishikiri.png", rarity: "rare", forgeTime: rarityForgeTimes.rare}
        ],
        baseProbability: 0.05
    },
    naginata: {
        name: "薙刀",
        swords: [
            {name: "岩融", image: "images/swords/iwatoushi.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "静形薙刀", image: "images/swords/shizukagata.png", rarity: "legendary", forgeTime: rarityForgeTimes.legendary},
            {name: "巴形薙刀", image: "images/swords/tomoe.png", rarity: "rarey", forgeTime: rarityForgeTimes.rare}
        ],
        baseProbability: 0.05
    },
    spear: {
        name: "枪",
        swords: [
            {name: "日本号", image: "images/swords/nihongou.png", rarity: "legendary", forgeTime: rarityForgeTimes.legendary},
            {name: "蜻蛉切", image: "images/swords/tonbokiri.png", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "御手杵", image: "images/swords/otegine.png", rarity: "rare", forgeTime: rarityForgeTimes.rare}
        ],
        baseProbability: 0.05
    },
    ken: {
        name: "剑",
        swords: [
            {name: "白山吉光", image: "images/swords/nihongou.png", rarity: "legendary", forgeTime: rarityForgeTimes.legendary},
        ],
        baseProbability: 0.01
    }
};

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

// 统计数据
let stats = {
    forgeCount: 0,
    deleteCount: 0
};

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



// 初始化统计数据
function initStats() {
    const savedStats = localStorage.getItem('toukenStats');
    if (savedStats) {
        stats = JSON.parse(savedStats);
    }
    updateStatsDisplay();
}

// 更新统计显示
function updateStatsDisplay() {
    const forgeCountElement = document.getElementById('forgeCount');
    const deleteCountElement = document.getElementById('deleteCount');
    
    if (forgeCountElement) forgeCountElement.textContent = stats.forgeCount;
    if (deleteCountElement) deleteCountElement.textContent = stats.deleteCount;
}

// 重置统计数据
function resetStats() {
    stats.forgeCount = 0;
    stats.deleteCount = 0;
    localStorage.setItem('toukenStats', JSON.stringify(stats));
    updateStatsDisplay();
}

// 初始化
function init() {
    // 加载收藏和统计
    loadCollection();
    updateCollectionCount();
    initStats();
    
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
    
    // 增加锻刀计数
    stats.forgeCount++;
    localStorage.setItem('toukenStats', JSON.stringify(stats));
    updateStatsDisplay();
    // 输出日志
    logEvent(`开始第${stats.forgeCount}次锻刀，使用资源：木炭 ${resources.charcoal}，玉刚 ${resources.steel}，冷却材 ${resources.coolant}，砥石 ${resources.whetstone}`);
    
    // 保存当前资源
    currentResources = resources;
    
    // 1. 计算各刀种概率 - 根据官方公示概率表
    const typeProbabilities = {};
    const {charcoal, steel, coolant, whetstone} = currentResources;
    
    // 1. 检查是否符合官方公式
    let isOfficialFormula = false;
    const totalResources = charcoal + steel + coolant + whetstone;
    
    // 官方公式判断逻辑保持不变
    if (charcoal < 100 && steel < 100 && coolant < 100 && whetstone < 100) {
        // all50-99 短刀100%
        typeProbabilities.short = 1.0;
        typeProbabilities.wakizashi = 0;
        typeProbabilities.uchigatana = 0;
        typeProbabilities.tachi = 0;
        typeProbabilities.odachi = 0;
        typeProbabilities.naginata = 0;
        typeProbabilities.spear = 0;
        typeProbabilities.ken = 0;
    } else if (charcoal >= 500 && steel >= 600 && coolant >= 500 && whetstone >= 350) {
        // 大太刀公式
        typeProbabilities.short = 0;
        typeProbabilities.wakizashi = 0;
        typeProbabilities.uchigatana = 0.705;
        typeProbabilities.tachi = 0.091;
        typeProbabilities.odachi = 0.204;
        typeProbabilities.naginata = 0;
        typeProbabilities.spear = 0;
        typeProbabilities.ken = 0.001;
    } else if (charcoal >= 400 && steel >= 500 && coolant >= 700 && whetstone >= 700) {
        // 薙刀公式
        typeProbabilities.short = 0;
        typeProbabilities.wakizashi = 0;
        typeProbabilities.uchigatana = 0.741;
        typeProbabilities.tachi = 0.178;
        typeProbabilities.odachi = 0;
        typeProbabilities.naginata = 0.081;
        typeProbabilities.spear = 0;
        typeProbabilities.ken = 0.001;
    } else if (charcoal >= 400 && steel >= 50 && coolant >= 500 && whetstone >= 500) {
        // 枪公式
        typeProbabilities.short = 0.283;
        typeProbabilities.wakizashi = 0.159;
        typeProbabilities.uchigatana = 0.384;
        typeProbabilities.tachi = 0.072;
        typeProbabilities.odachi = 0;
        typeProbabilities.naginata = 0;
        typeProbabilities.spear = 0.102;
        typeProbabilities.ken = 0.001;
    } else if (charcoal >= 300 && steel >= 400 && coolant >= 300 && whetstone >= 350) {
        // 太刀公式(无短刀)
        typeProbabilities.short = 0;
        typeProbabilities.wakizashi = 0.237;
        typeProbabilities.uchigatana = 0.661;
        typeProbabilities.tachi = 0.102;
        typeProbabilities.odachi = 0;
        typeProbabilities.naginata = 0;
        typeProbabilities.spear = 0;
        typeProbabilities.ken = 0.001;
    } else if (charcoal >= 300 && steel >= 350 && coolant >= 300 && whetstone >= 350) {
        // 太刀公式(有短刀)
        typeProbabilities.short = 0.338;
        typeProbabilities.wakizashi = 0.172;
        typeProbabilities.uchigatana = 0.415;
        typeProbabilities.tachi = 0.075;
        typeProbabilities.odachi = 0;
        typeProbabilities.naginata = 0;
        typeProbabilities.spear = 0;
        typeProbabilities.ken = 0.001;
    } else if (charcoal >= 100 && steel >= 200 && coolant >= 200 && whetstone >= 100) {
        // 打刀公式
        typeProbabilities.short = 0.399;
        typeProbabilities.wakizashi = 0.194;
        typeProbabilities.uchigatana = 0.407;
        typeProbabilities.tachi = 0;
        typeProbabilities.odachi = 0;
        typeProbabilities.naginata = 0;
        typeProbabilities.spear = 0;
        typeProbabilities.ken = 0.001;
    } else {    
    // 2. 如果不符合任何官方公式，则根据资源总量动态调整

        // 使用各刀种的原始概率作为基础
        for (const type in swordTypes) {
            typeProbabilities[type] = swordTypes[type].baseProbability;
        }
        
        // 根据资源总量范围调整概率
        if (totalResources < 100) {
            // 低资源：提高短刀、胁差概率
            typeProbabilities.short *= 1.8;
            typeProbabilities.wakizashi *= 1.5;
        } else if (totalResources >= 100 && totalResources < 300) {
            // 中等资源：提高打刀、太刀概率
            typeProbabilities.uchigatana *= 1.6;
            typeProbabilities.tachi *= 1.4;
        } else {
            // 高资源：提高大太刀、薙刀、枪概率
            typeProbabilities.odachi *= 2.0;
            typeProbabilities.naginata *= 1.8;
            typeProbabilities.spear *= 1.8;
            typeProbabilities.ken *= 2.0;
        }
        
        // 特殊资源组合效果
        if (steel > 200 && whetstone > 200) {
            // 高钢+高砥石提高太刀概率
            typeProbabilities.tachi *= 2.2;
        }
        if (charcoal > 150 && coolant > 150) {
            // 高炭+高冷却提高大太刀概率
            typeProbabilities.odachi *= 1.8;
        }
        
        // 归一化概率
        const sum = Object.values(typeProbabilities).reduce((a, b) => a + b, 0);
        for (const type in typeProbabilities) {
            typeProbabilities[type] /= sum;
        }
    }

    // 2. 根据概率选择刀种
    const random = Math.random();
    let cumulativeProbability = 0;
    let selectedType;
    
    for (const type in typeProbabilities) {
        cumulativeProbability += typeProbabilities[type];
        if (random <= cumulativeProbability) {
            selectedType = type;
            break;
        }
    }

    // 3. 从选定刀种中根据稀有度权重选择具体刀剑
    const swordsInType = swordTypes[selectedType].swords;
    
    // 定义稀有度权重
    const rarityWeights = {
        common: 5.0,
        rare: 1.6, 
        veryRare: 0.3,
        legendary: 0.1
    };
    
    // 计算总权重
    let totalWeight = 0;
    const weightedSwords = swordsInType.map(sword => {
        const weight = rarityWeights[sword.rarity] || 1.0;
        totalWeight += weight;
        return { sword, weight };
    });
    
    // 加权随机选择
    let random2 = Math.random() * totalWeight;
    let result = null;
    
    for (const ws of weightedSwords) {
        if (random2 < ws.weight) {
            result = ws.sword;
            break;
        }
        random2 -= ws.weight;
    }
    
    // 确保至少选择一个
    result = result || swordsInType[0];
    
    // 存储结果
    currentForgingResult = result;
    
    // 更新UI状态
    elements.forgeButton.style.display = "none";
    elements.speedUpButton.style.display = "block";
    elements.speedUpButton.onclick = completeForging;
    elements.forgeStatus.textContent = "锻造中...";
    elements.forgeTimer.style.display = "block";
    
    // 设置锻造时间
    currentForgeTime = result.forgeTime;
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
    
    // 显示结果
    showResult(currentForgingResult);
    
    // 添加到收藏
    addToCollection(currentForgingResult);
    
    // 记录锻造完成日志
    const rarityName = getRarityName(currentForgingResult.rarity);
    logEvent(`锻刀完成，获得${rarityName}的刀剑：${currentForgingResult.name}`);
    
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
        
        // 添加刀解按钮事件
        const deleteBtn = item.querySelector('.delete-sword-btn');
        deleteBtn.addEventListener('click', () => deleteSword(name));
    }
}

function deleteSword(swordName) {
    console.group('刀解刀剑');
    if (!confirm(`确定要刀解 ${swordName} 吗？`)) {
        console.log('用户取消刀解');
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
        console.log('刀解前的资源状态:', gameState);
        
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
        
        console.log('刀解后的资源状态:', gameState);
        console.log('保存后的本地存储:', localStorage.getItem('toukenResources'));
        
        // 更新UI
        loadCollection();
        updateCollectionCount();
        
        console.log(`已刀解 ${swordName}，返还资源：木炭 ${returnedResources.charcoal}，玉刚 ${returnedResources.steel}，冷却材 ${returnedResources.coolant}，砥石 ${returnedResources.whetstone}`);
        logEvent(`刀解刀剑：${swordName}，返还资源：木炭 ${returnedResources.charcoal}，玉刚 ${returnedResources.steel}，冷却材 ${returnedResources.coolant}，砥石 ${returnedResources.whetstone}`);
        
        // 增加刀解计数
        stats.deleteCount++;
        localStorage.setItem('toukenStats', JSON.stringify(stats));
        updateStatsDisplay();
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
    // 重置输入框
    elements.charcoalInput.value = resourceLimits.charcoal.min;
    elements.steelInput.value = resourceLimits.steel.min;
    elements.coolantInput.value = resourceLimits.coolant.min;
    elements.whetstoneInput.value = resourceLimits.whetstone.min;
    
    // 重置游戏资源
    gameState = {
        charcoal: 500000,
        steel: 500000,
        coolant: 500000,
        whetstone: 500000
    };
    saveResources();
    
    // 重置统计数据
    resetStats();
    
    // 更新UI
    updateAllResourceDisplays();
    logEvent("已重置所有资源和统计数据");
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