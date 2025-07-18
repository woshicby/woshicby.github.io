document.addEventListener('DOMContentLoaded', () => {
    // 刀剑数据 - 包含各种刀剑的属性和获取概率
    const swordData = [
        { id: 1, name: '刀', type: '短刀', rarity: 'N', probability: 40, resources: { steel: 100, iron: 100, stone: 100, charcoal: 100 } },
        { id: 2, name: '脇差', type: '脇差', rarity: 'N', probability: 30, resources: { steel: 200, iron: 100, stone: 100, charcoal: 100 } },
        { id: 3, name: '打刀', type: '打刀', rarity: 'R', probability: 15, resources: { steel: 300, iron: 200, stone: 200, charcoal: 200 } },
        { id: 4, name: '太刀', type: '太刀', rarity: 'SR', probability: 10, resources: { steel: 500, iron: 300, stone: 300, charcoal: 300 } },
        { id: 5, name: '大太刀', type: '大太刀', rarity: 'SSR', probability: 4, resources: { steel: 800, iron: 500, stone: 500, charcoal: 500 } },
        { id: 6, name: '槍', type: '槍', rarity: 'SR', probability: 8, resources: { steel: 400, iron: 400, stone: 200, charcoal: 200 } },
        { id: 7, name: '薙刀', type: '薙刀', rarity: 'SSR', probability: 3, resources: { steel: 1000, iron: 800, stone: 500, charcoal: 500 } },
        { id: 8, name: '剣', type: '剣', rarity: 'SSR', probability: 2, resources: { steel: 1200, iron: 1000, stone: 800, charcoal: 800 } },
        { id: 9, name: '小狐丸', type: '太刀', rarity: 'SSR', probability: 0.5, resources: { steel: 1500, iron: 1200, stone: 1000, charcoal: 1000 } },
        { id: 10, name: '三日月宗近', type: '太刀', rarity: 'SSR', probability: 0.3, resources: { steel: 2000, iron: 1500, stone: 1500, charcoal: 1500 } },
        { id: 11, name: '数珠丸恒次', type: '太刀', rarity: 'SSR', probability: 0.2, resources: { steel: 2500, iron: 2000, stone: 2000, charcoal: 2000 } }
    ];

    // 玩家资源数据
    let playerResources = {
        steel: 1000,
        iron: 1000,
        stone: 1000,
        charcoal: 1000
    };

    // DOM元素引用
    const domElements = {
        resources: {
            steel: { input: document.getElementById('steel-input'), value: document.getElementById('steel-value') },
            iron: { input: document.getElementById('iron-input'), value: document.getElementById('iron-value') },
            stone: { input: document.getElementById('stone-input'), value: document.getElementById('stone-value') },
            charcoal: { input: document.getElementById('charcoal-input'), value: document.getElementById('charcoal-value') }
        },
        buttons: {
            forge: document.getElementById('forge-button'),
            maxAll: document.getElementById('max-all-button'),
            reset: document.getElementById('reset-button')
        },
        result: {
            container: document.getElementById('result-container'),
            name: document.getElementById('result-name'),
            type: document.getElementById('result-type'),
            rarity: document.getElementById('result-rarity'),
            image: document.getElementById('result-image')
        },
        forgeProcess: document.getElementById('forge-process'),
        forgeTimer: document.getElementById('forge-timer')
    };

    // 初始化资源显示
    function initResourcesDisplay() {
        for (const [resource, elements] of Object.entries(domElements.resources)) {
            elements.value.textContent = playerResources[resource];
            elements.input.max = playerResources[resource];
            elements.input.value = Math.min(elements.input.value, playerResources[resource]);
        }
    }

    // 更新资源显示
    function updateResourcesDisplay() {
        for (const [resource, elements] of Object.entries(domElements.resources)) {
            elements.value.textContent = playerResources[resource];
            elements.input.max = playerResources[resource];
        }
    }

    // 验证输入资源
    function validateResources() {
        for (const [resource, elements] of Object.entries(domElements.resources)) {
            const value = parseInt(elements.input.value) || 0;
            if (value < 0) return false;
            if (value > playerResources[resource]) return false;
        }
        return true;
    }

    // 获取输入的资源
    function getInputResources() {
        const resources = {};
        for (const [resource, elements] of Object.entries(domElements.resources)) {
            resources[resource] = parseInt(elements.input.value) || 0;
        }
        return resources;
    }

    // 设置所有资源为最大值
    function setMaxResources() {
        for (const [resource, elements] of Object.entries(domElements.resources)) {
            elements.input.value = playerResources[resource];
        }
    }

    // 重置资源输入
    function resetResources() {
        for (const [resource, elements] of Object.entries(domElements.resources)) {
            elements.input.value = 0;
        }
    }

    // 根据资源消耗计算获得刀剑的概率
    function calculateSwordProbability(inputResources) {
        // 根据投入资源计算基础概率权重
        const totalInput = Object.values(inputResources).reduce((sum, val) => sum + val, 0);
        const baseProbability = Math.min(1, totalInput / 1000); // 最高1000资源获得最高概率

        // 筛选可能获得的刀剑
        const possibleSwords = swordData.filter(sword => {
            return Object.entries(sword.resources).every(([resource, required]) => {
                return inputResources[resource] >= required * 0.7; // 至少投入70%的必要资源
            });
        });

        // 根据基础概率调整各刀剑的获得概率
        const adjustedSwords = possibleSwords.map(sword => {
            return {
                ...sword,
                adjustedProbability: sword.probability * baseProbability
            };
        });

        // 归一化概率
        const totalProbability = adjustedSwords.reduce((sum, sword) => sum + sword.adjustedProbability, 0);
        const normalizedSwords = adjustedSwords.map(sword => {
            return {
                ...sword,
                normalizedProbability: sword.adjustedProbability / totalProbability
            };
        });

        return normalizedSwords;
    }

    // 随机选择一个刀剑
    function selectRandomSword(normalizedSwords) {
        if (normalizedSwords.length === 0) return null;

        const randomValue = Math.random();
        let cumulativeProbability = 0;

        for (const sword of normalizedSwords) {
            cumulativeProbability += sword.normalizedProbability;
            if (randomValue <= cumulativeProbability) {
                return sword;
            }
        }

        return normalizedSwords[normalizedSwords.length - 1];
    }

    // 显示锻造结果
    function showForgeResult(sword) {
        if (!sword) {
            domElements.result.name.textContent = '锻造失败';
            domElements.result.type.textContent = '没有足够的资源锻造任何刀剑';
            domElements.result.rarity.textContent = '';
            domElements.result.image.src = '../images/touken/default_sword.jpg';
            domElements.result.image.alt = '锻造失败';
        } else {
            domElements.result.name.textContent = sword.name;
            domElements.result.type.textContent = sword.type;
            domElements.result.rarity.textContent = sword.rarity;
            domElements.result.image.src = `../images/touken/${sword.id}.jpg`;
            domElements.result.image.alt = sword.name;

            // 根据稀有度设置颜色
            switch(sword.rarity) {
                case 'SSR':
                    domElements.result.rarity.style.color = '#FF5733';
                    break;
                case 'SR':
                    domElements.result.rarity.style.color = '#900C3F';
                    break;
                case 'R':
                    domElements.result.rarity.style.color = '#3498DB';
                    break;
                default:
                    domElements.result.rarity.style.color = '#2ECC71';
            }
        }

        // 显示结果容器并添加动画
        domElements.result.container.style.display = 'block';
        domElements.result.container.classList.add('show-result');
        setTimeout(() => {
            domElements.result.container.classList.remove('show-result');
        }, 1000);
    }

    // 锻造过程动画
    function animateForgeProcess() {
        return new Promise((resolve) => {
            domElements.forgeProcess.style.display = 'block';
            domElements.forgeTimer.textContent = '10';
            let timeLeft = 10;

            const timerInterval = setInterval(() => {
                timeLeft--;
                domElements.forgeTimer.textContent = timeLeft;

                if (timeLeft <= 0) {
                    clearInterval(timerInterval);
                    domElements.forgeProcess.style.display = 'none';
                    resolve();
                }
            }, 1000);
        });
    }

    // 锻造刀剑
    async function forgeSword() {
        // 禁用锻造按钮
        domElements.buttons.forge.disabled = true;

        // 获取输入资源
        const inputResources = getInputResources();

        // 验证资源
        if (!validateResources()) {
            alert('输入的资源不正确！');
            domElements.buttons.forge.disabled = false;
            return;
        }

        // 检查是否有足够资源
        let hasEnoughResources = true;
        for (const [resource, amount] of Object.entries(inputResources)) {
            if (amount > playerResources[resource]) {
                hasEnoughResources = false;
                break;
            }
        }

        if (!hasEnoughResources) {
            alert('资源不足！');
            domElements.buttons.forge.disabled = false;
            return;
        }

        // 消耗资源
        for (const [resource, amount] of Object.entries(inputResources)) {
            playerResources[resource] -= amount;
        }

        // 更新资源显示
        updateResourcesDisplay();

        // 显示锻造过程动画
        await animateForgeProcess();

        // 获取可能的刀剑并选择一个
        const normalizedSwords = calculateSwordProbability(inputResources);
        const selectedSword = selectRandomSword(normalizedSwords);

        // 显示结果
        showForgeResult(selectedSword);

        // 启用锻造按钮
        domElements.buttons.forge.disabled = false;
    }

    // 添加事件监听器
    function addEventListeners() {
        // 锻造按钮
        domElements.buttons.forge.addEventListener('click', forgeSword);

        // 最大化所有资源按钮
        domElements.buttons.maxAll.addEventListener('click', setMaxResources);

        // 重置资源按钮
        domElements.buttons.reset.addEventListener('click', resetResources);

        // 资源输入验证
        for (const [resource, elements] of Object.entries(domElements.resources)) {
            elements.input.addEventListener('input', function() {
                // 确保输入值为非负整数
                this.value = Math.max(0, parseInt(this.value) || 0);
                // 确保不超过最大资源
                this.value = Math.min(this.value, playerResources[resource]);
            });
        }
    }

    // 初始化应用
    function initApp() {
        initResourcesDisplay();
        addEventListeners();
    }

    // 启动应用
    initApp();
});