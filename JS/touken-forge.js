/**
 * 刀剑乱舞锻刀模拟器 - 核心逻辑模块
 * 实现游戏内锻刀系统的模拟功能，包括数据管理、锻刀概率计算、结果展示等
 * 支持本地数据存储、导出导入功能，以及完整的锻刀体验模拟
 */

/**
 * 初始化数据管理功能
 * 设置数据重置、导出和导入功能的事件监听器
 * @function initDataManagement
 * @returns {void}
 */
function initDataManagement() {
    // 重置本地存储的数据功能
    document.getElementById('resetBtn')?.addEventListener('click', () => {
        if(confirm('确定要重置所有本地数据吗？此操作不可恢复！')) {
            // 只清除锻刀模拟器相关的数据（以touken开头的键）
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith('touken')) {
                    localStorage.removeItem(key);
                }
            });
            location.reload();
        }
    });
    
    // 导出所有本地存储数据为JSON文件
    document.getElementById('exportBtn')?.addEventListener('click', () => {
        // 创建数据对象只收集锻刀模拟器相关的localStorage键值对（以touken开头）
        const data = {};
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('touken')) {
                data[key] = localStorage.getItem(key);
            }
        }
        
        // 创建JSON blob并生成下载URL
        const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        // 创建并触发下载链接
        const a = document.createElement('a');
        a.href = url;
        // 使用当前日期作为文件名一部分
        a.download = `touken-forge-data_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
        
        // 清理临时URL对象
        URL.revokeObjectURL(url);
    });
    
    // 导入数据功能 - 触发文件选择对话框
    document.getElementById('importBtn')?.addEventListener('click', () => {
        document.getElementById('importFile')?.click();
    });
    
    // 文件选择变化事件 - 处理导入文件的读取和解析
    document.getElementById('importFile')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        // 使用FileReader读取文件内容
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                // 解析JSON数据
                const data = JSON.parse(event.target.result);
                // 确认是否覆盖现有数据
                if(!confirm('确定要导入数据吗？当前数据将被覆盖！')) return;
                
                // 只导入锻刀模拟器相关的数据（以touken开头的键）
                for (const key in data) {
                    if (key.startsWith('touken')) {
                        localStorage.setItem(key, data[key]);
                    }
                }
                // 显示成功提示
                alert('数据导入成功！');
                // 导入完成后重新加载页面以应用新数据
                location.reload();
            } catch (error) {
                // 错误处理：显示导入失败提示
                alert('数据导入失败！请确保上传的是有效的JSON文件。');
                console.error('导入错误:', error);
            }
        };
        reader.readAsText(file);
    });
}

/**
 * 日志功能模块
 * 管理锻刀过程中的事件记录和显示
 */

// 存储上次日志消息，用于检测重复消息
let lastLogMessage = '';
let duplicateLogCount = 0;

/**
 * 记录锻刀事件到日志区域
 * 处理日志消息的格式化、重复消息检测和展示
 * @function logEvent
 * @param {string} message - 要记录的日志消息内容
 * @returns {void}
 */
function logEvent(message) {
    // 创建时间戳 - 格式化当前时间为标准格式
    const now = new Date();
    const timestamp = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(/\//g, '-');
    
    // 获取日志显示区域元素
    const logArea = document.getElementById('logArea');
    // 错误处理：检查日志区域是否存在
    if (!logArea) {
        console.error('日志区域元素未找到');
        return;
    }
    
    // 开发调试信息：记录日志调用的详细参数
    console.groupCollapsed(`[日志事件] ${message.substring(0, 30)}${message.length > 30 ? '...' : ''}`);
    console.log('当前消息:', message);
    console.log('上条消息:', lastLogMessage);
    console.log('重复计数:', duplicateLogCount);
    console.log('日志区域:', logArea);
    console.groupEnd();
    
    // 重复消息处理逻辑
    if (message === lastLogMessage) {
        // 增加重复计数
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
/**
 * 稀有度对应的锻造时间（秒）
 * @type {Object.<string, number>}
 * @property {number} common - 普通稀有度锻造时间（10秒）
 * @property {number} rare - 稀有锻造时间（45秒）
 * @property {number} veryRare - 非常稀有锻造时间（88秒）
 * @property {number} legendary - 传说级锻造时间（630秒）
 */
const rarityForgeTimes = {
    common: 10,
    rare: 45,
    veryRare: 88,
    legendary: 630
};

/**
 * 刀剑类型分类数据
 * 包含各种类型的刀剑信息、概率和稀有度
 * @type {Object}
 */
const swordTypes = {
    short: {
        name: "短刀",
        swords: [
            {name: "今剑", image: "../images/touken/刀账图标/今剑.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "平野藤四郎", image: "../images/touken/刀账图标/平野藤四郎.jpg", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "厚藤四郎", image: "../images/touken/刀账图标/厚藤四郎.jpg", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "后藤藤四郎", image: "../images/touken/刀账图标/后藤藤四郎.jpg", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "信浓藤四郎", image: "../images/touken/刀账图标/信浓藤四郎.jpg", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "秋田藤四郎", image: "../images/touken/刀账图标/秋田藤四郎.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "前田藤四郎", image: "../images/touken/刀账图标/前田藤四郎.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "包丁藤四郎", image: "../images/touken/刀账图标/包丁藤四郎.jpg", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "博多藤四郎", image: "../images/touken/刀账图标/博多藤四郎.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "乱藤四郎", image: "../images/touken/刀账图标/乱藤四郎.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "药研藤四郎", image: "../images/touken/刀账图标/药研藤四郎.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "爱染国俊", image: "../images/touken/刀账图标/爱染国俊.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "太鼓钟贞宗", image: "../images/touken/刀账图标/太鼓钟贞宗.jpg", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "小夜左文字", image: "../images/touken/刀账图标/小夜左文字.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "不动行光", image: "../images/touken/刀账图标/不动行光.jpg", rarity: "legendary", forgeTime: rarityForgeTimes.legendary},
            {name: "毛利藤四郎", image: "../images/touken/刀账图标/毛利藤四郎.jpg", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "谦信景光", image: "../images/touken/刀账图标/谦信景光.jpg", rarity: "legendary", forgeTime: rarityForgeTimes.legendary}
        ],
        baseProbability: 0.4
    },
    wakizashi: {
        name: "胁差",
        swords: [
            {name: "堀川国广", image: "../images/touken/刀账图标/堀川国广.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "浦岛虎彻", image: "../images/touken/刀账图标/浦岛虎彻.jpg", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "鲶尾藤四郎", image: "../images/touken/刀账图标/鲶尾藤四郎.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "骨喰藤四郎", image: "../images/touken/刀账图标/骨喰藤四郎.jpg", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "笑面青江", image: "../images/touken/刀账图标/笑面青江.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "物吉贞宗", image: "../images/touken/刀账图标/物吉贞宗.jpg", rarity: "legendary", forgeTime: rarityForgeTimes.legendary}
        ],
        baseProbability: 0.2
    },
    uchigatana: {
        name: "打刀",
        swords: [
            {name: "鸣狐", image: "../images/touken/刀账图标/鸣狐.jpg", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "千子村正", image: "../images/touken/刀账图标/千子村正.jpg", rarity: "legendary", forgeTime: rarityForgeTimes.legendary},
            {name: "龟甲贞宗", image: "../images/touken/刀账图标/龟甲贞宗.jpg", rarity: "legendary", forgeTime: rarityForgeTimes.legendary},
            {name: "宗三左文字", image: "../images/touken/刀账图标/宗三左文字.jpg", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "加州清光", image: "../images/touken/刀账图标/加州清光.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "大和守安定", image: "../images/touken/刀账图标/大和守安定.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "歌仙兼定", image: "../images/touken/刀账图标/歌仙兼定.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "和泉守兼定", image: "../images/touken/刀账图标/和泉守兼定.jpg", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "陆奥守吉行", image: "../images/touken/刀账图标/陆奥守吉行.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "山姥切国广", image: "../images/touken/刀账图标/山姥切国广.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "蜂须贺虎彻", image: "../images/touken/刀账图标/蜂须贺虎彻.jpg", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "长曾祢虎彻", image: "../images/touken/刀账图标/长曾祢虎彻.jpg", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "大俱利伽罗", image: "../images/touken/刀账图标/大俱利伽罗.jpg", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "压切长谷部", image: "../images/touken/刀账图标/压切长谷部.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "同田贯正国", image: "../images/touken/刀账图标/同田贯正国.jpg", rarity: "rare", forgeTime: rarityForgeTimes.rare}
        ],
        baseProbability: 0.15
    },
    tachi: {
        name: "太刀",
        swords: [
            {name: "三日月宗近", image: "../images/touken/刀账图标/三日月宗近.jpg", rarity: "legendary", forgeTime: rarityForgeTimes.legendary},
            {name: "小狐丸", image: "../images/touken/刀账图标/小狐丸.jpg", rarity: "legendary", forgeTime: rarityForgeTimes.legendary},
            {name: "数珠丸恒次", image: "../images/touken/刀账图标/数珠丸恒次.jpg", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "一期一振", image: "../images/touken/刀账图标/一期一振.jpg", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "莺丸", image: "../images/touken/刀账图标/莺丸.jpg", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "明石国行", image: "../images/touken/刀账图标/明石国行.jpg", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "烛台切光忠", image: "../images/touken/刀账图标/烛台切光忠.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "小龙景光", image: "../images/touken/刀账图标/小龙景光.jpg", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "江雪左文字", image: "../images/touken/刀账图标/江雪左文字.jpg", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "山伏国广", image: "../images/touken/刀账图标/山伏国广.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "髭切", image: "../images/touken/刀账图标/髭切.jpg", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "膝丸", image: "../images/touken/刀账图标/膝丸.jpg", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "狮子王", image: "../images/touken/刀账图标/狮子王.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "小乌丸", image: "../images/touken/刀账图标/小乌丸.jpg", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "鹤丸国永", image: "../images/touken/刀账图标/鹤丸国永.jpg", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "小豆长光", image: "../images/touken/刀账图标/小豆长光.jpg", rarity: "legendary", forgeTime: rarityForgeTimes.legendary}
        ],
        baseProbability: 0.1
    },
    odachi: {
        name: "大太刀",
        swords: [
            {name: "太郎太刀", image: "../images/touken/刀账图标/太郎太刀.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "次郎太刀", image: "../images/touken/刀账图标/次郎太刀.jpg", rarity: "rare", forgeTime: rarityForgeTimes.rare},
            {name: "萤丸", image: "../images/touken/刀账图标/萤丸.jpg", rarity: "veryRare", forgeTime: rarityForgeTimes.veryRare},
            {name: "石切丸", image: "../images/touken/刀账图标/石切丸.jpg", rarity: "rare", forgeTime: rarityForgeTimes.rare}
        ],
        baseProbability: 0.05
    },
    naginata: {
        name: "薙刀",
        swords: [
            {name: "岩融", image: "../images/touken/刀账图标/岩融.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "静形薙刀", image: "../images/touken/刀账图标/静形薙刀.jpg", rarity: "legendary", forgeTime: rarityForgeTimes.legendary},
            {name: "巴形薙刀", image: "../images/touken/刀账图标/巴形薙刀.jpg", rarity: "rarey", forgeTime: rarityForgeTimes.rare}
        ],
        baseProbability: 0.05
    },
    spear: {
        name: "枪",
        swords: [
            {name: "日本号", image: "../images/touken/刀账图标/日本号.jpg", rarity: "legendary", forgeTime: rarityForgeTimes.legendary},
            {name: "蜻蛉切", image: "../images/touken/刀账图标/蜻蛉切.jpg", rarity: "common", forgeTime: rarityForgeTimes.common},
            {name: "御手杵", image: "../images/touken/刀账图标/御手杵.jpg", rarity: "rare", forgeTime: rarityForgeTimes.rare}
        ],
        baseProbability: 0.05
    },
    ken: {
        name: "剑",
        swords: [
            {name: "白山吉光", image: "../images/touken/刀账图标/白山吉光.jpg", rarity: "legendary", forgeTime: rarityForgeTimes.legendary},
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
let currentResources = {}; // 保存当前锻造使用的资源
let currentForgingResult = null; // 当前锻造结果

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

// DOM元素 - 先声明为空对象，在DOMContentLoaded事件中初始化
let elements = {};



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
    console.log('DOM完全加载，开始初始化应用...');
    try {
        // 初始化DOM元素引用
        console.log('初始化DOM元素引用...');
        elements = {
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
        
        // 先初始化资源状态
        console.log('初始化资源状态...');
        initResources();
        
        // 然后初始化UI和其他状态
        console.log('初始化UI和其他状态...');
        init();
        
        // 初始化数据管理功能
        console.log('初始化数据管理功能...');
        initDataManagement();
        
        console.log('应用初始化完成');
        
        // 添加简单的测试
        console.log('=== 简单功能测试 ===');
        console.log('elements对象:', elements);
        console.log('gameState对象:', gameState);
        
        // 测试资源显示更新
        console.log('测试资源显示更新...');
        updateAllResourceDisplays();
        
        // 测试锻造按钮事件
        if (elements.forgeButton) {
            console.log('锻造按钮存在，添加测试事件监听器');
            elements.forgeButton.addEventListener('click', function() {
                console.log('锻造按钮被点击！');
            });
        } else {
            console.error('锻造按钮不存在');
        }
        
    } catch (e) {
        console.error('初始化失败:', e);
        console.error('错误堆栈:', e.stack);
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
});