// 模拟器核心逻辑模块
class Simulator {
    constructor() {
        // 文明名称列表
        this.civilizationNames = ['炎黄文明', '爱琴文明', '尼罗文明', '玛雅文明', '印加文明'];
        
        // 随机生成2-5个文明
        const civCount = Math.floor(Math.random() * 4) + 2;
        this.civilizations = [];
        
        for (let i = 0; i < civCount; i++) {
            const name = this.civilizationNames[i % this.civilizationNames.length];
            const civ = new Civilization(i + 1, name);
            this.civilizations.push(civ);
        }
        
        // 初始化文明关系
        this.civilizations.forEach((civ1, i) => {
            this.civilizations.slice(i + 1).forEach(civ2 => {
                civ1.relations[civ2.id] = Math.floor(Math.random() * 40 - 20);
                civ2.relations[civ1.id] = civ1.relations[civ2.id];
            });
        });
        
        this.currentYear = -3000;
        this.runningTime = 0;
        this.speed = 'medium';
        this.intervalId = null;
        this.events = [];
        
        // 灭亡文明历史记录
        this.deadCivilizations = [];
        
        // 灾难和环境事件系统
        this.disasterSystem = {
            disasterTypes: {
                flood: { 
                    name: '洪水', 
                    description: '大规模洪水淹没了低洼地区，破坏了农田和城市。',
                    probability: 0.05,
                    duration: 3,
                    impact: {
                        population: -0.2,
                        economy: -0.15,
                        tech: -0.05
                    },
                    terrainAffected: ['plains', 'water'],
                    severity: 'medium'
                },
                earthquake: {
                    name: '地震',
                    description: '强烈地震破坏了建筑物和基础设施。',
                    probability: 0.03,
                    duration: 2,
                    impact: {
                        population: -0.25,
                        economy: -0.2,
                        military: -0.1
                    },
                    terrainAffected: ['plains', 'hills', 'mountains'],
                    severity: 'high'
                },
                drought: {
                    name: '干旱',
                    description: '长期干旱导致农作物歉收，水资源短缺。',
                    probability: 0.04,
                    duration: 5,
                    impact: {
                        population: -0.15,
                        economy: -0.1,
                        culture: -0.05
                    },
                    terrainAffected: ['plains', 'forest'],
                    severity: 'medium'
                },
                plague: {
                    name: '瘟疫',
                    description: '致命疾病在人群中传播，造成大量死亡。',
                    probability: 0.02,
                    duration: 4,
                    impact: {
                        population: -0.3,
                        economy: -0.15,
                        culture: -0.1
                    },
                    terrainAffected: ['plains', 'forest', 'hills'],
                    severity: 'high'
                },
                volcanicEruption: {
                    name: '火山喷发',
                    description: '火山喷发释放出大量火山灰和熔岩，摧毁了周围地区。',
                    probability: 0.01,
                    duration: 2,
                    impact: {
                        population: -0.35,
                        economy: -0.25,
                        tech: -0.1
                    },
                    terrainAffected: ['mountains', 'hills', 'plains'],
                    severity: 'very_high'
                }
            },
            activeDisasters: []
        };
        
        // 初始化地图系统
        this.map = new MapSystem(this);
        this.map.init();
        
        // 为每个文明分配固定位置
        this.assignCivilizationPositions();
        
        // 初始化文明属性到格子上
        this.distributeCivAttributesToCells();
        this.updateCellAttributes();
        
        // 添加初始事件，确保时间线有内容 - 移到map初始化之后
        this.generateRandomEvent();
        
        // 延迟创建UISystem实例，避免循环依赖
        this.ui = null;
    }
    
    // 初始化UI
    initUI() {
        // 在initUI中创建UISystem实例，确保所有依赖都已初始化
        this.ui = new UISystem(this);
        this.ui.init();
    }
    
    // 为文明分配固定位置
    assignCivilizationPositions() {
        const cols = this.map.cols;
        const rows = this.map.rows;
        
        // 寻找适合文明发展的位置（平原或森林）
        const suitablePositions = [];
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                const cell = this.map.mapCells[y][x];
                if (cell === 'plains' || cell === 'forest') {
                    suitablePositions.push({x, y});
                }
            }
        }
        
        // 打乱位置并分配给文明
        this.shuffleArray(suitablePositions);
        
        this.civilizations.forEach((civ, index) => {
            if (index < suitablePositions.length) {
                const pos = suitablePositions[index];
                // 保存文明位置（转换为像素坐标）
                civ.x = pos.x * this.map.cellSize + this.map.cellSize / 2;
                civ.y = pos.y * this.map.cellSize + this.map.cellSize / 2;
                
                // 为文明分配初始领土和属性
                this.map.assignInitialTerritory(civ, pos.x, pos.y);
            } else {
                // 如果合适位置不足，随机分配
                civ.x = Math.random() * (this.map.mapWidth - 60) + 30;
                civ.y = Math.random() * (this.map.mapHeight - 60) + 30;
                
                // 转换为网格坐标
                const gridX = Math.floor(civ.x / this.map.cellSize);
                const gridY = Math.floor(civ.y / this.map.cellSize);
                
                // 为文明分配初始领土和属性
                this.map.assignInitialTerritory(civ, gridX, gridY);
            }
        });
    }
    
    // 打乱数组
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    // 计算所有文明对每个格子的影响力
    calculateInfluence() {
        // 重置影响力数组 - 使用更高效的重置方式
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                this.map.influence[y][x] = {};
            }
        }
        
        // 全局预计算地形修正因子（避免重复创建）
        const terrainModifiers = {
            plains: 1.1,
            forest: 0.7,
            hills: 0.5,
            mountains: 0.3
        };
        
        const influenceDistanceThreshold = 10; // 进一步减少影响力计算距离，从12改为10
        const maxDistance = influenceDistanceThreshold;
        const maxDistanceSquared = maxDistance * maxDistance; // 预计算平方距离，避免开方运算
        
        // 预计算所有文明的控制格子，避免重复遍历
        const civOwnedCells = [];
        
        this.civilizations.forEach(civ => {
            // 收集文明控制的所有格子
            const ownedCells = [];
            for (let y = 0; y < this.map.rows; y++) {
                for (let x = 0; x < this.map.cols; x++) {
                    const cell = this.map.territory[y][x];
                    if (cell.owner === civ.id && !cell.isDisputed) {
                        // 预计算本地影响力，避免重复计算
                        const localInfluence = (cell.tech + cell.culture + cell.economy + cell.military + cell.population / 100) / 5;
                        ownedCells.push({ x, y, localInfluence });
                    }
                }
            }
            
            // 跳过没有控制格子的文明
            if (ownedCells.length > 0) {
                civOwnedCells.push({ civ, ownedCells });
            }
        });
        
        // 跳过没有文明的情况
        if (civOwnedCells.length === 0) {
            return;
        }
        
        // 对每个目标格子，批量计算所有文明的影响力
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                // 跳过海洋格子（海洋格子不受影响力影响）
                if (this.map.mapCells[y][x] === 'water') {
                    continue;
                }
                
                // 预计算目标格子的修正因子（只计算一次，用于所有文明）
                const targetCell = this.map.territory[y][x];
                
                // 地形修正
                const terrain = this.map.mapCells[y][x];
                const terrainModifier = terrainModifiers[terrain] || 1.0;
                
                // 人口修正
                const populationModifier = 1 + (targetCell.population / targetCell.limits.population) * 0.5;
                
                // 资源修正
                let resourceModifier = 0.8; // 默认没有资源的格子影响力降低
                let stabilityModifier = 1.0;
                if (targetCell.resource) {
                    // 简化资源价值计算
                    let resourceValue = 0;
                    const effectCount = Object.keys(targetCell.resource.effect).length;
                    if (effectCount > 0) {
                        // 只取第一个效果，简化计算
                        const firstEffect = Object.values(targetCell.resource.effect)[0];
                        resourceValue = firstEffect * targetCell.resource.quantity;
                    }
                    // 应用资源修正
                    resourceModifier = 1 + Math.min(0.3, resourceValue * 0.08);
                    
                    // 格子稳定性修正：资源短缺的格子影响力降低
                    if (targetCell.resource.quantity < 5) {
                        stabilityModifier = 0.7; // 资源短缺的格子影响力降低30%
                    }
                }
                
                // 计算综合修正因子
                const totalModifier = terrainModifier * populationModifier * resourceModifier * stabilityModifier;
                
                // 随机波动因子
                const randomFactor = (0.97 + Math.random() * 0.06);
                
                // 为每个文明计算影响力
                for (const { civ, ownedCells } of civOwnedCells) {
                    // 累加所有文明控制格子的影响力
                    let totalInfluence = 0;
                    
                    // 限制每个文明的计算格子数量
                    const maxCellsPerCiv = 50; // 最多计算50个格子
                    const cellsToCalculate = ownedCells.slice(0, maxCellsPerCiv);
                    
                    for (const { x: cx, y: cy, localInfluence } of cellsToCalculate) {
                        // 计算距离平方（避免开方运算）
                        const distanceX = x - cx;
                        const distanceY = y - cy;
                        const distanceSquared = distanceX * distanceX + distanceY * distanceY;
                        
                        // 超出距离阈值的格子，影响力为0，跳过计算
                        if (distanceSquared > maxDistanceSquared) {
                            continue;
                        }
                        
                        // 计算实际距离（只在需要时计算）
                        const distance = Math.sqrt(distanceSquared);
                        
                        // 距离衰减 - 使用简化的衰减函数
                        const decay = 1 / (1 + distance / 8); // 简化的衰减函数，避免指数运算
                        // 计算该格子对当前格子的影响力
                        const cellInfluence = localInfluence * decay;
                        
                        // 应用所有修正因子
                        totalInfluence += cellInfluence * totalModifier * randomFactor;
                    }
                    
                    // 确保影响力为正数
                    totalInfluence = Math.max(0, totalInfluence);
                    
                    // 设置影响力
                    this.map.influence[y][x][civ.id] = totalInfluence;
                }
            }
        }
        
        // 应用影响力扩散
        this.spreadInfluence();
    }
    
    // 影响力扩散算法
    spreadInfluence() {
        const iterations = 1; // 进一步减少扩散迭代次数，从2次改为1次
        const diffusionRate = 0.1; // 进一步降低扩散速率，从0.15改为0.1
        
        // 复制当前影响力状态 - 使用更高效的逐元素复制
        const tempInfluence = [];
        for (let y = 0; y < this.map.rows; y++) {
            tempInfluence[y] = [];
            for (let x = 0; x < this.map.cols; x++) {
                tempInfluence[y][x] = {};
                // 只复制有影响力的文明
                const currentInfluences = this.map.influence[y][x];
                for (const civId in currentInfluences) {
                    tempInfluence[y][x][civId] = currentInfluences[civId];
                }
            }
        }
        
        // 预计算地形的影响力传播权重
        const terrainObstacles = {};
        for (const terrain in this.map.cellTypeLimits) {
            terrainObstacles[terrain] = 1 - this.map.cellTypeLimits[terrain].influenceObstacle;
        }
        
        // 定义相邻格子的相对位置
        const neighbors = [
            { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
            { x: -1, y: 0 },                   { x: 1, y: 0 },
            { x: -1, y: 1 }, { x: 0, y: 1 }, { x: 1, y: 1 }
        ];
        
        // 进行多次迭代扩散
        for (let iter = 0; iter < iterations; iter++) {
            // 遍历所有格子
            for (let y = 0; y < this.map.rows; y++) {
                for (let x = 0; x < this.map.cols; x++) {
                    // 跳过海洋格子
                    if (this.map.mapCells[y][x] === 'water') {
                        continue;
                    }
                    
                    // 获取当前格子的所有文明影响力
                    const currentInfluences = tempInfluence[y][x];
                    
                    // 如果当前格子没有影响力，跳过处理
                    const civIds = Object.keys(currentInfluences);
                    if (civIds.length === 0) {
                        continue;
                    }
                    
                    // 遍历每个文明的影响力
                    for (const civIdStr of civIds) {
                        const civId = parseInt(civIdStr);
                        let currentValue = currentInfluences[civId];
                        
                        // 如果影响力已经很小，跳过扩散
                        if (currentValue < 0.1) {
                            continue;
                        }
                        
                        // 计算从相邻格子接收的影响力
                        let neighborSum = 0;
                        let neighborWeightSum = 0;
                        
                        for (const neighbor of neighbors) {
                            const nx = x + neighbor.x;
                            const ny = y + neighbor.y;
                            
                            if (nx >= 0 && nx < this.map.cols && ny >= 0 && ny < this.map.rows) {
                                const neighborInfluences = tempInfluence[ny][nx];
                                if (neighborInfluences[civId] !== undefined) {
                                    // 获取邻居格子的地形
                                    const neighborTerrain = this.map.mapCells[ny][nx];
                                    // 获取预计算的影响力传播权重
                                    const weight = terrainObstacles[neighborTerrain];
                                    neighborSum += neighborInfluences[civId] * weight;
                                    neighborWeightSum += weight;
                                }
                            }
                        }
                        
                        // 如果有相邻影响力，进行扩散
                        if (neighborWeightSum > 0) {
                            const averageNeighbor = neighborSum / neighborWeightSum;
                            // 更新影响力值
                            currentValue = currentValue * (1 - diffusionRate) + averageNeighbor * diffusionRate;
                        }
                        
                        // 更新临时影响力值
                        tempInfluence[y][x][civId] = currentValue;
                    }
                }
            }
        }
        
        // 将扩散后的影响力复制回原始数组
        this.map.influence = tempInfluence;
    }
    
    // 分配领土
    allocateTerritory() {
        // 领土分配优化：
        // 1. 只处理有影响力的格子
        // 2. 优化最大值查找算法
        // 3. 减少不必要的对象创建
        
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                // 跳过海洋格子
                if (this.map.mapCells[y][x] === 'water') {
                    this.map.territory[y][x].owner = null;
                    this.map.territory[y][x].influence = {};
                    this.map.territory[y][x].isDisputed = false;
                    continue;
                }
                
                const cellInfluence = this.map.influence[y][x];
                const civIds = Object.keys(cellInfluence);
                const civCount = civIds.length;
                
                // 如果没有文明影响力，设为无主
                if (civCount === 0) {
                    this.map.territory[y][x].owner = null;
                    this.map.territory[y][x].influence = cellInfluence;
                    this.map.territory[y][x].isDisputed = false;
                    continue;
                }
                
                // 找到影响力最高的文明 - 优化最大值查找
                let maxCivId = civIds[0];
                let maxInfluence = cellInfluence[maxCivId];
                let secondMaxInfluence = 0;
                
                // 使用普通for循环替代forEach，提高性能
                for (let i = 1; i < civCount; i++) {
                    const civId = civIds[i];
                    const influence = cellInfluence[civId];
                    if (influence > maxInfluence) {
                        secondMaxInfluence = maxInfluence;
                        maxInfluence = influence;
                        maxCivId = civId;
                    } else if (influence > secondMaxInfluence && influence < maxInfluence) {
                        secondMaxInfluence = influence;
                    }
                }
                
                // 判断是否为争议地带 - 降低阈值，增加稳定区域
                const isDisputed = secondMaxInfluence > maxInfluence * 0.85; // 如果第二高影响力超过最高影响力的85%，则为争议地带
                
                // 增加领土稳定性：如果当前格子已有主人且新主人的影响力优势不明显，则保留原主人
                const currentOwner = this.map.territory[y][x].owner;
                let newOwner = parseInt(maxCivId);
                
                // 只有当新主人的影响力比原主人高20%以上，或者原主人不存在时，才改变所有权
                if (currentOwner !== null && currentOwner !== newOwner) {
                    const currentInfluence = cellInfluence[currentOwner] || 0;
                    if (maxInfluence < currentInfluence * 1.2) {
                        newOwner = currentOwner;
                    }
                }
                
                // 更新领土信息 - 只在必要时更新
                const territory = this.map.territory[y][x];
                if (territory.owner !== newOwner || territory.isDisputed !== isDisputed) {
                    territory.owner = newOwner;
                    territory.influence = cellInfluence;
                    territory.isDisputed = isDisputed;
                }
            }
        }
    }
    
    // 分配文明属性到格子
    distributeCivAttributesToCells() {
        // 为每个文明分配属性到其占领的格子
        this.civilizations.forEach(civ => {
            // 收集该文明占领的所有格子
            const ownedCells = [];
            for (let y = 0; y < this.map.rows; y++) {
                for (let x = 0; x < this.map.cols; x++) {
                    if (this.map.territory[y][x].owner === civ.id && !this.map.territory[y][x].isDisputed) {
                        ownedCells.push({ x, y });
                    }
                }
            }
            
            // 如果没有占领格子，跳过
            if (ownedCells.length === 0) {
                return;
            }
            
            // 计算每个属性的平均值
            const avgTech = civ.tech / ownedCells.length;
            const avgCulture = civ.culture / ownedCells.length;
            const avgEconomy = civ.economy / ownedCells.length;
            const avgMilitary = civ.military / ownedCells.length;
            const avgPopulation = civ.population / ownedCells.length;
            
            // 计算文明的几何中心（基于所有控制格子的平均位置）
            let totalX = 0;
            let totalY = 0;
            for (const cell of ownedCells) {
                totalX += cell.x;
                totalY += cell.y;
            }
            const centerX = totalX / ownedCells.length;
            const centerY = totalY / ownedCells.length;
            
            // 分配属性到每个格子，考虑格子类型限制
            ownedCells.forEach(cell => {
                const territory = this.map.territory[cell.y][cell.x];
                const limits = territory.limits;
                
                // 计算基于距离的权重（文明几何中心附近的格子获得更多属性）
                const distance = Math.abs(cell.x - centerX) + Math.abs(cell.y - centerY);
                const distanceWeight = Math.exp(-distance / 20); // 距离衰减系数
                
                // 计算基于地形的权重（不同地形对不同属性有加成）
                const terrain = territory.terrain;
                const terrainWeights = {
                    water: { tech: 0.2, culture: 0.2, economy: 0.1, military: 0.1, population: 0.1 },
                    plains: { tech: 0.8, culture: 0.8, economy: 1.5, military: 1.2, population: 1.5 },
                    forest: { tech: 0.5, culture: 1.5, economy: 0.5, military: 0.8, population: 0.8 },
                    hills: { tech: 0.7, culture: 0.7, economy: 0.7, military: 1.5, population: 0.5 },
                    mountains: { tech: 1.5, culture: 0.5, economy: 0.3, military: 1.2, population: 0.2 }
                };
                const terrainWeight = terrainWeights[terrain];
                
                // 分配属性到格子，考虑格子上限
                territory.tech = Math.min(limits.tech, territory.tech + (avgTech * distanceWeight * terrainWeight.tech));
                territory.culture = Math.min(limits.culture, territory.culture + (avgCulture * distanceWeight * terrainWeight.culture));
                territory.economy = Math.min(limits.economy, territory.economy + (avgEconomy * distanceWeight * terrainWeight.economy));
                territory.military = Math.min(limits.military, territory.military + (avgMilitary * distanceWeight * terrainWeight.military));
                territory.population = Math.min(limits.population, territory.population + (avgPopulation * distanceWeight * terrainWeight.population));
            });
        });
    }
    
    // 更新格子属性，考虑格子间的扩散
    updateCellAttributes() {
        // 预计算常量值
        const diffusionRate = 0.1;
        const starvationRate = 0.015;
        
        // 预计算资源相关的常量
        const baseCollectionRate = {
            food: 0.008,
            mineral: 0.006,
            energy: 0.005,
            culture: 0.004,
            rare: 0.0025
        };
        
        const resourceBaseValue = {
            food: 10,
            mineral: 8,
            energy: 6,
            culture: 5,
            rare: 3
        };
        
        const maxResourceQuantities = {
            food: 50,
            mineral: 35,
            energy: 30,
            culture: 25,
            rare: 15
        };
        
        // 保存当前状态用于扩散计算 - 使用更高效的复制方式
        // 只复制需要的属性，减少内存使用
        const tempTerritory = [];
        for (let y = 0; y < this.map.rows; y++) {
            tempTerritory[y] = [];
            for (let x = 0; x < this.map.cols; x++) {
                const cell = this.map.territory[y][x];
                tempTerritory[y][x] = {
                    owner: cell.owner,
                    tech: cell.tech,
                    culture: cell.culture,
                    economy: cell.economy,
                    military: cell.military,
                    population: cell.population,
                    isDisputed: cell.isDisputed
                };
            }
        }
        
        // 遍历所有格子
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                const cell = this.map.territory[y][x];
                if (!cell.owner || cell.isDisputed) {
                    continue;
                }
                
                // 计算相邻格子的影响
                const neighbors = [
                    { x: x-1, y: y-1 }, { x: x, y: y-1 }, { x: x+1, y: y-1 },
                    { x: x-1, y: y },                     { x: x+1, y: y },
                    { x: x-1, y: y+1 }, { x: x, y: y+1 }, { x: x+1, y: y+1 }
                ];
                
                // 计算扩散影响
                let totalDiff = { tech: 0, culture: 0, economy: 0, military: 0, population: 0 };
                let neighborCount = 0;
                
                // 限制邻居计算数量
                const maxNeighbors = 4; // 最多计算4个邻居
                let processedNeighbors = 0;
                
                for (const neighbor of neighbors) {
                    if (processedNeighbors >= maxNeighbors) {
                        break;
                    }
                    
                    if (neighbor.x >= 0 && neighbor.x < this.map.cols && neighbor.y >= 0 && neighbor.y < this.map.rows) {
                        const neighborCell = tempTerritory[neighbor.y][neighbor.x];
                        if (neighborCell.owner === cell.owner && !neighborCell.isDisputed) {
                            // 计算属性差异
                            totalDiff.tech += neighborCell.tech - cell.tech;
                            totalDiff.culture += neighborCell.culture - cell.culture;
                            totalDiff.economy += neighborCell.economy - cell.economy;
                            totalDiff.military += neighborCell.military - cell.military;
                            totalDiff.population += neighborCell.population - cell.population;
                            neighborCount++;
                            processedNeighbors++;
                        }
                    }
                }
                
                // 应用扩散影响（平滑属性分布）
                if (neighborCount > 0) {
                    cell.tech += (totalDiff.tech / neighborCount) * diffusionRate;
                    cell.culture += (totalDiff.culture / neighborCount) * diffusionRate;
                    cell.economy += (totalDiff.economy / neighborCount) * diffusionRate;
                    cell.military += (totalDiff.military / neighborCount) * diffusionRate;
                    cell.population += (totalDiff.population / neighborCount) * diffusionRate;
                    
                    // 确保不超过格子限制
                    const limits = cell.limits;
                    cell.tech = Math.min(limits.tech, Math.max(0, cell.tech));
                    cell.culture = Math.min(limits.culture, Math.max(0, cell.culture));
                    cell.economy = Math.min(limits.economy, Math.max(0, cell.economy));
                    cell.military = Math.min(limits.military, Math.max(0, cell.military));
                    cell.population = Math.min(limits.population, Math.max(0, cell.population));
                }
                
                // 资源生产与消耗逻辑 - 完全在格子层面结算
                if (cell.resource) {
                    const resource = cell.resource;
                    let resourceQuantity = resource.quantity;
                    
                    // 1. 资源采集：由人口在资源格子采集，不同资源类型有不同的采集效率
                    const techBonus = cell.tech / 500; // 科技每500点增加1倍采集效率
                    const economyBonus = cell.economy / 800; // 经济每800点增加1倍采集效率
                    
                    // 计算实际采集率
                    const collectionRate = baseCollectionRate[resource.type] * (1 + techBonus + economyBonus);
                    
                    // 资源采集量
                    const collection = Math.floor(cell.population * collectionRate * resourceBaseValue[resource.type]);
                    
                    // 2. 资源消耗：用于属性发展，不同资源类型有不同的消耗途径
                    let resourceConsumption = 0;
                    
                    // 3. 特殊处理食物资源：人口生存基础
                    if (resource.type === 'food') {
                        // 食物消耗与人口直接相关
                        const foodConsumptionPerPerson = 0.045;
                        const quantityBasedConsumption = Math.floor(resourceQuantity * 0.06);
                        const foodConsumption = Math.floor(cell.population * foodConsumptionPerPerson) + quantityBasedConsumption;
                        resourceConsumption = foodConsumption;
                        
                        // 食物短缺处理
                        if (resourceQuantity + collection < foodConsumption) {
                            // 食物不足，人口减少
                            const availableFood = resourceQuantity + collection;
                            const foodShortageRatio = availableFood / foodConsumption;
                            const starvationDeaths = Math.floor(cell.population * (1 - foodShortageRatio) * 0.9);
                            cell.population = Math.max(0, cell.population - starvationDeaths);
                            
                            // 食物全部消耗，保留最低1单位
                            resourceQuantity = 1;
                            
                            // 食物严重短缺，影响其他属性
                            cell.tech *= 0.92;
                            cell.culture *= 0.91;
                            cell.economy *= 0.90;
                            cell.military *= 0.91;
                        } else {
                            // 食物充足，消耗所需食物
                            resourceQuantity += collection - foodConsumption;
                            
                            // 限制食物资源的最大数量
                            const maxFoodResource = 50;
                            resourceQuantity = Math.min(maxFoodResource, resourceQuantity);
                            
                            // 食物充足时，人口缓慢增长
                            const populationGrowth = cell.population * 0.00008 * (resourceQuantity / cell.limits.population);
                            cell.population = Math.min(cell.limits.population, cell.population + populationGrowth);
                        }
                    } else {
                        // 其他资源的消耗：用于属性发展
                        let developmentConsumption = 0;
                        
                        // 根据资源类型确定消耗用途
                        switch(resource.type) {
                            case 'mineral':
                                // 矿产用于经济和军事发展
                                developmentConsumption = Math.floor((cell.economy * 0.02 + cell.military * 0.025) * 1.5);
                                break;
                            case 'energy':
                                // 能源用于科技和军事发展
                                developmentConsumption = Math.floor((cell.tech * 0.025 + cell.military * 0.02) * 1.5);
                                break;
                            case 'culture':
                                // 文化资源用于文化和经济发展
                                developmentConsumption = Math.floor((cell.culture * 0.03 + cell.economy * 0.008) * 1.5);
                                break;
                            case 'rare':
                                // 稀有资源用于高级科技和军事发展
                                developmentConsumption = Math.floor((cell.tech * 0.04 + cell.military * 0.04) * 2.0);
                                break;
                            default:
                                developmentConsumption = 0;
                        }
                        
                        // 资源消耗 = 基础维护 + 发展消耗 + 资源数量消耗
                        const baseMaintenance = Math.floor(cell.population * 0.003);
                        const quantityBasedConsumption = Math.floor(resourceQuantity * 0.08);
                        resourceConsumption = baseMaintenance + developmentConsumption + quantityBasedConsumption;
                        
                        // 限制资源最大数量
                        const maxQuantity = maxResourceQuantities[resource.type] || 100;
                        
                        // 计算资源净变化
                        resourceQuantity += collection - resourceConsumption;
                        // 先限制上限，再确保不低于1
                        resourceQuantity = Math.max(1, Math.min(maxQuantity, resourceQuantity));
                        
                        // 资源短缺处理
                        if (resourceQuantity < 5) {
                            switch(resource.type) {
                                case 'mineral':
                                    // 矿产短缺影响经济和军事发展
                                    cell.economy *= 0.85;
                                    cell.military *= 0.85;
                                    break;
                                case 'energy':
                                    // 能源短缺影响科技和军事发展
                                    cell.tech *= 0.85;
                                    cell.military *= 0.85;
                                    break;
                                case 'culture':
                                    // 文化资源短缺影响文化发展
                                    cell.culture *= 0.85;
                                    cell.economy *= 0.92;
                                    break;
                                case 'rare':
                                    // 稀有资源短缺影响高级科技和军事发展
                                    cell.tech *= 0.8;
                                    cell.military *= 0.8;
                                    break;
                            }
                        }
                    }
                    
                    // 更新资源数量
                    cell.resource.quantity = resourceQuantity;
                    
                    // 4. 属性发展：消耗资源产生属性增长
                    // 资源充足时，允许属性发展
                    if (resourceQuantity > 5) {
                        // 不同资源类型支持不同属性发展
                        const attributeGrowth = {
                            tech: 0,
                            economy: 0,
                            military: 0,
                            culture: 0
                        };
                        
                        // 根据资源类型确定支持的属性发展
                        switch(resource.type) {
                            case 'mineral':
                                // 矿产支持经济和军事发展
                                attributeGrowth.economy += cell.population * 0.00004 * (resourceQuantity / 50);
                                attributeGrowth.military += cell.population * 0.00003 * (resourceQuantity / 50);
                                break;
                            case 'energy':
                                // 能源支持科技和军事发展
                                attributeGrowth.tech += cell.population * 0.00004 * (resourceQuantity / 40);
                                attributeGrowth.military += cell.population * 0.00003 * (resourceQuantity / 40);
                                break;
                            case 'culture':
                                // 文化资源支持文化发展
                                attributeGrowth.culture += cell.population * 0.00006 * (resourceQuantity / 30);
                                attributeGrowth.economy += cell.population * 0.00002 * (resourceQuantity / 30);
                                break;
                            case 'rare':
                                // 稀有资源支持高级科技和军事发展
                                attributeGrowth.tech += cell.population * 0.00006 * (resourceQuantity / 20);
                                attributeGrowth.military += cell.population * 0.00005 * (resourceQuantity / 20);
                                break;
                        }
                        
                        // 应用属性增长
                        cell.tech = Math.min(cell.limits.tech, cell.tech + attributeGrowth.tech);
                        cell.economy = Math.min(cell.limits.economy, cell.economy + attributeGrowth.economy);
                        cell.military = Math.min(cell.limits.military, cell.military + attributeGrowth.military);
                        cell.culture = Math.min(cell.limits.culture, cell.culture + attributeGrowth.culture);
                    }
                    
                    // 5. 资源充足奖励：资源充足时给予属性加成
                    if (resourceQuantity > 15) {
                        switch(resource.type) {
                            case 'food':
                                cell.population *= 1.0005; // 人口极缓慢增长
                                break;
                            case 'mineral':
                                cell.economy *= 1.0008; // 经济极小幅提升
                                break;
                    case 'energy':
                        cell.tech *= 1.0008; // 科技极小幅提升
                        break;
                    case 'culture':
                        cell.culture *= 1.001; // 文化极小幅提升
                        break;
                    case 'rare':
                        cell.tech *= 1.001; // 科技极小幅提升
                        break;
                }
            }
            
            // 再次确保不超过格子限制
            const limits = cell.limits;
            cell.tech = Math.min(limits.tech, Math.max(0, cell.tech));
            cell.culture = Math.min(limits.culture, Math.max(0, cell.culture));
            cell.economy = Math.min(limits.economy, Math.max(0, cell.economy));
            cell.military = Math.min(limits.military, Math.max(0, cell.military));
            cell.population = Math.min(limits.population, Math.max(0, cell.population));
            
            // 检查人口是否为0，如果是则失去主人
            if (cell.population <= 0) {
                cell.owner = null;
                cell.isDisputed = false;
                cell.influence = {};
            }
        } else {
            // 没有资源的格子
            // 食物短缺处理：没有食物资源的格子，人口会缓慢减少
            const starvationDeaths = Math.floor(cell.population * 0.015); // 1.5%的人口因饥饿死亡 - 提高死亡率
            cell.population = Math.max(0, cell.population - starvationDeaths);
            
            // 资源短缺导致各项属性下降 - 增强下降幅度
            cell.tech *= 0.95;
            cell.culture *= 0.95;
            cell.economy *= 0.94;
            cell.military *= 0.95;
            
            // 检查人口是否为0，如果是则失去主人
            if (cell.population <= 0) {
                cell.owner = null;
                cell.isDisputed = false;
                cell.influence = {};
            }
        }
            }
        }
    }
    
    // 从格子属性汇总到文明属性
    aggregateCellAttributesToCivilizations() {
        this.civilizations.forEach(civ => {
            // 重置文明属性
            civ.tech = 0;
            civ.culture = 0;
            civ.economy = 0;
            civ.military = 0;
            civ.population = 0;
            
            // 汇总所有占领格子的属性
            for (let y = 0; y < this.map.rows; y++) {
                for (let x = 0; x < this.map.cols; x++) {
                    const territory = this.map.territory[y][x];
                    if (territory.owner === civ.id && !territory.isDisputed) {
                        // 汇总属性
                        civ.tech += territory.tech;
                        civ.culture += territory.culture;
                        civ.economy += territory.economy;
                        civ.military += territory.military;
                        civ.population += territory.population;
                    }
                }
            }
        });
    }
    
    // 计算文明的资源总量，从其占领的格子中汇总
    calculateCivilizationResources(civ) {
        const resources = {
            mineral: 0,
            food: 0,
            energy: 0,
            culture: 0,
            rare: 0
        };
        
        // 遍历所有格子，汇总该文明占领的格子资源
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                const territory = this.map.territory[y][x];
                if (territory.owner === civ.id && !territory.isDisputed && territory.resource) {
                    const resource = territory.resource;
                    resources[resource.type] += resource.quantity;
                }
            }
        }
        
        return resources;
    }
    
    // 检查并处理文明分裂
    checkAndHandleCivilizationSplit() {
        // 文明数量上限
        const maxCivilizations = 10;
        
        // 如果已达到文明数量上限，不再处理分裂
        if (this.civilizations.length >= maxCivilizations) {
            return;
        }
        
        // 遍历所有文明，检查是否需要分裂
        for (let i = this.civilizations.length - 1; i >= 0; i--) {
            const civ = this.civilizations[i];
            
            // 检查是否在分裂冷却期
            if (civ.splitCooldown && civ.splitCooldown > 0) {
                civ.splitCooldown--;
                continue;
            }
            
            // 当稳定性低于30且不稳定年份超过10年时，文明可能分裂
            if (civ.stability < 30 && civ.unstableYears > 10) {
                // 随机决定是否分裂（30%概率，降低分裂频率）
                if (Math.random() < 0.3) {
                    this.splitCivilization(civ);
                }
            }
        }
    }
    
    // 分裂文明
    splitCivilization(civ) {
        // 寻找适合分裂的区域（使用现有的findSuitableAreaForRevival方法）
        const splitArea = this.map.findSuitableAreaForRevival();
        if (!splitArea) return;
        
        // 创建新文明
        const newCivId = Math.max(...this.civilizations.map(c => c.id)) + 1;
        const newCivName = `${civ.name}分裂国`;
        const newCiv = new Civilization(newCivId, newCivName);
        
        // 分配新文明的初始属性（原文明的一半）
        newCiv.tech = civ.tech * 0.5;
        newCiv.culture = civ.culture * 0.5;
        newCiv.economy = civ.economy * 0.5;
        newCiv.military = civ.military * 0.5;
        newCiv.population = civ.population * 0.5;
        
        // 资源由格子自动分配，不需要文明级别的资源分割
        
        // 更新原文明属性
        civ.tech *= 0.5;
        civ.culture *= 0.5;
        civ.economy *= 0.5;
        civ.military *= 0.5;
        civ.population *= 0.5;
        
        // 为原文明和新文明设置分裂冷却期
        civ.splitCooldown = 50; // 50个时间单位的冷却
        newCiv.splitCooldown = 50; // 新文明也需要冷却
        
        // 为新文明分配领土
        this.map.assignInitialTerritory(newCiv, splitArea.x, splitArea.y);
        
        // 添加新文明到列表
        this.civilizations.push(newCiv);
        
        // 初始化新文明与其他文明的关系
        this.civilizations.forEach(existingCiv => {
            if (existingCiv.id !== newCiv.id) {
                existingCiv.relations[newCiv.id] = Math.floor(Math.random() * 20 - 10); // 初始关系为-10到10
                newCiv.relations[existingCiv.id] = existingCiv.relations[newCiv.id];
            }
        });
        
        // 生成分裂事件
        this.events.push({
            year: this.currentYear,
            type: 'civilization_split',
            description: `${civ.name}因内部矛盾分裂成${newCivName}！`,
            triggeredBy: 'internal',
            affectedCivs: [civ.id, newCiv.id],
            impact: {
                civilizationSplit: true
            }
        });
    }
    
    // 更新文明间的关系 - 考虑策略因素
    updateCivilizationRelations() {
        // 检查文明分裂
        this.checkAndHandleCivilizationSplit();
        
        // 弱势文明联合机制
        this.checkAndHandleWeakCivAlliance();
        
        this.civilizations.forEach((civ1, i) => {
            this.civilizations.slice(i + 1).forEach(civ2 => {
                // 初始关系值
                let relation = civ1.relations[civ2.id];
                
                // 影响关系变化的因素
                const techDiff = Math.abs(civ1.tech - civ2.tech);
                const cultureDiff = Math.abs(civ1.culture - civ2.culture);
                const economyDiff = Math.abs(civ1.economy - civ2.economy);
                
                // 1. 技术差异影响（降低幅度）
                if (techDiff > 30) {
                    relation -= 0.2; // 技术差距过大导致关系恶化（原0.5）
                } else if (techDiff < 10) {
                    relation += 0.1; // 技术相近促进交流（原0.2）
                }
                
                // 2. 文化差异影响（降低幅度）
                if (cultureDiff > 30) {
                    relation -= 0.15; // 文化差异过大导致关系恶化（原0.3）
                } else if (cultureDiff < 15) {
                    relation += 0.15; // 文化相近促进友好（原0.3）
                }
                
                // 3. 经济差异影响（降低幅度）
                if (economyDiff > 40) {
                    relation -= 0.2; // 经济差距过大导致关系恶化（原0.4）
                }
                
                // 4. 策略影响关系
                const strategyFactor = this.calculateStrategyFactor(civ1, civ2);
                relation += strategyFactor * 0.5; // 降低策略影响幅度
                
                // 5. 关系稳定性机制：自然回归中性
                const neutralityPull = (0 - relation) * 0.05; // 向0值回归，每次更新5%
                relation += neutralityPull;
                
                // 6. 随机事件影响（降低幅度）
                const randomFactor = (Math.random() * 1 - 0.5); // ±0.5（原±1）
                relation += randomFactor;
                
                // 7. 限制关系值范围
                relation = Math.max(-100, Math.min(100, relation));
                
                // 8. 更新双方关系
                civ1.relations[civ2.id] = relation;
                civ2.relations[civ1.id] = relation;
            });
        });
    }
    
    // 检查并处理弱势文明联合
    checkAndHandleWeakCivAlliance() {
        // 找出最强文明
        let strongestCiv = null;
        let maxStrength = 0;
        
        this.civilizations.forEach(civ => {
            const strength = civ.tech + civ.culture + civ.economy + civ.military;
            if (strength > maxStrength) {
                maxStrength = strength;
                strongestCiv = civ;
            }
        });
        
        if (!strongestCiv) return;
        
        // 找出弱势文明（实力不到最强文明的一半）
        const weakCivs = this.civilizations.filter(civ => {
            const strength = civ.tech + civ.culture + civ.economy + civ.military;
            return strength < maxStrength * 0.5;
        });
        
        if (weakCivs.length < 2) return;
        
        // 弱势文明之间有更高的概率建立友好关系
        weakCivs.forEach((civ1, i) => {
            weakCivs.slice(i + 1).forEach(civ2 => {
                // 增加弱势文明之间的关系
                if (civ1.relations[civ2.id] < 50) {
                    civ1.relations[civ2.id] += 1;
                    civ2.relations[civ1.id] += 1;
                }
            });
        });
    }
    
    // 计算策略对关系的影响
    calculateStrategyFactor(civ1, civ2) {
        let factor = 0;
        
        // 扩张主义对其他文明关系的影响
        if (civ1.strategy === '扩张主义') {
            factor -= 0.5; // 扩张主义更具侵略性，关系更容易恶化
            // 对防御主义文明更敌对
            if (civ2.strategy === '防御主义') {
                factor -= 0.3;
            }
        }
        
        // 防御主义对其他文明关系的影响
        if (civ1.strategy === '防御主义') {
            factor += 0.2; // 防御主义更倾向于和平，关系更容易改善
            // 对扩张主义文明更警惕
            if (civ2.strategy === '扩张主义') {
                factor -= 0.4;
            }
        }
        
        // 文化主义对其他文明关系的影响
        if (civ1.strategy === '文化主义') {
            factor += 0.3; // 文化主义更倾向于交流，关系更容易改善
            // 对文化主义文明更友好
            if (civ2.strategy === '文化主义') {
                factor += 0.2;
            }
        }
        
        // 经济主义对其他文明关系的影响
        if (civ1.strategy === '经济主义') {
            factor += 0.2; // 经济主义更倾向于合作，关系更容易改善
            // 对经济主义文明更友好
            if (civ2.strategy === '经济主义') {
                factor += 0.2;
            }
        }
        
        // 平衡主义对其他文明关系的影响
        if (civ1.strategy === '平衡主义') {
            factor += 0.1; // 平衡主义更倾向于中立，关系稳定
        }
        
        return factor;
    }
    
    // 随机生成事件
    generateRandomEvent() {
        // 检查各种事件的发生条件
        if (this.checkWarConditions()) {
            this.triggerWarEvent();
        } else if (this.checkTradeConditions()) {
            this.triggerTradeEvent();
        } else if (this.checkDiplomaticConditions()) {
            this.triggerDiplomaticEvent();
        } else if (this.checkInternalConditions()) {
            this.triggerInternalEvent();
        } else if (this.checkGlobalConditions()) {
            this.triggerGlobalEvent();
        } else if (this.checkBalanceBreakEventConditions()) {
            // 检查平衡打破事件条件
            this.triggerBalanceBreakEvent();
        } else {
            // 如果没有满足条件的事件，生成一个基础事件
            this.triggerBasicEvent();
        }
        
        // 限制事件数量
        if (this.events.length > 50) {
            this.events.shift();
        }
    }
    
    // 触发打破平衡的事件
    triggerBalanceBreakEvent() {
        // 随机选择一个文明作为事件中心
        const centerCiv = this.civilizations[Math.floor(Math.random() * this.civilizations.length)];
        
        // 随机选择事件类型
        const eventTypes = [
            'tech_breakthrough', // 技术突破
            'cultural_revolution', // 文化革命
            'economic_boom', // 经济繁荣
            'military_innovation' // 军事革新
        ];
        
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        // 事件描述和影响
        let description = '';
        let impact = {};
        
        switch(eventType) {
            case 'tech_breakthrough':
                description = `${centerCiv.name}取得了重大技术突破，科技水平大幅提升！`;
                impact = {
                    civilization: centerCiv.name,
                    eventType: 'tech_breakthrough',
                    techBoost: 30 // 科技提升30点
                };
                // 应用影响
                centerCiv.tech += 30;
                break;
                
            case 'cultural_revolution':
                description = `${centerCiv.name}发生了文化革命，文化影响力显著增强！`;
                impact = {
                    civilization: centerCiv.name,
                    eventType: 'cultural_revolution',
                    cultureBoost: 30 // 文化提升30点
                };
                // 应用影响
                centerCiv.culture += 30;
                break;
                
            case 'economic_boom':
                description = `${centerCiv.name}经历了经济繁荣，经济实力大幅增长！`;
                impact = {
                    civilization: centerCiv.name,
                    eventType: 'economic_boom',
                    economyBoost: 30 // 经济提升30点
                };
                // 应用影响
                centerCiv.economy += 30;
                break;
                
            case 'military_innovation':
                description = `${centerCiv.name}进行了军事革新，军事实力显著提升！`;
                impact = {
                    civilization: centerCiv.name,
                    eventType: 'military_innovation',
                    militaryBoost: 30 // 军事提升30点
                };
                // 应用影响
                centerCiv.military += 30;
                break;
        }
        
        // 生成事件
        this.events.push({
            year: this.currentYear,
            type: 'balance_break',
            description: description,
            triggeredBy: 'system',
            affectedCivs: [centerCiv.id],
            impact: impact
        });
    }
    
    // 检查并生成灾难事件
    checkAndGenerateDisaster() {
        // 遍历所有灾难类型，根据概率生成灾难
        for (const [disasterType, disasterConfig] of Object.entries(this.disasterSystem.disasterTypes)) {
            // 随机检查是否生成该灾难
            if (Math.random() < disasterConfig.probability) {
                // 生成灾难
                this.generateDisaster(disasterType, disasterConfig);
            }
        }
        
        // 更新活跃灾难
        this.updateActiveDisasters();
    }
    
    // 生成灾难
    generateDisaster(disasterType, disasterConfig) {
        // 优先选择强势文明的领土作为灾难中心
        let centerX, centerY;
        
        // 计算文明实力，找出强势文明
        const civStrengths = this.civilizations.map(civ => {
            return {
                civ: civ,
                strength: civ.tech + civ.culture + civ.economy + civ.military
            };
        });
        
        // 按实力排序
        civStrengths.sort((a, b) => b.strength - a.strength);
        const strongCivs = civStrengths.slice(0, Math.min(2, civStrengths.length)); // 取前2个最强文明
        
        // 70%概率选择强势文明的领土，30%概率随机选择
        let selectedCiv = null;
        if (Math.random() < 0.7 && strongCivs.length > 0) {
            // 随机选择一个强势文明
            selectedCiv = strongCivs[Math.floor(Math.random() * strongCivs.length)].civ;
        }
        
        // 寻找适合的灾难中心
        let found = false;
        let attempts = 0;
        const maxAttempts = 20;
        
        while (!found && attempts < maxAttempts) {
            attempts++;
            
            if (selectedCiv) {
                // 在强势文明的领土内选择中心
                const civGridX = Math.floor(selectedCiv.x / this.map.cellSize);
                const civGridY = Math.floor(selectedCiv.y / this.map.cellSize);
                
                // 在文明中心周围随机选择位置
                const offsetX = Math.floor(Math.random() * 10) - 5;
                const offsetY = Math.floor(Math.random() * 10) - 5;
                centerX = Math.max(0, Math.min(this.map.cols - 1, civGridX + offsetX));
                centerY = Math.max(0, Math.min(this.map.rows - 1, civGridY + offsetY));
            } else {
                // 随机选择位置
                centerX = Math.floor(Math.random() * this.map.cols);
                centerY = Math.floor(Math.random() * this.map.rows);
            }
            
            // 确保地形适合该灾难
            const centerTerrain = this.map.mapCells[centerY][centerX];
            if (disasterConfig.terrainAffected.includes(centerTerrain)) {
                found = true;
            }
        }
        
        // 如果找不到适合的位置，使用随机位置
        if (!found) {
            centerX = Math.floor(Math.random() * this.map.cols);
            centerY = Math.floor(Math.random() * this.map.rows);
        }
        
        // 计算灾难影响范围（根据灾难严重程度）
        const severityRadius = {
            'medium': 3,
            'high': 5,
            'very_high': 7
        };
        const radius = severityRadius[disasterConfig.severity] || 3;
        
        // 创建灾难对象
        const disaster = {
            id: Date.now() + Math.random(), // 唯一ID
            type: disasterType,
            config: disasterConfig,
            centerX: centerX,
            centerY: centerY,
            radius: radius,
            duration: disasterConfig.duration,
            remainingDuration: disasterConfig.duration,
            affectedCells: this.getAffectedCells(centerX, centerY, radius, disasterConfig.terrainAffected)
        };
        
        // 添加到活跃灾难列表
        this.disasterSystem.activeDisasters.push(disaster);
        
        // 生成灾难事件
        this.events.push({
            year: this.currentYear,
            type: 'disaster',
            description: `${disasterConfig.name}袭击了世界！${disasterConfig.description}`,
            triggeredBy: 'natural',
            affectedCells: disaster.affectedCells,
            duration: disasterConfig.duration,
            impact: disasterConfig.impact
        });
        
        // 应用初始灾难影响
        this.applyDisasterImpact(disaster);
    }
    
    // 获取灾难影响的格子
    getAffectedCells(centerX, centerY, radius, terrainAffected) {
        const affectedCells = [];
        
        // 遍历半径范围内的所有格子
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                
                // 检查坐标是否在地图范围内
                if (x >= 0 && x < this.map.cols && y >= 0 && y < this.map.rows) {
                    // 计算距离，使用欧几里得距离
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    if (distance <= radius) {
                        // 检查地形是否适合该灾难
                        const terrain = this.map.mapCells[y][x];
                        if (terrainAffected.includes(terrain)) {
                            affectedCells.push({ x, y });
                        }
                    }
                }
            }
        }
        
        return affectedCells;
    }
    
    // 应用灾难影响
    applyDisasterImpact(disaster) {
        // 遍历所有受影响的格子
        disaster.affectedCells.forEach(cell => {
            const territory = this.map.territory[cell.y][cell.x];
            
            // 应用灾难影响到格子属性
            for (const [attr, impact] of Object.entries(disaster.config.impact)) {
                // 计算距离衰减（中心影响最大，边缘影响最小）
                const dx = cell.x - disaster.centerX;
                const dy = cell.y - disaster.centerY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const distanceFactor = Math.max(0, 1 - distance / disaster.radius);
                
                // 计算最终影响
                const finalImpact = impact * distanceFactor;
                
                // 应用到属性上
                territory[attr] = Math.max(0, territory[attr] * (1 + finalImpact));
            }
        });
    }
    
    // 更新活跃灾难
    updateActiveDisasters() {
        // 遍历所有活跃灾难
        for (let i = this.disasterSystem.activeDisasters.length - 1; i >= 0; i--) {
            const disaster = this.disasterSystem.activeDisasters[i];
            
            // 减少剩余持续时间
            disaster.remainingDuration--;
            
            if (disaster.remainingDuration > 0) {
                // 灾难仍在持续，继续应用影响
                this.applyDisasterImpact(disaster);
            } else {
                // 灾难结束，从活跃列表中移除
                this.disasterSystem.activeDisasters.splice(i, 1);
                
                // 生成灾难结束事件
                this.events.push({
                    year: this.currentYear,
                    type: 'disaster_end',
                    description: `${disaster.config.name}结束了，受影响地区开始恢复。`,
                    triggeredBy: 'natural',
                    affectedCells: disaster.affectedCells,
                    duration: 0,
                    impact: {}
                });
            }
        }
    }
    
    // 检查战争事件发生条件
    checkWarConditions() {
        // 至少需要两个文明
        if (this.civilizations.length < 2) {
            return false;
        }
        
        // 检查是否存在关系值低于-30且相邻的文明对
        for (let i = 0; i < this.civilizations.length; i++) {
            for (let j = i + 1; j < this.civilizations.length; j++) {
                const civ1 = this.civilizations[i];
                const civ2 = this.civilizations[j];
                
                // 关系值低于-30
                if (civ1.relations[civ2.id] < -30) {
                    // 至少一个文明军事力量超过50
                    if (civ1.military > 50 || civ2.military > 50) {
                        // 检查是否相邻
                        if (this.areCivilizationsAdjacent(civ1, civ2)) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }
    
    // 检查贸易事件发生条件
    checkTradeConditions() {
        // 至少需要两个文明
        if (this.civilizations.length < 2) {
            return false;
        }
        
        // 检查是否存在关系值高于30且相邻的文明对
        for (let i = 0; i < this.civilizations.length; i++) {
            for (let j = i + 1; j < this.civilizations.length; j++) {
                const civ1 = this.civilizations[i];
                const civ2 = this.civilizations[j];
                
                // 关系值高于30
                if (civ1.relations[civ2.id] > 30) {
                    // 双方经济实力均超过40
                    if (civ1.economy > 40 && civ2.economy > 40) {
                        // 检查是否相邻
                        if (this.areCivilizationsAdjacent(civ1, civ2)) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }
    
    // 检查外交事件发生条件
    checkDiplomaticConditions() {
        // 至少需要两个文明
        if (this.civilizations.length < 2) {
            return false;
        }
        
        // 检查是否存在关系值在-20到50之间且相邻的文明对
        for (let i = 0; i < this.civilizations.length; i++) {
            for (let j = i + 1; j < this.civilizations.length; j++) {
                const civ1 = this.civilizations[i];
                const civ2 = this.civilizations[j];
                
                // 关系值在-20到50之间
                if (civ1.relations[civ2.id] > -20 && civ1.relations[civ2.id] < 50) {
                    // 文化差异低于30
                    if (Math.abs(civ1.culture - civ2.culture) < 30) {
                        // 检查是否相邻
                        if (this.areCivilizationsAdjacent(civ1, civ2)) {
                            return true;
                        }
                    }
                }
            }
        }
        
        return false;
    }
    
    // 检查内部事件发生条件
    checkInternalConditions() {
        // 检查是否存在人口超过20000且综合实力超过100的文明
        for (const civ of this.civilizations) {
            if (civ.population > 20000 && (civ.tech + civ.culture + civ.economy + civ.military) > 100) {
                // 检查文明内部属性差异
                const avgAttribute = (civ.tech + civ.culture + civ.economy + civ.military) / 4;
                const maxAttribute = Math.max(civ.tech, civ.culture, civ.economy, civ.military);
                const minAttribute = Math.min(civ.tech, civ.culture, civ.economy, civ.military);
                
                // 属性差异超过30
                if (maxAttribute - minAttribute > 30) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    // 检查全球事件发生条件
    checkGlobalConditions() {
        // 游戏运行时间超过1000年，至少存在3个文明
        return this.currentYear > -2000 && this.civilizations.length >= 3 && Math.random() < 0.1; // 10%的概率，提高全球事件发生率
    }
    
    // 检查平衡状态事件条件
    checkBalanceBreakEventConditions() {
        // 当文明实力较为平衡时，有概率触发打破平衡的事件
        if (this.civilizations.length < 2) return false;
        
        // 计算文明实力差距
        const strengths = this.civilizations.map(civ => {
            return civ.tech + civ.culture + civ.economy + civ.military;
        });
        
        const maxStrength = Math.max(...strengths);
        const minStrength = Math.min(...strengths);
        const avgStrength = strengths.reduce((sum, s) => sum + s, 0) / strengths.length;
        
        // 当所有文明实力都在平均值的80%-120%之间时，认为处于平衡状态
        const isBalanced = strengths.every(s => s >= avgStrength * 0.8 && s <= avgStrength * 1.2);
        
        // 平衡状态下，有15%的概率触发打破平衡的事件
        return isBalanced && Math.random() < 0.15;
    }
    
    // 触发基础事件
    triggerBasicEvent() {
        const eventTypes = ['internal', 'diplomatic', 'global'];
        const randomEvent = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        let description = '';
        switch(randomEvent) {
            case 'internal':
                description = '一个文明内部发生了轻微的变化。';
                break;
            case 'diplomatic':
                description = '两个文明之间进行了一次普通的外交接触。';
                break;
            case 'global':
                description = '全球范围内发生了一次小型事件。';
                break;
        }
        
        this.events.push({
            year: this.currentYear,
            type: randomEvent,
            description: description,
            triggeredBy: 'random',
            affectedCells: [],
            duration: 0,
            impact: {}
        });
    }
    
    // 触发战争事件
    triggerWarEvent() {
        // 找到符合条件的文明对
        let warCivs = null;
        for (let i = 0; i < this.civilizations.length && !warCivs; i++) {
            for (let j = i + 1; j < this.civilizations.length && !warCivs; j++) {
                const civ1 = this.civilizations[i];
                const civ2 = this.civilizations[j];
                
                if (civ1.relations[civ2.id] < -30 && (civ1.military > 50 || civ2.military > 50) && this.areCivilizationsAdjacent(civ1, civ2)) {
                    warCivs = [civ1, civ2];
                }
            }
        }
        
        if (!warCivs) return;
        
        const [civ1, civ2] = warCivs;
        
        // 找到边境格子
        const borderCells = [];
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                const territory = this.map.territory[y][x];
                if (territory.owner === civ1.id) {
                    // 检查周围格子是否属于civ2
                    const neighbors = [
                        { x: x-1, y: y-1 }, { x: x, y: y-1 }, { x: x+1, y: y-1 },
                        { x: x-1, y: y },                     { x: x+1, y: y },
                        { x: x-1, y: y+1 }, { x: x, y: y+1 }, { x: x+1, y: y+1 }
                    ];
                    
                    for (const neighbor of neighbors) {
                        if (neighbor.x >= 0 && neighbor.x < this.map.cols && neighbor.y >= 0 && neighbor.y < this.map.rows) {
                            const neighborTerritory = this.map.territory[neighbor.y][neighbor.x];
                            if (neighborTerritory.owner === civ2.id) {
                                borderCells.push({ x, y });
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        if (borderCells.length === 0) return;
        
        // 选择一个战斗格子
        const battleCell = borderCells[Math.floor(Math.random() * borderCells.length)];
        const territory = this.map.territory[battleCell.y][battleCell.x];
        
        // 战斗效果
        const warImpact = {
            economy: -0.2, // 经济下降20%
            population: -0.1, // 人口下降10%
            military: 0.1 // 军事上升10%
        };
        
        territory.economy = Math.max(0, territory.economy * (1 + warImpact.economy));
        territory.population = Math.max(0, territory.population * (1 + warImpact.population));
        territory.military = Math.max(0, territory.military * (1 + warImpact.military));
        
        // 战争消耗资源：战斗区域及其周围格子资源减少
        const warZoneCells = [battleCell];
        // 添加周围格子到战争区域
        const neighbors = [
            { x: battleCell.x-1, y: battleCell.y-1 }, { x: battleCell.x, y: battleCell.y-1 }, { x: battleCell.x+1, y: battleCell.y-1 },
            { x: battleCell.x-1, y: battleCell.y },                     { x: battleCell.x+1, y: battleCell.y },
            { x: battleCell.x-1, y: battleCell.y+1 }, { x: battleCell.x, y: battleCell.y+1 }, { x: battleCell.x+1, y: battleCell.y+1 }
        ];
        
        neighbors.forEach(neighbor => {
            if (neighbor.x >= 0 && neighbor.x < this.map.cols && neighbor.y >= 0 && neighbor.y < this.map.rows) {
                warZoneCells.push(neighbor);
            }
        });
        
        // 战争消耗资源：每个战争区域格子资源减少
        warZoneCells.forEach(cell => {
            const warCell = this.map.territory[cell.y][cell.x];
            if (warCell.resource) {
                // 战争消耗该格子30%的资源 - 提高消耗
                warCell.resource.quantity = Math.max(1, Math.floor(warCell.resource.quantity * 0.7));
            }
        });
        
        // 确定胜利方
        const winner = civ1.military > civ2.military ? civ1 : civ2;
        const loser = winner === civ1 ? civ2 : civ1;
        
        // 胜利方获得资源奖励：从失败方领土获取资源
        const winnerResourceGain = {
            mineral: 0,
            food: 0,
            energy: 0,
            rare: 0
        };
        
        // 从失败方领土随机选择几个格子获取资源
        const loserCells = [];
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                const cell = this.map.territory[y][x];
                if (cell.owner === loser.id && !cell.isDisputed) {
                    loserCells.push(cell);
                }
            }
        }
        
        // 随机选择3个失败方格子获取资源
        for (let i = 0; i < 3 && loserCells.length > 0; i++) {
            const randomIndex = Math.floor(Math.random() * loserCells.length);
            const cell = loserCells[randomIndex];
            if (cell.resource) {
                    // 获取该格子10%的资源 - 降低掠夺比例
                    const resourceGain = Math.floor(cell.resource.quantity * 0.10);
                    winnerResourceGain[cell.resource.type] += resourceGain;
                    // 减少失败方资源
                    cell.resource.quantity = Math.max(1, cell.resource.quantity - resourceGain);
                }
            // 移除已处理的格子
            loserCells.splice(randomIndex, 1);
        }
        
        // 胜利方军事上升5%，但限制影响范围
        winner.military *= 1.05;
        
        // 降低双方关系
        civ1.relations[civ2.id] -= 20;
        civ2.relations[civ1.id] -= 20;
        
        // 限制关系值范围
        civ1.relations[civ2.id] = Math.max(-100, civ1.relations[civ2.id]);
        civ2.relations[civ1.id] = Math.max(-100, civ2.relations[civ1.id]);
        
        // 添加事件
        this.events.push({
            year: this.currentYear,
            type: 'war',
            description: `${civ1.name}与${civ2.name}在边境地区发生了战争，${winner.name}获得了胜利，掠夺了${winnerResourceGain.mineral}矿产、${winnerResourceGain.food}食物、${winnerResourceGain.energy}能源和${winnerResourceGain.rare}稀有资源！`,
            triggeredBy: 'relations',
            affectedCells: [battleCell],
            duration: 0,
            impact: {
                civilization1: civ1.name,
                civilization2: civ2.name,
                winner: winner.name,
                loser: loser.name,
                cellImpact: warImpact,
                resourceGain: winnerResourceGain
            }
        });
    }
    
    // 触发贸易事件
    triggerTradeEvent() {
        // 找到符合条件的文明对
        let tradeCivs = null;
        for (let i = 0; i < this.civilizations.length && !tradeCivs; i++) {
            for (let j = i + 1; j < this.civilizations.length && !tradeCivs; j++) {
                const civ1 = this.civilizations[i];
                const civ2 = this.civilizations[j];
                
                // 贸易条件：关系良好，经济和文化属性较高，相邻
                if (civ1.relations[civ2.id] > 30 && 
                    civ1.economy > 40 && civ2.economy > 40 && 
                    civ1.culture > 30 && civ2.culture > 30 && 
                    this.areCivilizationsAdjacent(civ1, civ2)) {
                    tradeCivs = [civ1, civ2];
                }
            }
        }
        
        if (!tradeCivs) return;
        
        const [civ1, civ2] = tradeCivs;
        
        // 找到边境格子
        const borderCells = [];
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                const territory = this.map.territory[y][x];
                if (territory.owner === civ1.id) {
                    // 检查周围格子是否属于civ2
                    const neighbors = [
                        { x: x-1, y: y-1 }, { x: x, y: y-1 }, { x: x+1, y: y-1 },
                        { x: x-1, y: y },                     { x: x+1, y: y },
                        { x: x-1, y: y+1 }, { x: x, y: y+1 }, { x: x+1, y: y+1 }
                    ];
                    
                    for (const neighbor of neighbors) {
                        if (neighbor.x >= 0 && neighbor.x < this.map.cols && neighbor.y >= 0 && neighbor.y < this.map.rows) {
                            const neighborTerritory = this.map.territory[neighbor.y][neighbor.x];
                            if (neighborTerritory.owner === civ2.id) {
                                borderCells.push({ x, y });
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        if (borderCells.length === 0) return;
        
        // 选择一个贸易格子
        const tradeCell = borderCells[Math.floor(Math.random() * borderCells.length)];
        const territory = this.map.territory[tradeCell.y][tradeCell.x];
        
        // 计算贸易效率：受双方经济和文化属性影响
        const tradeEfficiency = (civ1.economy + civ2.economy + civ1.culture + civ2.culture) / 400; // 贸易效率系数
        
        // 贸易效果：根据贸易效率调整
        const baseTradeImpact = {
            economy: 0.2, // 基础经济上升20%
            culture: 0.1 // 基础文化上升10%
        };
        
        const tradeImpact = {
            economy: baseTradeImpact.economy * tradeEfficiency,
            culture: baseTradeImpact.culture * tradeEfficiency
        };
        
        territory.economy = Math.min(territory.limits.economy, territory.economy * (1 + tradeImpact.economy));
        territory.culture = Math.min(territory.limits.culture, territory.culture * (1 + tradeImpact.culture));
        
        // 贸易获得资源：根据贸易效率和双方属性获得额外资源 - 降低获得量
        const resourceTypes = ['mineral', 'food', 'energy', 'rare'];
        const tradeResources = {
            mineral: Math.floor(7 * tradeEfficiency),   // 减少30%
            food: Math.floor(10.5 * tradeEfficiency), // 减少30%
            energy: Math.floor(8.4 * tradeEfficiency), // 减少30%
            rare: Math.floor(3.5 * tradeEfficiency)   // 减少30%
        };
        
        // 为贸易双方的领土添加资源
        const addTradeResources = (civId, resources) => {
            // 找到该文明的随机几个格子
            const civCells = [];
            for (let y = 0; y < this.map.rows; y++) {
                for (let x = 0; x < this.map.cols; x++) {
                    const cell = this.map.territory[y][x];
                    if (cell.owner === civId && !cell.isDisputed) {
                        civCells.push(cell);
                    }
                }
            }
            
            if (civCells.length === 0) return;
            
            // 随机选择3个格子添加资源
            for (let i = 0; i < 3; i++) {
                const randomCell = civCells[Math.floor(Math.random() * civCells.length)];
                if (randomCell.resource) {
                    // 如果格子已有资源，增加数量
                    const resourceType = randomCell.resource.type;
                    if (resources[resourceType]) {
                        randomCell.resource.quantity += Math.floor(resources[resourceType] / 3);
                        // 限制资源最大数量
                        const maxResourceQuantities = {
                            mineral: 120,
                            food: 150,
                            energy: 100,
                            rare: 60,
                            culture: 80
                        };
                        randomCell.resource.quantity = Math.min(maxResourceQuantities[resourceType], randomCell.resource.quantity);
                    }
                } else {
                    // 如果格子没有资源，随机添加一种资源
                    const randomResourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
                    const resourceInfo = this.map.resourceTypes[randomResourceType];
                    randomCell.resource = {
                        type: randomResourceType,
                        name: resourceInfo.name,
                        quantity: Math.floor(resources[randomResourceType] / 3),
                        effect: resourceInfo.effect,
                        color: resourceInfo.color
                    };
                }
            }
        };
        
        // 为双方文明添加贸易资源
        addTradeResources(civ1.id, tradeResources);
        addTradeResources(civ2.id, tradeResources);
        
        // 提升双方关系
        civ1.relations[civ2.id] += Math.floor(10 * tradeEfficiency);
        civ2.relations[civ1.id] += Math.floor(10 * tradeEfficiency);
        
        // 限制关系值范围
        civ1.relations[civ2.id] = Math.min(100, civ1.relations[civ2.id]);
        civ2.relations[civ1.id] = Math.min(100, civ2.relations[civ1.id]);
        
        // 添加事件
        this.events.push({
            year: this.currentYear,
            type: 'trade',
            description: `${civ1.name}与${civ2.name}在边境地区开展了贸易活动，双方获得了矿产${tradeResources.mineral}、食物${tradeResources.food}、能源${tradeResources.energy}和稀有资源${tradeResources.rare}！`,
            triggeredBy: 'relations',
            affectedCells: [tradeCell],
            duration: 0,
            impact: {
                civilization1: civ1.name,
                civilization2: civ2.name,
                cellImpact: tradeImpact,
                tradeResources: tradeResources,
                tradeEfficiency: tradeEfficiency
            }
        });
    }
    
    // 触发外交事件
    triggerDiplomaticEvent() {
        // 找到符合条件的文明对
        let diploCivs = null;
        for (let i = 0; i < this.civilizations.length && !diploCivs; i++) {
            for (let j = i + 1; j < this.civilizations.length && !diploCivs; j++) {
                const civ1 = this.civilizations[i];
                const civ2 = this.civilizations[j];
                
                if (civ1.relations[civ2.id] > -20 && civ1.relations[civ2.id] < 50 && Math.abs(civ1.culture - civ2.culture) < 30 && this.areCivilizationsAdjacent(civ1, civ2)) {
                    diploCivs = [civ1, civ2];
                }
            }
        }
        
        if (!diploCivs) return;
        
        const [civ1, civ2] = diploCivs;
        
        // 随机调整关系值
        const relationChange = Math.random() * 20 - 10; // -10到+10
        civ1.relations[civ2.id] += relationChange;
        civ2.relations[civ1.id] += relationChange;
        
        // 限制关系值范围
        civ1.relations[civ2.id] = Math.max(-100, Math.min(100, civ1.relations[civ2.id]));
        civ2.relations[civ1.id] = Math.max(-100, Math.min(100, civ2.relations[civ1.id]));
        
        // 外交事件效果描述
        let effectDesc = '';
        if (relationChange > 0) {
            effectDesc = `关系得到了改善。`;
        } else {
            effectDesc = `关系出现了恶化。`;
        }
        
        // 添加事件
        this.events.push({
            year: this.currentYear,
            type: 'diplomatic',
            description: `${civ1.name}与${civ2.name}进行了外交接触，${effectDesc}`,
            triggeredBy: 'relations',
            affectedCells: [],
            duration: 0,
            impact: {
                civilization1: civ1.name,
                civilization2: civ2.name,
                relationChange: Math.round(relationChange)
            }
        });
    }
    
    // 触发内部事件
    triggerInternalEvent() {
        // 找到符合条件的文明
        let targetCiv = null;
        for (const civ of this.civilizations) {
            if (civ.population > 20000 && (civ.tech + civ.culture + civ.economy + civ.military) > 100) {
                const avgAttribute = (civ.tech + civ.culture + civ.economy + civ.military) / 4;
                const maxAttribute = Math.max(civ.tech, civ.culture, civ.economy, civ.military);
                const minAttribute = Math.min(civ.tech, civ.culture, civ.economy, civ.military);
                
                if (maxAttribute - minAttribute > 30) {
                    targetCiv = civ;
                    break;
                }
            }
        }
        
        if (!targetCiv) return;
        
        // 收集文明所有格子
        const ownedCells = [];
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                const territory = this.map.territory[y][x];
                if (territory.owner === targetCiv.id && !territory.isDisputed) {
                    ownedCells.push({ x, y, cell: territory });
                }
            }
        }
        
        if (ownedCells.length < 2) return;
        
        // 计算平均属性
        const avgTech = ownedCells.reduce((sum, item) => sum + item.cell.tech, 0) / ownedCells.length;
        const avgCulture = ownedCells.reduce((sum, item) => sum + item.cell.culture, 0) / ownedCells.length;
        const avgEconomy = ownedCells.reduce((sum, item) => sum + item.cell.economy, 0) / ownedCells.length;
        const avgMilitary = ownedCells.reduce((sum, item) => sum + item.cell.military, 0) / ownedCells.length;
        
        // 找到高属性和低属性格子
        const highTechCells = ownedCells.filter(item => item.cell.tech > avgTech * 1.2);
        const lowTechCells = ownedCells.filter(item => item.cell.tech < avgTech * 0.8);
        
        const highCultureCells = ownedCells.filter(item => item.cell.culture > avgCulture * 1.2);
        const lowCultureCells = ownedCells.filter(item => item.cell.culture < avgCulture * 0.8);
        
        // 资源调度
        const affectedCells = [];
        
        // 调度科技资源
        if (highTechCells.length > 0 && lowTechCells.length > 0) {
            const sourceCell = highTechCells[Math.floor(Math.random() * highTechCells.length)];
            const targetCell = lowTechCells[Math.floor(Math.random() * lowTechCells.length)];
            const transferAmount = Math.min(sourceCell.cell.tech - avgTech * 1.2, targetCell.cell.limits.tech - targetCell.cell.tech);
            
            sourceCell.cell.tech -= transferAmount;
            targetCell.cell.tech += transferAmount;
            
            affectedCells.push(sourceCell, targetCell);
        }
        
        // 调度文化资源
        if (highCultureCells.length > 0 && lowCultureCells.length > 0) {
            const sourceCell = highCultureCells[Math.floor(Math.random() * highCultureCells.length)];
            const targetCell = lowCultureCells[Math.floor(Math.random() * lowCultureCells.length)];
            const transferAmount = Math.min(sourceCell.cell.culture - avgCulture * 1.2, targetCell.cell.limits.culture - targetCell.cell.culture);
            
            sourceCell.cell.culture -= transferAmount;
            targetCell.cell.culture += transferAmount;
            
            affectedCells.push(sourceCell, targetCell);
        }
        
        // 添加事件
        this.events.push({
            year: this.currentYear,
            type: 'internal',
            description: `${targetCiv.name}进行了内部资源调度，平衡了各地区的发展。`,
            triggeredBy: 'internal',
            affectedCells: affectedCells.map(item => ({ x: item.x, y: item.y })),
            duration: 0,
            impact: {
                civilization: targetCiv.name,
                action: 'resource_scheduling'
            }
        });
    }
    
    // 触发全球事件
    triggerGlobalEvent() {
        // 全球事件效果
        const globalEffect = Math.random() * 0.4 - 0.2; // -20% 到 +20%
        const affectedCells = [];
        
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                const territory = this.map.territory[y][x];
                if (territory.owner !== null) {
                    // 只影响有主格子
                    territory.tech = Math.max(0, Math.min(territory.limits.tech, territory.tech * (1 + globalEffect)));
                    territory.culture = Math.max(0, Math.min(territory.limits.culture, territory.culture * (1 + globalEffect)));
                    territory.economy = Math.max(0, Math.min(territory.limits.economy, territory.economy * (1 + globalEffect)));
                    territory.military = Math.max(0, Math.min(territory.limits.military, territory.military * (1 + globalEffect)));
                    territory.population = Math.max(0, Math.min(territory.limits.population, territory.population * (1 + globalEffect)));
                    
                    affectedCells.push({ x, y });
                }
            }
        }
        
        // 全球事件描述
        let effectDesc = '';
        if (globalEffect > 0) {
            effectDesc = `全球范围内出现了有利于发展的环境，所有文明都获得了增长。`;
        } else {
            effectDesc = `全球范围内遭遇了不利事件，所有文明都受到了影响。`;
        }
        
        // 添加事件
        this.events.push({
            year: this.currentYear,
            type: 'global',
            description: effectDesc,
            triggeredBy: 'global',
            affectedCells: affectedCells,
            duration: 0,
            impact: {
                globalEffect: Math.round(globalEffect * 100),
                affectedCivilizations: this.civilizations.length
            }
        });
    }
    
    // 演化逻辑
    evolve() {
        // 更新年份
        this.currentYear += 10;
        this.runningTime += this.getIntervalTime() / 60000;
        
        // 减少计算频率：每2次演化才进行一次完整计算
        const shouldDoFullCalculation = this.currentYear % 20 === 0;
        
        // 更新文明
        this.civilizations.forEach(civ => {
            civ.updateStats();
            // 文明内资源调度
            civ.scheduleResources(this.map);
        });
        
        // 检查并生成灾难事件
        if (shouldDoFullCalculation) {
            this.checkAndGenerateDisaster();
        }
        
        // 计算影响力和分配领土 - 减少频率
        if (shouldDoFullCalculation) {
            this.calculateInfluence();
            this.allocateTerritory();
        }
        
        // 更新格子属性
        if (shouldDoFullCalculation) {
            this.distributeCivAttributesToCells();
        }
        this.updateCellAttributes(); // 保持每次都更新，确保资源平衡
        
        // 从格子属性更新文明整体属性
        this.aggregateCellAttributesToCivilizations();
        
        // 更新文明间的关系
        if (shouldDoFullCalculation) {
            this.updateCivilizationRelations();
        }
        
        // 检查文明合并
        if (shouldDoFullCalculation) {
            for (let i = 0; i < this.civilizations.length; i++) {
                for (let j = i + 1; j < this.civilizations.length; j++) {
                    const civ1 = this.civilizations[i];
                    const civ2 = this.civilizations[j];
                    if (this.checkCivilizationMerge(civ1, civ2)) {
                        this.handleCivilizationMerge(civ1, civ2);
                        // 合并后重新检查关系
                        this.updateCivilizationRelations();
                        break;
                    }
                }
            }
        }
        
        // 检查文明分裂
        if (shouldDoFullCalculation) {
            for (let i = this.civilizations.length - 1; i >= 0; i--) {
                const civ = this.civilizations[i];
                if (this.checkCivilizationSplit(civ)) {
                    this.handleCivilizationSplit(civ);
                    // 分裂后重新计算影响力
                    this.calculateInfluence();
                    this.allocateTerritory();
                    break;
                }
            }
        }
        
        // 检查文明灭亡
        if (shouldDoFullCalculation) {
            for (let i = this.civilizations.length - 1; i >= 0; i--) {
                const civ = this.civilizations[i];
                if (this.checkCivilizationDeath(civ)) {
                    this.handleCivilizationDeath(civ);
                    // 灭亡后重新计算影响力
                    this.calculateInfluence();
                    this.allocateTerritory();
                }
            }
        }
        
        // 检查文明复兴
        if (shouldDoFullCalculation) {
            for (let i = 0; i < this.deadCivilizations.length; i++) {
                const deadCiv = this.deadCivilizations[i];
                if (this.checkCivilizationRevival(deadCiv)) {
                    this.handleCivilizationRevival(deadCiv);
                    // 复兴后重新计算影响力
                    this.calculateInfluence();
                    this.allocateTerritory();
                    break;
                }
            }
        }
        
        // 随机生成事件
        if (shouldDoFullCalculation) {
            this.generateRandomEvent();
        }
        
        // 更新UI - 减少频率
        if (shouldDoFullCalculation) {
            this.ui.updateUI();
            this.map.drawMap();
            this.ui.updateRelations();
            this.ui.updateDetails();
            this.ui.updateTimeline();
        }
    }
    
    // 开始模拟
    start() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        this.intervalId = setInterval(() => {
            this.evolve();
        }, this.getIntervalTime());
    }
    
    // 停止模拟
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }
    
    // 重启模拟
    restart() {
        this.stop();
        this.start();
    }
    
    // 根据速度获取间隔时间
    getIntervalTime() {
        switch(this.speed) {
            case 'slow':
                return 2000;
            case 'medium':
                return 1000;
            case 'fast':
                return 500;
            default:
                return 1000;
        }
    }
    
    // 格式化年份显示
    formatYear(year) {
        if (year < 0) {
            return `公元前${Math.abs(year)}年`;
        } else {
            return `${year}年`;
        }
    }
    
    // 检查文明是否满足灭亡条件
    checkCivilizationDeath(civ) {
        // 人口低于1000
        if (civ.population < 1000) {
            return true;
        }
        
        // 获取文明领土格子数
        const cellStats = this.getCivilizationCellStats(civ.id);
        if (cellStats.totalCells === 0) {
            return true;
        }
        
        // 综合实力（科技+文化+经济+军事）低于50
        const totalStrength = civ.tech + civ.culture + civ.economy + civ.military;
        if (totalStrength < 50) {
            return true;
        }
        
        // 连续10个时间单位（100年）处于衰退状态
        if (civ.declineYears >= 10) {
            return true;
        }
        
        return false;
    }
    
    // 处理文明灭亡
    handleCivilizationDeath(civ) {
        // 保存灭亡文明的历史数据
        this.deadCivilizations.push({
            id: civ.id,
            name: civ.name,
            deathYear: this.currentYear,
            peakTech: civ.peakTech,
            peakCulture: civ.peakCulture,
            peakEconomy: civ.peakEconomy,
            peakMilitary: civ.peakMilitary,
            peakPopulation: civ.peakPopulation,
            finalTech: civ.tech,
            finalCulture: civ.culture,
            finalEconomy: civ.economy,
            finalMilitary: civ.military,
            finalPopulation: civ.population,
            strategy: civ.strategy,
            territory: this.getCivilizationCellStats(civ.id)
        });
        
        // 从文明列表中移除
        const civIndex = this.civilizations.findIndex(c => c.id === civ.id);
        if (civIndex !== -1) {
            this.civilizations.splice(civIndex, 1);
        }
        
        // 更新地图上的领土归属
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                if (this.map.territory[y][x].owner === civ.id) {
                    this.map.territory[y][x].owner = null;
                    this.map.territory[y][x].isDisputed = false;
                }
            }
        }
        
        // 生成灭亡事件
        this.events.push({
            year: this.currentYear,
            type: 'collapse',
            description: `${civ.name}灭亡了！`,
            impact: {
                civilization: civ.name
            }
        });
        
        // 限制事件数量
        if (this.events.length > 50) {
            this.events.shift();
        }
    }
    
    // 检查文明是否满足复兴条件
    checkCivilizationRevival(deadCiv) {
        // 距离灭亡时间超过500年
        if (this.currentYear - deadCiv.deathYear < 500) {
            return false;
        }
        
        // 寻找适合复兴的无主区域
        const suitableArea = this.map.findSuitableAreaForRevival();
        if (!suitableArea) {
            return false;
        }
        
        // 检查周围文明实力
        const surroundingStrength = this.calculateSurroundingStrength(suitableArea.x, suitableArea.y);
        const peakStrength = deadCiv.peakTech + deadCiv.peakCulture + deadCiv.peakEconomy + deadCiv.peakMilitary;
        
        if (surroundingStrength > peakStrength * 0.3) {
            return false;
        }
        
        return true;
    }
    
    // 计算周围文明实力
    calculateSurroundingStrength(x, y) {
        let totalStrength = 0;
        const radius = 5;
        
        for (let dy = -radius; dy <= radius; dy++) {
            for (let dx = -radius; dx <= radius; dx++) {
                const newX = x + dx;
                const newY = y + dy;
                
                if (newX >= 0 && newX < this.map.cols && newY >= 0 && newY < this.map.rows) {
                    const territory = this.map.territory[newY][newX];
                    if (territory.owner !== null) {
                        const civ = this.civilizations.find(c => c.id === territory.owner);
                        if (civ) {
                            totalStrength += civ.tech + civ.culture + civ.economy + civ.military;
                        }
                    }
                }
            }
        }
        
        return totalStrength;
    }
    
    // 处理文明复兴
    handleCivilizationRevival(deadCiv) {
        // 寻找适合复兴的区域
        const suitableArea = this.map.findSuitableAreaForRevival();
        if (!suitableArea) {
            return;
        }
        
        // 创建新文明，继承原文明的部分属性
        const newId = this.civilizations.length + this.deadCivilizations.length + 1;
        // 处理名称，避免过长后缀
        const nameMatch = deadCiv.name.match(/^(.*?)(\d+)?$/);
        let baseName = nameMatch[1];
        let number = nameMatch[2] ? parseInt(nameMatch[2]) + 1 : 2;
        const newName = `${baseName}${number}`;
        const newCiv = new Civilization(newId, newName);
        
        // 继承原文明的部分属性（50%的巅峰值）
        newCiv.tech = deadCiv.peakTech * 0.5;
        newCiv.culture = deadCiv.peakCulture * 0.7; // 文化遗产保留更多
        newCiv.economy = deadCiv.peakEconomy * 0.5;
        newCiv.military = deadCiv.peakMilitary * 0.4;
        newCiv.population = deadCiv.peakPopulation * 0.3;
        
        // 添加到文明列表
        this.civilizations.push(newCiv);
        
        // 分配初始位置和领土
        newCiv.x = suitableArea.x * this.map.cellSize + this.map.cellSize / 2;
        newCiv.y = suitableArea.y * this.map.cellSize + this.map.cellSize / 2;
        this.map.assignInitialTerritory(newCiv, suitableArea.x, suitableArea.y);
        
        // 初始化文明间关系
        this.civilizations.forEach(civ => {
            if (civ.id !== newCiv.id) {
                newCiv.relations[civ.id] = Math.floor(Math.random() * 20 - 10);
                civ.relations[newCiv.id] = newCiv.relations[civ.id];
            }
        });
        
        // 生成复兴事件
        this.events.push({
            year: this.currentYear,
            type: 'revival',
            description: `${newName}在${deadCiv.name}的废墟上复兴了！`,
            impact: {
                civilization: newName
            }
        });
        
        // 限制事件数量
        if (this.events.length > 50) {
            this.events.shift();
        }
    }
    
    // 检查文明是否满足合并条件
    checkCivilizationMerge(civ1, civ2) {
        // 关系值高于80
        if (civ1.relations[civ2.id] < 80) {
            return false;
        }
        
        // 地理位置相邻（至少有一个相邻格子）
        if (!this.areCivilizationsAdjacent(civ1, civ2)) {
            return false;
        }
        
        // 文化差异低于20
        const cultureDiff = Math.abs(civ1.culture - civ2.culture);
        if (cultureDiff > 20) {
            return false;
        }
        
        // 经济差异低于30
        const economyDiff = Math.abs(civ1.economy - civ2.economy);
        if (economyDiff > 30) {
            return false;
        }
        
        // 双方均为非扩张主义策略
        if (civ1.strategy === '扩张主义' || civ2.strategy === '扩张主义') {
            return false;
        }
        
        return true;
    }
    
    // 检查两个文明是否相邻
    areCivilizationsAdjacent(civ1, civ2) {
        // 安全检查：确保map已初始化
        if (!this.map || !this.map.rows || !this.map.cols) {
            return false;
        }
        
        // 遍历所有格子，检查是否有相邻的领土
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                const territory = this.map.territory[y][x];
                if (territory.owner === civ1.id) {
                    // 检查周围8个格子
                    const neighbors = [
                        { x: x-1, y: y-1 }, { x: x, y: y-1 }, { x: x+1, y: y-1 },
                        { x: x-1, y: y },                     { x: x+1, y: y },
                        { x: x-1, y: y+1 }, { x: x, y: y+1 }, { x: x+1, y: y+1 }
                    ];
                    
                    for (const neighbor of neighbors) {
                        if (neighbor.x >= 0 && neighbor.x < this.map.cols && neighbor.y >= 0 && neighbor.y < this.map.rows) {
                            const neighborTerritory = this.map.territory[neighbor.y][neighbor.x];
                            if (neighborTerritory.owner === civ2.id) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        
        return false;
    }
    
    // 处理文明合并
    handleCivilizationMerge(civ1, civ2) {
        // 创建新文明，合并两个文明的属性
        const newId = this.civilizations.length + this.deadCivilizations.length + 1;
        // 简化合并文明的名称，避免过长
        const nameMatch1 = civ1.name.match(/^(.*?)(\d+)?$/);
        const nameMatch2 = civ2.name.match(/^(.*?)(\d+)?$/);
        const baseName1 = nameMatch1[1].replace(/(联盟|帝国|文明)$/, '');
        const baseName2 = nameMatch2[1].replace(/(联盟|帝国|文明)$/, '');
        const newName = `${baseName1}-${baseName2}联盟`;
        const newCiv = new Civilization(newId, newName);
        
        // 合并属性（取平均值）
        newCiv.tech = (civ1.tech + civ2.tech) / 2;
        newCiv.culture = (civ1.culture + civ2.culture) / 2;
        newCiv.economy = (civ1.economy + civ2.economy) / 2;
        newCiv.military = (civ1.military + civ2.military) / 2;
        newCiv.population = civ1.population + civ2.population;
        
        // 继承两个文明的遗产
        newCiv.inheritLegacy(civ1);
        newCiv.inheritLegacy(civ2);
        
        // 设置位置为两个文明的中心
        newCiv.x = (civ1.x + civ2.x) / 2;
        newCiv.y = (civ1.y + civ2.y) / 2;
        
        // 添加到文明列表
        this.civilizations.push(newCiv);
        
        // 继承原文明的领土
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                const territory = this.map.territory[y][x];
                if (territory.owner === civ1.id || territory.owner === civ2.id) {
                    territory.owner = newCiv.id;
                }
            }
        }
        
        // 初始化新文明的关系
        this.civilizations.forEach(civ => {
            if (civ.id !== newCiv.id) {
                // 继承原文明的平均关系
                const relation1 = civ1.relations[civ.id] || 0;
                const relation2 = civ2.relations[civ.id] || 0;
                newCiv.relations[civ.id] = (relation1 + relation2) / 2;
                civ.relations[newCiv.id] = newCiv.relations[civ.id];
            }
        });
        
        // 从文明列表中移除原文明
        this.civilizations = this.civilizations.filter(c => c.id !== civ1.id && c.id !== civ2.id);
        
        // 生成合并事件
        this.events.push({
            year: this.currentYear,
            type: 'merge',
            description: `${civ1.name}和${civ2.name}合并为${newName}！`,
            impact: {
                civilization: newName
            }
        });
        
        // 限制事件数量
        if (this.events.length > 50) {
            this.events.shift();
        }
    }
    
    // 检查文明是否满足分裂条件
    checkCivilizationSplit(civ) {
        // 领土格子数超过5000
        const cellStats = this.getCivilizationCellStats(civ.id);
        if (cellStats.totalCells < 5000) {
            return false;
        }
        
        // 不稳定状态持续5个时间单位（50年）
        if (civ.unstableYears < 5) {
            return false;
        }
        
        // 人口超过100000
        if (civ.population < 100000) {
            return false;
        }
        
        return true;
    }
    
    // 处理文明分裂
    handleCivilizationSplit(civ) {
        // 获取文明的所有领土
        const ownedCells = [];
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                if (this.map.territory[y][x].owner === civ.id && !this.map.territory[y][x].isDisputed) {
                    ownedCells.push({ x, y });
                }
            }
        }
        
        // 随机分成两部分
        this.shuffleArray(ownedCells);
        const halfIndex = Math.floor(ownedCells.length / 2);
        const part1 = ownedCells.slice(0, halfIndex);
        const part2 = ownedCells.slice(halfIndex);
        
        // 创建第二个文明
        const newId = this.civilizations.length + this.deadCivilizations.length + 1;
        // 处理名称，只进行数字递增
        const nameMatch = civ.name.match(/^(.*?)(\d+)?$/);
        let baseName = nameMatch[1];
        let number = nameMatch[2] ? parseInt(nameMatch[2]) + 1 : 2;
        const newName = `${baseName}${number}`;
        const newCiv = new Civilization(newId, newName);
        
        // 分配属性（原文明保留60%，新文明获得40%）
        newCiv.tech = civ.tech * 0.4;
        newCiv.culture = civ.culture * 0.4;
        newCiv.economy = civ.economy * 0.4;
        newCiv.military = civ.military * 0.4;
        newCiv.population = civ.population * 0.4;
        
        // 原文明保留剩余属性
        civ.tech *= 0.6;
        civ.culture *= 0.6;
        civ.economy *= 0.6;
        civ.military *= 0.6;
        civ.population *= 0.6;
        
        // 分裂双方都继承原文明的遗产
        newCiv.inheritLegacy(civ);
        
        // 设置新文明位置
        if (part2.length > 0) {
            const center = part2.reduce((sum, cell) => {
                return { x: sum.x + cell.x, y: sum.y + cell.y };
            }, { x: 0, y: 0 });
            center.x /= part2.length;
            center.y /= part2.length;
            newCiv.x = center.x * this.map.cellSize + this.map.cellSize / 2;
            newCiv.y = center.y * this.map.cellSize + this.map.cellSize / 2;
        }
        
        // 添加到文明列表
        this.civilizations.push(newCiv);
        
        // 分配领土
        part2.forEach(cell => {
            this.map.territory[cell.y][cell.x].owner = newCiv.id;
        });
        
        // 初始化文明间关系
        this.civilizations.forEach(c => {
            if (c.id !== civ.id && c.id !== newCiv.id) {
                newCiv.relations[c.id] = civ.relations[c.id] || 0;
                c.relations[newCiv.id] = newCiv.relations[c.id];
            }
        });
        
        // 分裂双方初始关系为敌对
        newCiv.relations[civ.id] = -50;
        civ.relations[newCiv.id] = -50;
        
        // 重置不稳定状态
        civ.isUnstable = false;
        civ.unstableYears = 0;
        
        // 生成分裂事件
        this.events.push({
            year: this.currentYear,
            type: 'split',
            description: `${civ.name}分裂为${civ.name}和${newName}！`,
            impact: {
                civilization: civ.name, newCivilization: newName
            }
        });
        
        // 限制事件数量
        if (this.events.length > 50) {
            this.events.shift();
        }
    }
    
    // 获取文明的格子统计信息
    getCivilizationCellStats(civId) {
        const stats = {
            totalCells: 0,
            disputedCells: 0,
            terrain: {
                plains: 0,
                forest: 0,
                hills: 0,
                mountains: 0,
                water: 0
            },
            avgAttributes: {
                tech: 0,
                culture: 0,
                economy: 0,
                military: 0,
                population: 0
            }
        };
        
        let totalTech = 0;
        let totalCulture = 0;
        let totalEconomy = 0;
        let totalMilitary = 0;
        let totalPopulation = 0;
        
        // 遍历所有格子
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                const territory = this.map.territory[y][x];
                const terrain = this.map.mapCells[y][x];
                
                if (territory.owner === civId) {
                    stats.totalCells++;
                    
                    if (territory.isDisputed) {
                        stats.disputedCells++;
                    }
                    
                    // 统计地形分布
                    if (stats.terrain[terrain] !== undefined) {
                        stats.terrain[terrain]++;
                    }
                    
                    // 累加属性
                    totalTech += territory.tech;
                    totalCulture += territory.culture;
                    totalEconomy += territory.economy;
                    totalMilitary += territory.military;
                    totalPopulation += territory.population;
                }
            }
        }
        
        // 计算平均属性
        if (stats.totalCells > 0) {
            stats.avgAttributes.tech = totalTech / stats.totalCells;
            stats.avgAttributes.culture = totalCulture / stats.totalCells;
            stats.avgAttributes.economy = totalEconomy / stats.totalCells;
            stats.avgAttributes.military = totalMilitary / stats.totalCells;
            stats.avgAttributes.population = totalPopulation / stats.totalCells;
        }
        
        return stats;
    }
    
    // 计算文明的重心位置

}