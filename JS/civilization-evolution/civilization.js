// 文明类定义
class Civilization {
    constructor(id, name) {
        this.id = id;
        this.name = name;
        // 文明类型系统
        this.civilizationTypes = ['农耕文明', '游牧文明', '海洋文明', '山地文明', '商业文明'];
        this.type = this.civilizationTypes[Math.floor(Math.random() * this.civilizationTypes.length)];
        
        // 初始属性 - 基于文明类型
        const baseTech = Math.floor(Math.random() * 30) + 10;
        const baseCulture = Math.floor(Math.random() * 30) + 10;
        const baseEconomy = Math.floor(Math.random() * 30) + 10;
        const baseMilitary = Math.floor(Math.random() * 30) + 10;
        const basePopulation = Math.floor(Math.random() * 5000) + 8000;
        
        // 应用文明类型初始加成
        this.tech = baseTech + this.getTypeInitialBonus('tech');
        this.culture = baseCulture + this.getTypeInitialBonus('culture');
        this.economy = baseEconomy + this.getTypeInitialBonus('economy');
        this.military = baseMilitary + this.getTypeInitialBonus('military');
        this.population = basePopulation + this.getTypeInitialBonus('population');
        
        this.relations = {};
        // 文明位置
        this.x = 0;
        this.y = 0;
        // 文明历史位置（用于迁移）
        this.history = [{
            year: -3000,
            x: 0,
            y: 0
        }];
        // 文明策略
        this.strategies = ['扩张主义', '防御主义', '文化主义', '经济主义', '平衡主义'];
        this.strategy = this.strategies[Math.floor(Math.random() * this.strategies.length)];
        // 迁移相关属性
        this.hasMigrated = false;
        this.migrationCooldown = 0;
        this.migrationCost = 0;
        
        // 衰退状态
        this.isDeclining = false;
        this.declineYears = 0;
        
        // 不稳定状态（用于分裂）
        this.isUnstable = false;
        this.unstableYears = 0;
        
        // 分裂冷却期
        this.splitCooldown = 0;
        
        // 文明稳定性属性 - 新增
        this.stability = 100; // 初始稳定性为100
        this.maxStability = 100;
        this.minStability = 0;
        
        // 巅峰数据记录
        this.peakTech = this.tech;
        this.peakCulture = this.culture;
        this.peakEconomy = this.economy;
        this.peakMilitary = this.military;
        this.peakPopulation = this.population;
        
        // 文明遗产
        this.legacy = {
            achievements: [],
            culturalHeritage: [],
            technologicalLegacy: []
        };
    }
    
    // 获取文明类型的初始属性加成
    getTypeInitialBonus(attribute) {
        const typeBonuses = {
            '农耕文明': { tech: 0, culture: 5, economy: 10, military: 0, population: 2000 },
            '游牧文明': { tech: 0, culture: 0, economy: 5, military: 10, population: -1000 },
            '海洋文明': { tech: 5, culture: 0, economy: 15, military: 5, population: 0 },
            '山地文明': { tech: 10, culture: 10, economy: 0, military: 15, population: -2000 },
            '商业文明': { tech: 5, culture: 5, economy: 20, military: 0, population: 1000 }
        };
        return typeBonuses[this.type][attribute] || 0;
    }
    
    // 获取文明类型的增长加成
    getTypeGrowthBonus(attribute) {
        const typeGrowthBonuses = {
            '农耕文明': { tech: 0.8, culture: 1.2, economy: 1.5, military: 0.9, population: 1.3 },
            '游牧文明': { tech: 0.9, culture: 0.9, economy: 1.1, military: 1.4, population: 0.8 },
            '海洋文明': { tech: 1.2, culture: 1.0, economy: 1.6, military: 1.1, population: 1.0 },
            '山地文明': { tech: 1.3, culture: 1.4, economy: 0.8, military: 1.5, population: 0.7 },
            '商业文明': { tech: 1.1, culture: 1.1, economy: 1.7, military: 0.8, population: 1.1 }
        };
        return typeGrowthBonuses[this.type][attribute] || 1.0;
    }
    
    // 记录文明成就
    addAchievement(achievement, year) {
        this.legacy.achievements.push({
            achievement,
            year
        });
    }
    
    // 记录文化遗产
    addCulturalHeritage(heritage, year) {
        this.legacy.culturalHeritage.push({
            heritage,
            year
        });
    }
    
    // 记录技术遗产
    addTechnologicalLegacy(legacy, year) {
        this.legacy.technologicalLegacy.push({
            legacy,
            year
        });
    }
    
    // 继承其他文明的遗产
    inheritLegacy(otherCiv) {
        // 合并成就
        this.legacy.achievements = [...this.legacy.achievements, ...otherCiv.legacy.achievements];
        // 合并文化遗产
        this.legacy.culturalHeritage = [...this.legacy.culturalHeritage, ...otherCiv.legacy.culturalHeritage];
        // 合并技术遗产
        this.legacy.technologicalLegacy = [...this.legacy.technologicalLegacy, ...otherCiv.legacy.technologicalLegacy];
    }
    
    // 获取遗产对当前发展的加成
    getLegacyBonus(attribute) {
        // 技术遗产增加科技发展
        // 文化遗产增加文化发展
        // 成就增加整体发展
        const techBonus = this.legacy.technologicalLegacy.length * 0.05;
        const cultureBonus = this.legacy.culturalHeritage.length * 0.05;
        const achievementBonus = this.legacy.achievements.length * 0.02;
        
        switch(attribute) {
            case 'tech':
                return 1 + techBonus + achievementBonus;
            case 'culture':
                return 1 + cultureBonus + achievementBonus;
            case 'economy':
            case 'military':
                return 1 + achievementBonus;
            default:
                return 1;
        }
    }
    
    updateStats() {
        // 根据策略调整发展优先级
        const baseGrowth = Math.random() * 2 - 0.5;
        const strategyBonus = 1.5; // 策略加成
        
        // 基础增长
        let techGrowth = baseGrowth;
        let cultureGrowth = baseGrowth;
        let economyGrowth = baseGrowth;
        let militaryGrowth = baseGrowth;
        
        // 迁移冷却和成本处理
        if (this.migrationCooldown > 0) {
            this.migrationCooldown--;
            // 迁移后的增长惩罚
            techGrowth *= 0.8;
            cultureGrowth *= 0.8;
            economyGrowth *= 0.8;
            militaryGrowth *= 0.8;
        }
        
        // 策略优先增长
        switch(this.strategy) {
            case '扩张主义':
                militaryGrowth += Math.random() * 1.5; // 优先军事
                economyGrowth += Math.random() * 0.5; // 其次经济
                break;
            case '防御主义':
                militaryGrowth += Math.random() * 1.2; // 优先军事
                techGrowth += Math.random() * 0.5; // 其次科技
                break;
            case '文化主义':
                cultureGrowth += Math.random() * 1.5; // 优先文化
                techGrowth += Math.random() * 0.5; // 其次科技
                break;
            case '经济主义':
                economyGrowth += Math.random() * 1.5; // 优先经济
                cultureGrowth += Math.random() * 0.5; // 其次文化
                break;
            case '平衡主义':
                // 平衡发展，所有属性都有小幅加成
                techGrowth += Math.random() * 0.5;
                cultureGrowth += Math.random() * 0.5;
                economyGrowth += Math.random() * 0.5;
                militaryGrowth += Math.random() * 0.5;
                break;
        }
        
        // 应用文明类型增长加成
        techGrowth *= this.getTypeGrowthBonus('tech');
        cultureGrowth *= this.getTypeGrowthBonus('culture');
        economyGrowth *= this.getTypeGrowthBonus('economy');
        militaryGrowth *= this.getTypeGrowthBonus('military');
        
        // 应用遗产加成
        techGrowth *= this.getLegacyBonus('tech');
        cultureGrowth *= this.getLegacyBonus('culture');
        economyGrowth *= this.getLegacyBonus('economy');
        militaryGrowth *= this.getLegacyBonus('military');
        
        // 更新属性，移除上限限制（下限仍为0）
        const oldTech = this.tech;
        const oldCulture = this.culture;
        const oldEconomy = this.economy;
        const oldMilitary = this.military;
        const oldPopulation = this.population;
        
        this.tech = Math.max(0, this.tech + techGrowth);
        this.culture = Math.max(0, this.culture + cultureGrowth);
        this.economy = Math.max(0, this.economy + economyGrowth);
        this.military = Math.max(0, this.military + militaryGrowth);
        
        // 人口增长受经济和科技影响，并应用文明类型加成
        const populationGrowthBase = (this.economy * 0.01 + this.tech * 0.005) * 100;
        const populationGrowth = populationGrowthBase * this.getTypeGrowthBonus('population');
        this.population = Math.max(0, this.population + populationGrowth);
        
        // 更新巅峰数据
        if (this.tech > this.peakTech) this.peakTech = this.tech;
        if (this.culture > this.peakCulture) this.peakCulture = this.culture;
        if (this.economy > this.peakEconomy) this.peakEconomy = this.economy;
        if (this.military > this.peakMilitary) this.peakMilitary = this.military;
        if (this.population > this.peakPopulation) this.peakPopulation = this.population;
        
        // 检查衰退状态
        // 如果主要属性连续下降，标记为衰退
        const isDecliningNow = this.tech < oldTech && this.culture < oldCulture && this.economy < oldEconomy && this.military < oldMilitary;
        
        if (isDecliningNow) {
            this.declineYears++;
            this.isDeclining = this.declineYears >= 3;
        } else {
            this.declineYears = 0;
            this.isDeclining = false;
        }
        
        // 检查不稳定状态（用于分裂）
        // 当人口超过一定规模且各项属性差距较大时，标记为不稳定
        const totalAttribute = this.tech + this.culture + this.economy + this.military;
        const avgAttribute = totalAttribute / 4;
        const attributeVariance = Math.abs(this.tech - avgAttribute) + Math.abs(this.culture - avgAttribute) + Math.abs(this.economy - avgAttribute) + Math.abs(this.military - avgAttribute);
        
        this.isUnstable = this.population > 50000 && attributeVariance > 100;
        
        if (this.isUnstable) {
            this.unstableYears++;
        } else {
            this.unstableYears = 0;
        }
        
        // 计算文明稳定性 - 新增
        // 1. 基础稳定性：受文明规模影响，规模越大稳定性越低
        const sizePenalty = Math.min(50, Math.floor(this.population / 10000)); // 每10000人口降低最多50点稳定性
        
        // 2. 属性平衡度影响：属性越不平衡稳定性越低
        const balancePenalty = Math.min(30, Math.floor(attributeVariance / 10)); // 属性方差越大，稳定性越低
        
        // 3. 衰退状态影响：衰退状态降低稳定性
        const declinePenalty = this.isDeclining ? 20 : 0;
        
        // 4. 迁移状态影响：迁移后稳定性下降
        const migrationPenalty = this.migrationCooldown > 0 ? 15 : 0;
        
        // 5. 资源充足程度影响：通过格子属性间接影响稳定性
        let resourceBonus = 0;
        
        // 计算最终稳定性
        this.stability = 100 - sizePenalty - balancePenalty - declinePenalty - migrationPenalty + resourceBonus;
        
        // 确保稳定性在合理范围内
        this.stability = Math.max(this.minStability, Math.min(this.maxStability, this.stability));
    }
    
    // 文明内资源调度方法
    scheduleResources(map) {
        // 收集文明所有格子
        const ownedCells = [];
        for (let y = 0; y < map.rows; y++) {
            for (let x = 0; x < map.cols; x++) {
                const territory = map.territory[y][x];
                if (territory.owner === this.id && !territory.isDisputed) {
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
        
        const highEconomyCells = ownedCells.filter(item => item.cell.economy > avgEconomy * 1.2);
        const lowEconomyCells = ownedCells.filter(item => item.cell.economy < avgEconomy * 0.8);
        
        const highMilitaryCells = ownedCells.filter(item => item.cell.military > avgMilitary * 1.2);
        const lowMilitaryCells = ownedCells.filter(item => item.cell.military < avgMilitary * 0.8);
        
        // 属性调度函数
        const transferAttribute = (highCells, lowCells, attributeName) => {
            if (highCells.length === 0 || lowCells.length === 0) return;
            
            const sourceCell = highCells[Math.floor(Math.random() * highCells.length)];
            const targetCell = lowCells[Math.floor(Math.random() * lowCells.length)];
            
            // 计算可转移量
            const sourceAttribute = sourceCell.cell[attributeName];
            const targetAttribute = targetCell.cell[attributeName];
            const targetLimit = targetCell.cell.limits[attributeName];
            
            // 从高属性格子转移10%的属性到低属性格子
            const transferAmount = Math.min(
                sourceAttribute * 0.1, // 最多转移10%
                targetLimit - targetAttribute // 不超过目标格子的上限
            );
            
            if (transferAmount > 0) {
                sourceCell.cell[attributeName] -= transferAmount;
                targetCell.cell[attributeName] += transferAmount;
            }
        };
        
        // 调度各种属性
        transferAttribute(highTechCells, lowTechCells, 'tech');
        transferAttribute(highCultureCells, lowCultureCells, 'culture');
        transferAttribute(highEconomyCells, lowEconomyCells, 'economy');
        transferAttribute(highMilitaryCells, lowMilitaryCells, 'military');
        
        // 资源调度：实现相邻格子间的资源流动
        const resourceTransferAttempts = Math.floor(ownedCells.length * 0.1); // 10%的格子尝试资源转移
        
        for (let i = 0; i < resourceTransferAttempts; i++) {
            // 随机选择一个源格子
            const sourceIndex = Math.floor(Math.random() * ownedCells.length);
            const sourceCell = ownedCells[sourceIndex];
            
            // 检查源格子是否有资源
            if (!sourceCell.cell.resource) continue;
            
            // 找到相邻格子
            const neighbors = [
                { x: sourceCell.x-1, y: sourceCell.y-1 }, { x: sourceCell.x, y: sourceCell.y-1 }, { x: sourceCell.x+1, y: sourceCell.y-1 },
                { x: sourceCell.x-1, y: sourceCell.y },                     { x: sourceCell.x+1, y: sourceCell.y },
                { x: sourceCell.x-1, y: sourceCell.y+1 }, { x: sourceCell.x, y: sourceCell.y+1 }, { x: sourceCell.x+1, y: sourceCell.y+1 }
            ];
            
            // 过滤出相邻的、同属主的、无争议的格子
            const validNeighbors = neighbors.filter(neighbor => {
                if (neighbor.x < 0 || neighbor.x >= map.cols || neighbor.y < 0 || neighbor.y >= map.rows) return false;
                const neighborCell = map.territory[neighbor.y][neighbor.x];
                return neighborCell.owner === this.id && !neighborCell.isDisputed;
            });
            
            if (validNeighbors.length === 0) continue;
            
            // 随机选择一个目标格子
            const targetNeighbor = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
            const targetCell = map.territory[targetNeighbor.y][targetNeighbor.x];
            
            // 检查目标格子是否需要资源
            const sourceResource = sourceCell.cell.resource;
            let targetResource = targetCell.resource;
            
            // 如果目标格子没有资源，或者资源类型相同但数量较少，则进行转移
            if (!targetResource || (targetResource.type === sourceResource.type && targetResource.quantity < sourceResource.quantity)) {
                // 计算可转移的资源量（最多转移源资源的20%）
                const transferAmount = Math.floor(sourceResource.quantity * 0.2);
                
                if (transferAmount > 0) {
                    // 资源转移有成本：5%的资源在转移过程中损失
                    const transferCost = Math.floor(transferAmount * 0.05);
                    const actualTransfer = transferAmount - transferCost;
                    
                    // 源格子减少资源
                    sourceCell.cell.resource.quantity -= transferAmount;
                    
                    // 目标格子增加资源
                    if (!targetResource) {
                        // 如果目标格子没有资源，创建一个新的资源
                        targetCell.resource = {
                            type: sourceResource.type,
                            name: sourceResource.name,
                            quantity: actualTransfer,
                            effect: sourceResource.effect,
                            color: sourceResource.color
                        };
                    } else {
                        // 如果目标格子已有资源，增加数量
                        targetCell.resource.quantity += actualTransfer;
                    }
                }
            }
        }
    }
    
    // 文明迁移方法
    migrate(newX, newY, year) {
        // 记录迁移前的位置
        this.history.push({
            year: year,
            x: this.x,
            y: this.y
        });
        
        // 更新文明位置
        this.x = newX;
        this.y = newY;
        
        // 设置迁移标记和冷却
        this.hasMigrated = true;
        this.migrationCooldown = 20; // 20个时间单位的冷却
        
        // 迁移成本：各项属性临时下降
        this.tech = Math.max(10, this.tech * 0.8);
        this.culture = Math.max(10, this.culture * 0.8);
        this.economy = Math.max(10, this.economy * 0.8);
        this.military = Math.max(10, this.military * 0.8);
        this.population = Math.max(5000, this.population * 0.9);
    }
}