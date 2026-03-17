// 模拟器核心逻辑模块
class Simulator {
    constructor() {
        // 汉字库（用于生成文明名称）
        this.chineseCharacters = [
            '炎', '黄', '华', '夏', '商', '周', '秦', '汉', '唐', '宋',
            '元', '明', '清', '龙', '凤', '虎', '豹', '狼', '鹰', '狮',
            '云', '雷', '电', '风', '雨', '雪', '冰', '霜', '露', '雾',
            '山', '川', '江', '河', '海', '湖', '池', '泉', '溪', '潭',
            '金', '银', '铜', '铁', '玉', '珠', '宝', '石', '晶', '钻',
            '春', '夏', '秋', '冬', '晨', '暮', '星', '月', '日', '光',
            '东', '西', '南', '北', '中', '上', '下', '左', '右', '前',
            '天', '地', '人', '王', '帝', '皇', '君', '臣', '民', '士',
            '文', '武', '仁', '义', '礼', '智', '信', '勇', '忠', '孝',
            '和', '平', '安', '宁', '福', '禄', '寿', '喜', '财', '运'
        ];
        
        // 文明名称列表（初始文明）
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
        
        // 运行日志记录系统
        this.simulationLog = {
            startTime: null,
            endTime: null,
            records: [],
            summary: {
                totalYears: 0,
                totalEvents: 0,
                civilizationHistory: [],
                splitEvents: 0,
                mergeEvents: 0,
                warEvents: 0,
                deathEvents: 0
            }
        };
        
        // 灭亡文明历史记录
        this.deadCivilizations = [];
        
        // 灾难和环境事件系统
        this.disasterSystem = {
            disasterTypes: {
                flood: { 
                    name: '洪水', 
                    description: '大规模洪水淹没了低洼地区，破坏了农田和城市。',
                    probability: 0.03, // 降低到3%
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
                    probability: 0.02, // 降低到2%
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
                    probability: 0.025, // 降低到2.5%
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
                    probability: 0.015, // 降低到1.5%
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
                    probability: 0.008, // 降低到0.8%
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
    
    // 更新文明间的关系 - 考虑策略因素
    updateCivilizationRelations() {
        // 弱势文明联合机制
        this.checkAndHandleWeakCivAlliance();
        
        // 大文明竞争机制
        this.checkAndHandleGreatPowerCompetition();
        
        this.civilizations.forEach((civ1, i) => {
            this.civilizations.slice(i + 1).forEach(civ2 => {
                // 初始关系值（如果不存在则初始化为0）
                let relation = civ1.relations[civ2.id] !== undefined ? civ1.relations[civ2.id] : 0;
                
                // 影响关系变化的因素
                const techDiff = Math.abs(civ1.tech - civ2.tech);
                const cultureDiff = Math.abs(civ1.culture - civ2.culture);
                const economyDiff = Math.abs(civ1.economy - civ2.economy);
                
                // 1. 技术差异影响（增加负面影响）
                if (techDiff > 30) {
                    relation -= 1.5; // 技术差距过大导致关系恶化
                } else if (techDiff < 10) {
                    relation += 0.3; // 技术相近促进交流
                }
                
                // 2. 文化差异影响（增加负面影响）
                if (cultureDiff > 30) {
                    relation -= 1.2; // 文化差异过大导致关系恶化
                } else if (cultureDiff < 15) {
                    relation += 0.5; // 文化相近促进友好
                }
                
                // 3. 经济差异影响（增加负面影响）
                if (economyDiff > 40) {
                    relation -= 1.5; // 经济差距过大导致关系恶化
                }
                
                // 4. 领土竞争影响
                const civ1Cells = this.getCivilizationCellStats(civ1.id).totalCells;
                const civ2Cells = this.getCivilizationCellStats(civ2.id).totalCells;
                const totalCells = this.map.rows * this.map.cols;
                
                // 大文明之间竞争加剧
                if (civ1Cells > totalCells * 0.1 && civ2Cells > totalCells * 0.1) {
                    relation -= 2; // 两个大文明关系自然恶化
                }
                
                // 实力差距大的文明关系不稳定
                const strength1 = civ1.tech + civ1.culture + civ1.economy + civ1.military;
                const strength2 = civ2.tech + civ2.culture + civ2.economy + civ2.military;
                const strengthRatio = Math.max(strength1, strength2) / Math.min(strength1, strength2);
                if (strengthRatio > 3) {
                    relation -= 1; // 实力差距大导致不信任
                }
                
                // 5. 策略影响关系
                const strategyFactor = this.calculateStrategyFactor(civ1, civ2);
                relation += strategyFactor * 0.8;
                
                // 6. 关系稳定性机制：向负面偏移回归
                const neutralityPull = (20 - relation) * 0.03; // 向20值回归（略微负面偏移）
                relation += neutralityPull;
                
                // 7. 随机事件影响（增加负面波动）
                const randomFactor = (Math.random() * 3 - 1.5); // -1.5到+1.5，偏向负面
                relation += randomFactor;
                
                // 8. 限制关系值范围
                relation = Math.max(-100, Math.min(100, relation));
                
                // 9. 更新双方关系
                civ1.relations[civ2.id] = relation;
                civ2.relations[civ1.id] = relation;
            });
        });
    }
    
    // 检查并处理大文明竞争
    checkAndHandleGreatPowerCompetition() {
        const totalCells = this.map.rows * this.map.cols;
        
        // 找出大规模文明（领土占比超过10%）
        const greatPowers = this.civilizations.filter(civ => {
            const cellStats = this.getCivilizationCellStats(civ.id);
            return cellStats.totalCells > totalCells * 0.1;
        });
        
        if (greatPowers.length < 2) return;
        
        // 大文明之间关系恶化（竞争机制）
        greatPowers.forEach((civ1, i) => {
            greatPowers.slice(i + 1).forEach(civ2 => {
                // 大文明之间关系自然恶化
                const relation = civ1.relations[civ2.id];
                
                // 根据关系状态决定恶化程度
                if (relation < 0) {
                    civ1.relations[civ2.id] -= 4;
                    civ2.relations[civ1.id] -= 4;
                } else if (relation < 30) {
                    civ1.relations[civ2.id] -= 3;
                    civ2.relations[civ1.id] -= 3;
                } else {
                    civ1.relations[civ2.id] -= 2;
                    civ2.relations[civ1.id] -= 2;
                }
                
                // 限制关系值范围
                civ1.relations[civ2.id] = Math.max(-100, Math.min(100, civ1.relations[civ2.id]));
                civ2.relations[civ1.id] = Math.max(-100, Math.min(100, civ2.relations[civ1.id]));
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
    
    // 演化逻辑
    evolve() {
        // 更新年份
        this.currentYear += 10;
        this.runningTime += this.getIntervalTime() / 60000;
        
        // 减少计算频率：每2次演化才进行一次完整计算
        const shouldDoFullCalculation = this.currentYear % 20 === 0;
        
        // ========== 第一阶段：更新文明基础状态 ==========
        this.civilizations.forEach(civ => {
            civ.updateStats();
            // 文明内资源调度
            civ.scheduleResources(this.map);
            // 减少分裂冷却期
            if (civ.splitCooldown > 0) {
                civ.splitCooldown--;
            }
        });
        
        // ========== 第二阶段：灾难事件（世界事件） ==========
        if (shouldDoFullCalculation) {
            this.checkAndGenerateDisaster();
        }
        
        // ========== 第三阶段：计算影响力和分配领土 ==========
        if (shouldDoFullCalculation) {
            this.calculateInfluence();
            this.allocateTerritory();
        }
        
        // ========== 第四阶段：更新格子属性 ==========
        if (shouldDoFullCalculation) {
            this.distributeCivAttributesToCells();
        }
        this.updateCellAttributes();
        
        // 从格子属性更新文明整体属性
        this.aggregateCellAttributesToCivilizations();
        
        // 更新文明稳定性（基于格子数量）
        this.civilizations.forEach(civ => {
            const cellStats = this.getCivilizationCellStats(civ.id);
            civ.updateStabilityByCells(cellStats.totalCells);
        });
        
        // ========== 第五阶段：文明分裂和合并 ==========
        if (shouldDoFullCalculation) {
            this.processSplitAndMergeEvents();
        }
        
        // ========== 第六阶段：文明行为（按人口从大到小遍历） ==========
        if (shouldDoFullCalculation && this.civilizations.length > 0) {
            this.processCivilizationActions();
        }
        
        // ========== 第七阶段：文明灭亡检查 ==========
        if (shouldDoFullCalculation) {
            this.processCivilizationDeathEvents();
        }
        
        // ========== 第八阶段：文明复兴检查 ==========
        if (shouldDoFullCalculation) {
            this.processCivilizationRevivalEvents();
        }
        
        // ========== 第九阶段：更新UI ==========
        if (shouldDoFullCalculation) {
            this.ui.updateUI();
            this.map.drawMap();
            this.ui.updateRelations();
            this.ui.updateDetails();
            this.ui.updateTimeline();
        }
        
        // ========== 第十阶段：定期记录快照 ==========
        // 每100年记录一次快照
        if (this.currentYear % 100 === 0) {
            this.logCivilizationSnapshot();
        }
    }
    
    // 处理文明分裂和合并
    processSplitAndMergeEvents() {
        // 更新文明间的关系
        this.updateCivilizationRelations();
        
        // 检查文明合并（每轮最多处理3次合并）
        let mergeCount = 0;
        const maxMerges = 3;
        for (let i = 0; i < this.civilizations.length && mergeCount < maxMerges; i++) {
            for (let j = i + 1; j < this.civilizations.length && mergeCount < maxMerges; j++) {
                const civ1 = this.civilizations[i];
                const civ2 = this.civilizations[j];
                // 确保两个文明还存在
                if (this.civilizations.find(c => c.id === civ1.id) && 
                    this.civilizations.find(c => c.id === civ2.id)) {
                    if (this.checkCivilizationMerge(civ1, civ2)) {
                        this.handleCivilizationMerge(civ1, civ2);
                        // 合并后重新计算影响力和领土分配
                        this.calculateInfluence();
                        this.allocateTerritory();
                        this.updateCivilizationRelations();
                        mergeCount++;
                        // 重新开始循环，因为文明列表已改变
                        i = -1;
                        break;
                    }
                }
            }
        }
        
        // 检查文明分裂
        for (let i = this.civilizations.length - 1; i >= 0; i--) {
            const civ = this.civilizations[i];
            if (this.checkCivilizationSplit(civ)) {
                this.handleCivilizationSplit(civ);
                // 分裂时已经正确分配了领土和影响力，不需要重新计算
                break;
            }
        }
    }
    
    // 处理文明行为（按人口从大到小遍历）
    processCivilizationActions() {
        // 按人口从大到小排序
        const sortedCivilizations = [...this.civilizations].sort((a, b) => b.population - a.population);
        
        sortedCivilizations.forEach(civ => {
            // 检查该文明是否还存在（可能在前面的处理中被合并或灭亡）
            if (!this.civilizations.find(c => c.id === civ.id)) {
                return;
            }
            
            // 1. 检查发动各类事件的条件
            const possibleActions = this.checkCivilizationPossibleActions(civ);
            
            // 2. 根据策略、属性和关系决定行为概率
            const actionProbabilities = this.calculateActionProbabilities(civ, possibleActions);
            
            // 3. 随机决定这一轮发生什么行为
            const selectedAction = this.selectActionByProbability(actionProbabilities);
            
            // 4. 执行选中的行为并结算
            if (selectedAction) {
                this.executeCivilizationAction(civ, selectedAction);
            }
        });
    }
    
    // 检查文明可能发动的行为
    checkCivilizationPossibleActions(civ) {
        const actions = [];
        
        // 检查战争条件
        if (this.civilizations.length >= 2) {
            for (const otherCiv of this.civilizations) {
                if (otherCiv.id !== civ.id) {
                    if (civ.relations[otherCiv.id] < -30 && 
                        civ.military > 50 && 
                        this.areCivilizationsAdjacent(civ, otherCiv)) {
                        actions.push({ type: 'war', target: otherCiv });
                    }
                }
            }
        }
        
        // 检查贸易条件
        if (this.civilizations.length >= 2) {
            for (const otherCiv of this.civilizations) {
                if (otherCiv.id !== civ.id) {
                    if (civ.relations[otherCiv.id] > 30 && 
                        civ.economy > 40 && otherCiv.economy > 40 &&
                        this.areCivilizationsAdjacent(civ, otherCiv)) {
                        actions.push({ type: 'trade', target: otherCiv });
                    }
                }
            }
        }
        
        // 检查外交条件
        if (this.civilizations.length >= 2) {
            for (const otherCiv of this.civilizations) {
                if (otherCiv.id !== civ.id) {
                    if (civ.relations[otherCiv.id] >= -20 && 
                        civ.relations[otherCiv.id] <= 40 &&
                        civ.culture > 30) {
                        actions.push({ type: 'diplomatic', target: otherCiv });
                    }
                }
            }
        }
        
        // 检查内部事件条件
        if (civ.stability < 50 || civ.isDeclining) {
            actions.push({ type: 'internal', target: null });
        }
        
        // 扩张行为（总是可选）
        actions.push({ type: 'expand', target: null });
        
        // 发展行为（总是可选）
        actions.push({ type: 'develop', target: null });
        
        return actions;
    }
    
    // 计算行为概率
    calculateActionProbabilities(civ, possibleActions) {
        const probabilities = [];
        
        for (const action of possibleActions) {
            let probability = 0;
            
            switch (action.type) {
                case 'war':
                    // 军事征服策略更容易发动战争
                    if (civ.strategy === '军事征服') probability = 0.6;
                    else if (civ.strategy === '扩张主义') probability = 0.5;
                    else probability = 0.35;
                    // 军事属性加成
                    probability += civ.military / 250;
                    // 关系越差越容易战争（关系值越低，加成越高）
                    const relation = civ.relations[action.target.id] || 50;
                    probability += (100 - relation) / 100;
                    // 实力差距：强者更倾向于攻击弱者
                    const myStrength = civ.tech + civ.culture + civ.economy + civ.military;
                    const targetStrength = action.target.tech + action.target.culture + action.target.economy + action.target.military;
                    if (myStrength > targetStrength * 1.5) {
                        probability += 0.2;
                    }
                    if (myStrength > targetStrength * 2) {
                        probability += 0.15;
                    }
                    // 领土争夺：领土相邻且差距大时更容易战争
                    const myTerritory = this.getCivilizationCellStats(civ.id).totalCells;
                    const targetTerritory = this.getCivilizationCellStats(action.target.id).totalCells;
                    if (myTerritory > targetTerritory * 2) {
                        probability += 0.15;
                    }
                    // 目标稳定性低时更容易被攻击
                    if (action.target.stability < 50) {
                        probability += 0.1;
                    }
                    break;
                    
                case 'trade':
                    // 贸易优先策略更容易贸易
                    if (civ.strategy === '贸易优先') probability = 0.4;
                    else if (civ.strategy === '和平发展') probability = 0.3;
                    else probability = 0.15;
                    // 经济属性加成
                    probability += civ.economy / 600;
                    break;
                    
                case 'diplomatic':
                    // 和平发展策略更容易外交
                    if (civ.strategy === '和平发展') probability = 0.25;
                    else if (civ.strategy === '文化扩张') probability = 0.2;
                    else probability = 0.1;
                    // 文化属性加成
                    probability += civ.culture / 600;
                    break;
                    
                case 'internal':
                    // 稳定性越低越容易发生内部事件
                    probability = (100 - civ.stability) / 120;
                    if (civ.isDeclining) probability += 0.25;
                    break;
                    
                case 'expand':
                    // 扩张主义策略更容易扩张
                    if (civ.strategy === '扩张主义') probability = 0.35;
                    else if (civ.strategy === '军事征服') probability = 0.25;
                    else probability = 0.12;
                    // 军事和科技加成
                    probability += (civ.military + civ.tech) / 1000;
                    break;
                    
                case 'develop':
                    // 默认行为，概率降低
                    probability = 0.2;
                    // 和平发展策略更倾向于发展
                    if (civ.strategy === '和平发展') probability = 0.3;
                    break;
            }
            
            // 确保概率在合理范围内
            probability = Math.min(0.85, Math.max(0.05, probability));
            
            probabilities.push({
                action: action,
                probability: probability
            });
        }
        
        return probabilities;
    }
    
    // 根据概率选择行为
    selectActionByProbability(probabilities) {
        if (probabilities.length === 0) return null;
        
        // 计算总概率
        const totalProbability = probabilities.reduce((sum, p) => sum + p.probability, 0);
        
        // 随机选择
        let random = Math.random() * totalProbability;
        
        for (const p of probabilities) {
            random -= p.probability;
            if (random <= 0) {
                return p.action;
            }
        }
        
        return probabilities[probabilities.length - 1].action;
    }
    
    // 执行文明行为
    executeCivilizationAction(civ, action) {
        switch (action.type) {
            case 'war':
                this.executeWarAction(civ, action.target);
                break;
            case 'trade':
                this.executeTradeAction(civ, action.target);
                break;
            case 'diplomatic':
                this.executeDiplomaticAction(civ, action.target);
                break;
            case 'internal':
                this.executeInternalAction(civ);
                break;
            case 'expand':
                this.executeExpandAction(civ);
                break;
            case 'develop':
                this.executeDevelopAction(civ);
                break;
        }
        
        // 记录行为日志
        this.logRecord('action', {
            civilization: civ.name,
            actionType: action.type,
            target: action.target ? action.target.name : null
        });
    }
    
    // 执行战争行为
    executeWarAction(civ, targetCiv) {
        // 找到边境格子
        const borderCells = this.findBorderCells(civ, targetCiv);
        if (borderCells.length === 0) return;
        
        const battleCell = borderCells[Math.floor(Math.random() * borderCells.length)];
        const territory = this.map.territory[battleCell.y][battleCell.x];
        
        // 战斗效果
        const warImpact = {
            economy: -0.2,
            population: -0.1,
            military: 0.1
        };
        
        territory.economy = Math.max(0, territory.economy * (1 + warImpact.economy));
        territory.population = Math.max(0, territory.population * (1 + warImpact.population));
        territory.military = Math.max(0, territory.military * (1 + warImpact.military));
        
        // 确定胜利方（考虑军事实力和稳定性）
        const civStrength = civ.military * (1 + civ.stability / 100);
        const targetStrength = targetCiv.military * (1 + targetCiv.stability / 100);
        const winner = civStrength > targetStrength ? civ : targetCiv;
        const loser = winner === civ ? targetCiv : civ;
        
        // 战争对稳定性的影响（使用修正值）
        const winnerStabilityChange = 2 + Math.floor(Math.random() * 5);
        const loserStabilityChange = -(5 + Math.floor(Math.random() * 10));
        
        winner.addStabilityModifier(winnerStabilityChange);
        loser.addStabilityModifier(loserStabilityChange);
        
        // 胜利方获得领土
        if (territory.owner === loser.id) {
            territory.owner = winner.id;
            territory.isDisputed = false;
        }
        
        // 战争消耗资源
        civ.military *= 0.95;
        targetCiv.military *= 0.95;
        civ.population *= 0.98;
        targetCiv.population *= 0.98;
        
        // 记录战争事件日志
        this.logRecord('war', {
            attacker: civ.name,
            defender: targetCiv.name,
            winner: winner.name,
            loser: loser.name,
            territoryChange: territory.owner === winner.id ? 1 : 0
        });
        
        // 生成战争事件
        this.events.push({
            year: this.currentYear,
            type: 'war',
            description: `${civ.name}对${targetCiv.name}发动了战争！${winner.name}获胜。`,
            triggeredBy: civ.name,
            affectedCivs: [civ.id, targetCiv.id],
            impact: {
                winner: winner.name,
                loser: loser.name,
                winnerStabilityChange: winnerStabilityChange,
                loserStabilityChange: loserStabilityChange
            }
        });
        
        // 双方关系恶化
        civ.relations[targetCiv.id] -= 20;
        targetCiv.relations[civ.id] -= 20;
    }
    
    // 执行贸易行为
    executeTradeAction(civ, targetCiv) {
        // 找到边境格子
        const borderCells = this.findBorderCells(civ, targetCiv);
        if (borderCells.length === 0) return;
        
        const tradeCell = borderCells[Math.floor(Math.random() * borderCells.length)];
        const territory = this.map.territory[tradeCell.y][tradeCell.x];
        
        // 计算贸易效率
        const tradeEfficiency = (civ.economy + targetCiv.economy + civ.culture + targetCiv.culture) / 400;
        
        // 贸易效果
        const tradeImpact = {
            economy: 0.2 * tradeEfficiency,
            culture: 0.1 * tradeEfficiency
        };
        
        territory.economy = Math.min(territory.limits.economy, territory.economy * (1 + tradeImpact.economy));
        territory.culture = Math.min(territory.limits.culture, territory.culture * (1 + tradeImpact.culture));
        
        // 贸易带来稳定性提升（使用修正值）
        const stabilityBoost = 3 + Math.floor(Math.random() * 5);
        civ.addStabilityModifier(stabilityBoost);
        targetCiv.addStabilityModifier(stabilityBoost);
        
        // 生成贸易事件
        this.events.push({
            year: this.currentYear,
            type: 'trade',
            description: `${civ.name}与${targetCiv.name}进行了贸易往来。`,
            triggeredBy: civ.name,
            affectedCivs: [civ.id, targetCiv.id],
            impact: {
                economyBoost: tradeImpact.economy,
                cultureBoost: tradeImpact.culture,
                stabilityBoost: stabilityBoost
            }
        });
        
        // 双方关系改善
        civ.relations[targetCiv.id] += 10;
        targetCiv.relations[civ.id] += 10;
    }
    
    // 执行外交行为
    executeDiplomaticAction(civ, targetCiv) {
        // 外交效果
        const relationChange = Math.floor(Math.random() * 20) + 5;
        
        // 外交成功带来稳定性提升（使用修正值）
        const stabilityBoost = 2 + Math.floor(Math.random() * 4);
        civ.addStabilityModifier(stabilityBoost);
        targetCiv.addStabilityModifier(Math.floor(stabilityBoost / 2));
        
        // 生成外交事件
        this.events.push({
            year: this.currentYear,
            type: 'diplomatic',
            description: `${civ.name}与${targetCiv.name}进行了外交接触。`,
            triggeredBy: civ.name,
            affectedCivs: [civ.id, targetCiv.id],
            impact: {
                relationChange: relationChange,
                stabilityBoost: stabilityBoost
            }
        });
        
        // 双方关系改善
        civ.relations[targetCiv.id] += relationChange;
        targetCiv.relations[civ.id] += relationChange;
    }
    
    // 执行内部行为
    executeInternalAction(civ) {
        const eventTypes = ['政治改革', '经济调整', '文化运动', '科技研究'];
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
        
        let description = '';
        let impact = {};
        let stabilityBoost = 0;
        
        switch (eventType) {
            case '政治改革':
                description = `${civ.name}进行了政治改革。`;
                stabilityBoost = 5 + Math.floor(Math.random() * 10);
                civ.addStabilityModifier(stabilityBoost);
                impact = { stabilityChange: `+${stabilityBoost}` };
                break;
            case '经济调整':
                description = `${civ.name}进行了经济调整。`;
                stabilityBoost = 2 + Math.floor(Math.random() * 4);
                civ.addStabilityModifier(stabilityBoost);
                civ.economy += Math.random() * 5;
                impact = { economyChange: '+随机', stabilityChange: `+${stabilityBoost}` };
                break;
            case '文化运动':
                description = `${civ.name}兴起了文化运动。`;
                stabilityBoost = 2 + Math.floor(Math.random() * 4);
                civ.addStabilityModifier(stabilityBoost);
                civ.culture += Math.random() * 5;
                impact = { cultureChange: '+随机', stabilityChange: `+${stabilityBoost}` };
                break;
            case '科技研究':
                description = `${civ.name}投入了科技研究。`;
                stabilityBoost = 1 + Math.floor(Math.random() * 3);
                civ.addStabilityModifier(stabilityBoost);
                civ.tech += Math.random() * 5;
                impact = { techChange: '+随机', stabilityChange: `+${stabilityBoost}` };
                break;
        }
        
        this.events.push({
            year: this.currentYear,
            type: 'internal',
            description: description,
            triggeredBy: civ.name,
            affectedCivs: [civ.id],
            impact: impact
        });
    }
    
    // 执行扩张行为
    executeExpandAction(civ) {
        // 增加军事和科技投入
        civ.military += Math.random() * 3;
        civ.tech += Math.random() * 2;
        
        // 增加影响力
        const cellStats = this.getCivilizationCellStats(civ.id);
        if (cellStats.totalCells < this.map.rows * this.map.cols * 0.3) {
            civ.military += Math.random() * 2;
        }
        
        // 扩张对稳定性的影响：小规模扩张提升稳定性，大规模扩张略有下降（使用修正值）
        let stabilityChange;
        if (cellStats.totalCells < this.map.rows * this.map.cols * 0.1) {
            stabilityChange = 2 + Math.floor(Math.random() * 3);
        } else {
            stabilityChange = -1 + Math.floor(Math.random() * 3);
        }
        civ.addStabilityModifier(stabilityChange);
        
        this.events.push({
            year: this.currentYear,
            type: 'expand',
            description: `${civ.name}正在积极扩张领土。`,
            triggeredBy: civ.name,
            affectedCivs: [civ.id],
            impact: { militaryChange: '+随机', techChange: '+随机', stabilityChange: stabilityChange }
        });
    }
    
    // 执行发展行为
    executeDevelopAction(civ) {
        // 均衡发展
        civ.tech += Math.random() * 2;
        civ.culture += Math.random() * 2;
        civ.economy += Math.random() * 2;
        civ.military += Math.random() * 1;
        
        // 内部发展带来稳定性提升（使用修正值）
        const stabilityBoost = 5 + Math.floor(Math.random() * 8);
        civ.addStabilityModifier(stabilityBoost);
        
        this.events.push({
            year: this.currentYear,
            type: 'develop',
            description: `${civ.name}专注于内部发展。`,
            triggeredBy: civ.name,
            affectedCivs: [civ.id],
            impact: { allAttributes: '+随机', stabilityBoost: stabilityBoost }
        });
    }
    
    // 查找两个文明的边境格子
    findBorderCells(civ1, civ2) {
        const borderCells = [];
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                const territory = this.map.territory[y][x];
                if (territory.owner === civ1.id) {
                    const neighbors = [
                        { x: x-1, y: y-1 }, { x: x, y: y-1 }, { x: x+1, y: y-1 },
                        { x: x-1, y: y },                     { x: x+1, y: y },
                        { x: x-1, y: y+1 }, { x: x, y: y+1 }, { x: x+1, y: y+1 }
                    ];
                    
                    for (const neighbor of neighbors) {
                        if (neighbor.x >= 0 && neighbor.x < this.map.cols && 
                            neighbor.y >= 0 && neighbor.y < this.map.rows) {
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
        return borderCells;
    }
    
    // 处理文明灭亡事件
    processCivilizationDeathEvents() {
        for (let i = this.civilizations.length - 1; i >= 0; i--) {
            const civ = this.civilizations[i];
            if (this.checkCivilizationDeath(civ)) {
                this.handleCivilizationDeath(civ);
                this.calculateInfluence();
                this.allocateTerritory();
            }
        }
    }
    
    // 处理文明复兴事件
    processCivilizationRevivalEvents() {
        for (let i = 0; i < this.deadCivilizations.length; i++) {
            const deadCiv = this.deadCivilizations[i];
            if (this.checkCivilizationRevival(deadCiv)) {
                this.handleCivilizationRevival(deadCiv);
                this.calculateInfluence();
                this.allocateTerritory();
                break;
            }
        }
    }
    
    // 开始模拟
    start() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
        }
        
        // 初始化日志开始时间
        if (!this.simulationLog.startTime) {
            this.simulationLog.startTime = new Date().toISOString();
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
        
        // 记录日志结束时间
        this.simulationLog.endTime = new Date().toISOString();
    }
    
    // 重启模拟
    restart() {
        this.stop();
        this.start();
    }
    
    // 暂停模拟
    pause() {
        this.stop();
    }
    
    // 继续模拟
    resume() {
        if (!this.intervalId) {
            this.start();
        }
    }
    
    // 重置模拟
    reset() {
        this.stop();
        
        // 重置时间
        this.currentYear = -3000;
        this.runningTime = 0;
        this.events = [];
        this.deadCivilizations = [];
        
        // 重新生成文明
        const civCount = Math.floor(Math.random() * 4) + 2;
        this.civilizations = [];
        
        for (let i = 0; i < civCount; i++) {
            const name = this.civilizationNames[i % this.civilizationNames.length];
            const civ = new Civilization(i + 1, name);
            this.civilizations.push(civ);
        }
        
        // 重新初始化文明关系
        this.civilizations.forEach((civ1, i) => {
            this.civilizations.slice(i + 1).forEach(civ2 => {
                civ1.relations[civ2.id] = Math.floor(Math.random() * 40 - 20);
                civ2.relations[civ1.id] = civ1.relations[civ2.id];
            });
        });
        
        // 重新初始化地图系统
        this.map = new MapSystem(this);
        this.map.init();
        
        // 为每个文明分配固定位置
        this.assignCivilizationPositions();
        
        // 初始化文明属性到格子上
        this.distributeCivAttributesToCells();
        this.updateCellAttributes();
        
        // 更新UI
        this.initUI();
    }
    
    // ===== 日志记录系统 =====
    
    // 记录日志
    logRecord(type, data) {
        const record = {
            timestamp: new Date().toISOString(),
            year: this.currentYear,
            type: type,
            data: data
        };
        this.simulationLog.records.push(record);
        
        // 更新统计
        this.simulationLog.summary.totalYears = this.currentYear + 3000;
        switch(type) {
            case 'split':
                this.simulationLog.summary.splitEvents++;
                break;
            case 'merge':
                this.simulationLog.summary.mergeEvents++;
                break;
            case 'war':
                this.simulationLog.summary.warEvents++;
                break;
            case 'death':
                this.simulationLog.summary.deathEvents++;
                break;
        }
    }
    
    // 记录文明状态快照
    logCivilizationSnapshot() {
        const snapshot = {
            year: this.currentYear,
            civilizations: this.civilizations.map(civ => ({
                id: civ.id,
                name: civ.name,
                type: civ.type,
                strategy: civ.strategy,
                population: Math.floor(civ.population),
                tech: Math.floor(civ.tech),
                culture: Math.floor(civ.culture),
                economy: Math.floor(civ.economy),
                military: Math.floor(civ.military),
                stability: Math.floor(civ.stability),
                stabilityModifier: civ.stabilityModifier,
                isDeclining: civ.isDeclining,
                declineYears: civ.declineYears,
                isUnstable: civ.isUnstable,
                unstableYears: civ.unstableYears,
                territory: this.getCivilizationCellStats(civ.id).totalCells
            }))
        };
        this.simulationLog.summary.civilizationHistory.push(snapshot);
    }
    
    // 导出日志为JSON
    exportLog() {
        const logData = {
            ...this.simulationLog,
            finalState: {
                year: this.currentYear,
                civilizations: this.civilizations.map(civ => ({
                    id: civ.id,
                    name: civ.name,
                    type: civ.type,
                    strategy: civ.strategy,
                    population: Math.floor(civ.population),
                    tech: Math.floor(civ.tech),
                    culture: Math.floor(civ.culture),
                    economy: Math.floor(civ.economy),
                    military: Math.floor(civ.military),
                    stability: Math.floor(civ.stability),
                    territory: this.getCivilizationCellStats(civ.id).totalCells,
                    relations: { ...civ.relations }
                })),
                deadCivilizations: this.deadCivilizations.map(dc => ({
                    name: dc.name,
                    deathYear: dc.deathYear,
                    peakPopulation: Math.floor(dc.peakPopulation)
                }))
            },
            events: this.events.slice(-100)
        };
        
        return JSON.stringify(logData, null, 2);
    }
    
    // 下载日志文件
    downloadLog() {
        const logContent = this.exportLog();
        const blob = new Blob([logContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `civilization-simulation-log-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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
        // 获取文明领土格子数
        const cellStats = this.getCivilizationCellStats(civ.id);
        
        // 完全没有领土
        if (cellStats.totalCells === 0) {
            return true;
        }
        
        // 综合实力（科技+文化+经济+军事）
        const totalStrength = civ.tech + civ.culture + civ.economy + civ.military;
        
        // 计算领土占比
        const totalCells = this.map.rows * this.map.cols;
        const territoryRatio = cellStats.totalCells / totalCells;
        
        // 基础灭亡条件（非常严格）
        // 1. 人口低于50且综合实力低于10（极小文明）
        if (civ.population < 50 && totalStrength < 10) {
            return true;
        }
        
        // 小规模文明的灭亡条件（领土占比小于3%）
        if (territoryRatio < 0.03) {
            // 人口低于100且综合实力低于20
            if (civ.population < 100 && totalStrength < 20) {
                return true;
            }
            // 连续40个时间单位（400年）处于衰退状态
            if (civ.declineYears >= 40) {
                return true;
            }
            // 稳定性低于10（极度不稳定）
            if (civ.stability < 10) {
                return true;
            }
        }
        
        // 中等规模文明的灭亡条件（领土占比3%-10%）
        if (territoryRatio >= 0.03 && territoryRatio < 0.1) {
            // 人口低于300且综合实力低于40
            if (civ.population < 300 && totalStrength < 40) {
                return true;
            }
            // 连续60个时间单位（600年）处于衰退状态
            if (civ.declineYears >= 60) {
                return true;
            }
            // 稳定性低于5（极度不稳定）
            if (civ.stability < 5) {
                return true;
            }
        }
        
        // 大规模文明的灭亡条件（领土占比大于10%）
        if (territoryRatio >= 0.1) {
            // 人口低于800且综合实力低于70
            if (civ.population < 800 && totalStrength < 70) {
                return true;
            }
            // 连续100个时间单位（1000年）处于衰退状态
            if (civ.declineYears >= 100) {
                return true;
            }
            // 稳定性低于2（几乎不可能）
            if (civ.stability < 2) {
                return true;
            }
        }
        
        return false;
    }
    
    // 获取文明灭亡原因
    getDeathReason(civ) {
        const cellStats = this.getCivilizationCellStats(civ.id);
        const totalStrength = civ.tech + civ.culture + civ.economy + civ.military;
        const totalCells = this.map.rows * this.map.cols;
        const territoryRatio = cellStats.totalCells / totalCells;
        
        if (cellStats.totalCells === 0) {
            return '领土完全丧失';
        }
        if (civ.population < 50 && totalStrength < 10) {
            return '人口和实力过低';
        }
        if (territoryRatio < 0.03) {
            if (civ.population < 100 && totalStrength < 20) {
                return '小文明人口实力不足';
            }
            if (civ.declineYears >= 40) {
                return `长期衰退(${civ.declineYears}年)`;
            }
            if (civ.stability < 10) {
                return `稳定性过低(${Math.floor(civ.stability)})`;
            }
        }
        if (territoryRatio >= 0.03 && territoryRatio < 0.1) {
            if (civ.population < 300 && totalStrength < 40) {
                return '中等文明人口实力不足';
            }
            if (civ.declineYears >= 60) {
                return `长期衰退(${civ.declineYears}年)`;
            }
            if (civ.stability < 5) {
                return `稳定性过低(${Math.floor(civ.stability)})`;
            }
        }
        if (territoryRatio >= 0.1) {
            if (civ.declineYears >= 100) {
                return `长期衰退(${civ.declineYears}年)`;
            }
            if (civ.stability < 2) {
                return `稳定性过低(${Math.floor(civ.stability)})`;
            }
        }
        return '未知原因';
    }
    
    // 处理文明灭亡
    handleCivilizationDeath(civ) {
        // 记录灭亡日志
        this.logRecord('death', {
            civilization: civ.name,
            id: civ.id,
            population: Math.floor(civ.population),
            stability: Math.floor(civ.stability),
            territory: this.getCivilizationCellStats(civ.id).totalCells,
            reason: this.getDeathReason(civ)
        });
        
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
        // 距离灭亡时间超过1500年（从1000年提高到1500年）
        // 但如果所有文明都灭亡，只需要500年
        const minYears = this.civilizations.length === 0 ? 500 : 1500;
        if (this.currentYear - deadCiv.deathYear < minYears) {
            return false;
        }
        
        // 寻找适合复兴的无主区域
        const suitableArea = this.map.findSuitableAreaForRevival();
        if (!suitableArea) {
            return false;
        }
        
        // 检查周围文明实力（从0.5提高到0.7，更难复兴）
        const surroundingStrength = this.calculateSurroundingStrength(suitableArea.x, suitableArea.y);
        const peakStrength = deadCiv.peakTech + deadCiv.peakCulture + deadCiv.peakEconomy + deadCiv.peakMilitary;
        
        // 如果所有文明都灭亡，周围实力为0，直接通过
        if (this.civilizations.length > 0 && surroundingStrength > peakStrength * 0.7) {
            return false;
        }
        
        // 随机概率（20%概率复兴，从30%降低到20%）
        // 但如果所有文明都灭亡，提高到50%
        const revivalChance = this.civilizations.length === 0 ? 0.5 : 0.2;
        if (Math.random() > revivalChance) {
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
        const newName = deadCiv.name; // 复兴文明直接使用原名称
        const newCiv = new Civilization(newId, newName);
        
        // 继承原文明的部分属性（提高复兴文明的初始实力）
        newCiv.tech = deadCiv.peakTech * 0.7; // 从0.5提高到0.7
        newCiv.culture = deadCiv.peakCulture * 0.8; // 从0.7提高到0.8
        newCiv.economy = deadCiv.peakEconomy * 0.7; // 从0.5提高到0.7
        newCiv.military = deadCiv.peakMilitary * 0.6; // 从0.4提高到0.6
        newCiv.population = deadCiv.peakPopulation * 0.5; // 从0.3提高到0.5
        
        // 确保复兴文明有足够的基础属性
        newCiv.tech = Math.max(newCiv.tech, 30);
        newCiv.culture = Math.max(newCiv.culture, 30);
        newCiv.economy = Math.max(newCiv.economy, 30);
        newCiv.military = Math.max(newCiv.military, 20);
        newCiv.population = Math.max(newCiv.population, 2000);
        
        // 设置复兴文明的稳定性
        newCiv.stability = 60; // 复兴文明初始稳定性较高
        
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
        const civ1Cells = this.getCivilizationCellStats(civ1.id).totalCells;
        const civ2Cells = this.getCivilizationCellStats(civ2.id).totalCells;
        const totalCells = this.map.rows * this.map.cols;
        const smallCivThreshold = totalCells * 0.05;
        
        const smallerCiv = civ1Cells < civ2Cells ? civ1 : civ2;
        const largerCiv = civ1Cells < civ2Cells ? civ2 : civ1;
        const smallerCells = Math.min(civ1Cells, civ2Cells);
        
        // 计算实力
        const smallerStrength = smallerCiv.tech + smallerCiv.culture + smallerCiv.economy + smallerCiv.military;
        const largerStrength = largerCiv.tech + largerCiv.culture + largerCiv.economy + largerCiv.military;
        const strengthRatio = largerStrength / Math.max(1, smallerStrength);
        
        // ===== 场景1：小文明被吞并（分久必合核心机制）=====
        // 小文明（<5%领土）容易被吞并，但概率要低
        if (smallerCells < smallCivThreshold) {
            // 检查是否相邻或被包围
            const isAdjacent = this.areCivilizationsAdjacent(civ1, civ2);
            const isSurrounded = this.isCivilizationSurrounded(smallerCiv, largerCiv);
            
            if (!isAdjacent && !isSurrounded) {
                return false;
            }
            
            // 基础合并概率降低到5%
            let mergeProbability = 0.05;
            
            // 实力差距越大，合并概率越高
            if (strengthRatio > 10) mergeProbability = 0.15;
            else if (strengthRatio > 5) mergeProbability = 0.1;
            
            // 小文明不稳定时更容易被吞并
            if (smallerCiv.stability < 30) mergeProbability += 0.05;
            
            // 被包围时更容易被吞并
            if (isSurrounded) mergeProbability += 0.05;
            
            return Math.random() < mergeProbability;
        }
        
        // ===== 场景2：征服合并（实力差距导致）=====
        // 实力差距超过3倍才可能征服合并
        if (strengthRatio > 3) {
            // 检查是否相邻
            if (!this.areCivilizationsAdjacent(civ1, civ2)) {
                return false;
            }
            
            // 基础概率降低到3%
            let mergeProbability = 0.03;
            
            // 实力差距越大，概率越高
            if (strengthRatio > 8) mergeProbability = 0.08;
            else if (strengthRatio > 5) mergeProbability = 0.05;
            
            // 弱者稳定性低时更容易被征服
            if (smallerCiv.stability < 30) mergeProbability += 0.05;
            
            return Math.random() < mergeProbability;
        }
        
        // ===== 场景3：友好文明合并 =====
        // 检查是否相邻
        if (!this.areCivilizationsAdjacent(civ1, civ2)) {
            return false;
        }
        
        const relation = civ1.relations[civ2.id] || 0;
        // 关系要求提高到70
        if (relation >= 70) {
            const cultureDiff = Math.abs(civ1.culture - civ2.culture);
            const economyDiff = Math.abs(civ1.economy - civ2.economy);
            if (cultureDiff <= 30 && economyDiff <= 30) {
                if (civ1.strategy !== '扩张主义' && civ2.strategy !== '扩张主义') {
                    return Math.random() < 0.05;
                }
            }
        }
        
        return false;
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
                if (territory.owner === civ1.id && !territory.isDisputed) {
                    // 检查周围8个格子
                    const neighbors = [
                        { x: x-1, y: y-1 }, { x: x, y: y-1 }, { x: x+1, y: y-1 },
                        { x: x-1, y: y },                     { x: x+1, y: y },
                        { x: x-1, y: y+1 }, { x: x, y: y+1 }, { x: x+1, y: y+1 }
                    ];
                    
                    for (const neighbor of neighbors) {
                        if (neighbor.x >= 0 && neighbor.x < this.map.cols && neighbor.y >= 0 && neighbor.y < this.map.rows) {
                            const neighborTerritory = this.map.territory[neighbor.y][neighbor.x];
                            if (neighborTerritory.owner === civ2.id && !neighborTerritory.isDisputed) {
                                return true;
                            }
                        }
                    }
                }
            }
        }
        
        return false;
    }
    
    // 检查文明是否被另一个文明包围（用于合并判定）
    isCivilizationSurrounded(smallCiv, largeCiv) {
        if (!this.map || !this.map.rows || !this.map.cols) {
            return false;
        }
        
        let smallCivCells = 0;
        let surroundedCells = 0;
        
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                const territory = this.map.territory[y][x];
                if (territory.owner === smallCiv.id && !territory.isDisputed) {
                    smallCivCells++;
                    
                    // 检查周围8个格子
                    const neighbors = [
                        { x: x-1, y: y-1 }, { x: x, y: y-1 }, { x: x+1, y: y-1 },
                        { x: x-1, y: y },                     { x: x+1, y: y },
                        { x: x-1, y: y+1 }, { x: x, y: y+1 }, { x: x+1, y: y+1 }
                    ];
                    
                    let hasLargeCivNeighbor = false;
                    for (const neighbor of neighbors) {
                        if (neighbor.x >= 0 && neighbor.x < this.map.cols && 
                            neighbor.y >= 0 && neighbor.y < this.map.rows) {
                            const neighborTerritory = this.map.territory[neighbor.y][neighbor.x];
                            if (neighborTerritory.owner === largeCiv.id) {
                                hasLargeCivNeighbor = true;
                                break;
                            }
                        }
                    }
                    
                    if (hasLargeCivNeighbor) {
                        surroundedCells++;
                    }
                }
            }
        }
        
        // 如果超过50%的领土与大文明相邻，则认为被包围
        return smallCivCells > 0 && surroundedCells / smallCivCells > 0.5;
    }
    
    // 处理文明合并
    handleCivilizationMerge(civ1, civ2) {
        // 记录合并日志
        this.logRecord('merge', {
            civilization1: civ1.name,
            civilization2: civ2.name,
            newCivilization: `${civ1.name}-${civ2.name}联盟`,
            civ1Population: Math.floor(civ1.population),
            civ2Population: Math.floor(civ2.population),
            relation: civ1.relations[civ2.id]
        });
        
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
        
        // 从文明列表中移除原文明，但保存到灭亡文明列表以便复兴
        // 保存civ1到灭亡列表
        this.deadCivilizations.push({
            id: civ1.id,
            name: civ1.name,
            deathYear: this.currentYear,
            peakTech: civ1.peakTech,
            peakCulture: civ1.peakCulture,
            peakEconomy: civ1.peakEconomy,
            peakMilitary: civ1.peakMilitary,
            peakPopulation: civ1.peakPopulation,
            finalTech: civ1.tech,
            finalCulture: civ1.culture,
            finalEconomy: civ1.economy,
            finalMilitary: civ1.military,
            finalPopulation: civ1.population,
            strategy: civ1.strategy,
            territory: this.getCivilizationCellStats(civ1.id)
        });
        
        // 保存civ2到灭亡列表
        this.deadCivilizations.push({
            id: civ2.id,
            name: civ2.name,
            deathYear: this.currentYear,
            peakTech: civ2.peakTech,
            peakCulture: civ2.peakCulture,
            peakEconomy: civ2.peakEconomy,
            peakMilitary: civ2.peakMilitary,
            peakPopulation: civ2.peakPopulation,
            finalTech: civ2.tech,
            finalCulture: civ2.culture,
            finalEconomy: civ2.economy,
            finalMilitary: civ2.military,
            finalPopulation: civ2.population,
            strategy: civ2.strategy,
            territory: this.getCivilizationCellStats(civ2.id)
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
        // 领土格子数超过地图总格子数的15%
        const cellStats = this.getCivilizationCellStats(civ.id);
        const totalCells = this.map.rows * this.map.cols;
        const territoryRatio = cellStats.totalCells / totalCells;
        
        // 规模越大，分裂阈值越高（更容易分裂）
        let stabilityThreshold = 70;
        if (territoryRatio > 0.5) {
            stabilityThreshold = 75; // 占据50%以上领土，稳定性低于75可能分裂
        } else if (territoryRatio > 0.3) {
            stabilityThreshold = 70; // 占据30%以上领土，稳定性低于70可能分裂
        } else if (territoryRatio > 0.15) {
            stabilityThreshold = 65; // 占据15%以上领土，稳定性低于65可能分裂
        } else {
            return false; // 规模太小，不会分裂
        }
        
        if (civ.stability > stabilityThreshold) {
            return false;
        }
        
        // 不稳定状态持续3个时间单位（30年）才可分裂
        if (civ.unstableYears < 3) {
            return false;
        }
        
        // 人口超过地图总格子数*2（即3200）
        if (civ.population < totalCells * 2) {
            return false;
        }
        
        // 检查分裂冷却期
        if (civ.splitCooldown && civ.splitCooldown > 0) {
            return false;
        }
        
        // 随机因素：即使满足条件也有一定概率不分裂（40%概率分裂）
        if (Math.random() > 0.4) {
            return false;
        }
        
        return true;
    }
    
    // 处理文明分裂
    handleCivilizationSplit(civ) {
        // 记录分裂日志
        this.logRecord('split', {
            originalCivilization: civ.name,
            population: Math.floor(civ.population),
            stability: Math.floor(civ.stability),
            unstableYears: civ.unstableYears,
            territory: this.getCivilizationCellStats(civ.id).totalCells
        });
        
        // 获取文明的所有领土
        const ownedCells = [];
        for (let y = 0; y < this.map.rows; y++) {
            for (let x = 0; x < this.map.cols; x++) {
                if (this.map.territory[y][x].owner === civ.id && !this.map.territory[y][x].isDisputed) {
                    ownedCells.push({ x, y });
                }
            }
        }
        
        // 如果领土太少，不分裂
        if (ownedCells.length < 100) {
            return;
        }
        
        // 随机分成两部分
        this.shuffleArray(ownedCells);
        const halfIndex = Math.floor(ownedCells.length / 2);
        const part1 = ownedCells.slice(0, halfIndex);
        const part2 = ownedCells.slice(halfIndex);
        
        // 创建第二个文明
        const newId = this.civilizations.length + this.deadCivilizations.length + 1;
        const newName = this.generateCivilizationName();
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
        
        // 分配领土给新文明
        part2.forEach(cell => {
            this.map.territory[cell.y][cell.x].owner = newCiv.id;
            // 清除影响力，避免被allocateTerritory覆盖
            this.map.influence[cell.y][cell.x] = {};
            this.map.influence[cell.y][cell.x][newCiv.id] = 100;
        });
        
        // 更新原文明领土的影响力
        part1.forEach(cell => {
            this.map.influence[cell.y][cell.x] = {};
            this.map.influence[cell.y][cell.x][civ.id] = 100;
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
        
        // 设置分裂冷却期（20个时间单位 = 200年）
        civ.splitCooldown = 20;
        newCiv.splitCooldown = 20;
        
        // 分裂后提升原文明稳定性（暂时稳定）
        civ.stabilityModifier += 30;
        newCiv.stabilityModifier += 30;
        
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
    
    // 生成新的文明名称
    generateCivilizationName() {
        // 获取所有现有文明和已灭亡文明的名称
        const existingNames = new Set();
        this.civilizations.forEach(civ => existingNames.add(civ.name));
        this.deadCivilizations.forEach(deadCiv => existingNames.add(deadCiv.name));
        
        // 尝试生成不重复的名称（最多尝试100次）
        for (let attempt = 0; attempt < 100; attempt++) {
            // 随机选择两个汉字
            const char1 = this.chineseCharacters[Math.floor(Math.random() * this.chineseCharacters.length)];
            const char2 = this.chineseCharacters[Math.floor(Math.random() * this.chineseCharacters.length)];
            const newName = `${char1}${char2}文明`;
            
            // 检查是否重复
            if (!existingNames.has(newName)) {
                return newName;
            }
        }
        
        // 如果100次都没找到不重复的名称，使用时间戳
        return `文明${Date.now()}`;
    }
    
    // 计算文明的重心位置

}