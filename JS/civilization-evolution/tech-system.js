// 科技树系统模块
class TechSystem {
    constructor(simulator) {
        this.simulator = simulator;
        this.techTree = null;
        this.researchingTech = null;
        this.researchProgress = 0;
        this.researchSpeed = 1.0;
        
        // 加载科技树配置
        this.loadTechTree();
    }
    
    // 加载科技树配置
    async loadTechTree() {
        try {
            const response = await fetch('./JS/civilization-evolution/tech-tree.json');
            this.techTree = await response.json();
            console.log('科技树加载完成:', this.techTree);
        } catch (error) {
            console.error('加载科技树失败:', error);
            // 如果加载失败，使用默认科技树
            this.techTree = {
                techs: []
            };
        }
    }
    
    // 初始化文明的科技状态
    initCivilizationTech(civ) {
        civ.techs = {
            researched: [], // 已研究的科技ID列表
            researching: null, // 当前研究的科技ID
            researchProgress: 0, // 当前研究进度
            researchSpeed: 1.0, // 研究速度倍率
            unlockedFeatures: [] // 解锁的功能列表
        };
    }
    
    // 获取可研究的科技列表
    getAvailableTechs(civ) {
        if (!this.techTree) return [];
        
        const availableTechs = [];
        
        this.techTree.techs.forEach(tech => {
            // 已研究的科技跳过
            if (civ.techs.researched.includes(tech.id)) {
                return;
            }
            
            // 正在研究的科技跳过
            if (civ.techs.researching === tech.id) {
                return;
            }
            
            // 检查依赖是否满足
            const dependenciesMet = tech.dependencies.every(depId => 
                civ.techs.researched.includes(depId)
            );
            
            if (dependenciesMet) {
                availableTechs.push(tech);
            }
        });
        
        return availableTechs;
    }
    
    // 开始研究科技
    startResearch(civ, techId) {
        if (!this.techTree) return false;
        
        const tech = this.techTree.techs.find(t => t.id === techId);
        if (!tech) return false;
        
        // 检查依赖是否满足
        const dependenciesMet = tech.dependencies.every(depId => 
            civ.techs.researched.includes(depId)
        );
        
        if (!dependenciesMet) return false;
        
        // 检查资源是否足够
        const hasResources = this.checkResourceCost(civ, tech.cost);
        if (!hasResources) return false;
        
        // 扣除资源
        this.payResourceCost(civ, tech.cost);
        
        // 开始研究
        civ.techs.researching = techId;
        civ.techs.researchProgress = 0;
        
        return true;
    }
    
    // 检查资源是否足够支付科技成本
    checkResourceCost(civ, cost) {
        const civResources = this.simulator.calculateCivilizationResources(civ);
        
        for (const [resourceType, amount] of Object.entries(cost)) {
            if ((civResources[resourceType] || 0) < amount) {
                return false;
            }
        }
        
        return true;
    }
    
    // 支付科技研究的资源成本
    payResourceCost(civ, cost) {
        // 从文明的资源中扣除成本
        // 注意：这里需要修改资源系统，允许直接扣除文明级别的资源
        // 目前资源是格子级别的，需要先汇总到文明级别
        const civResources = this.simulator.calculateCivilizationResources(civ);
        
        // 暂时只记录成本，不实际扣除
        console.log(`${civ.name}支付了科技研究成本:`, cost);
    }
    
    // 更新科技研究进度
    updateResearch(civ, deltaTime) {
        if (!civ.techs.researching) return;
        
        const tech = this.techTree.techs.find(t => t.id === civ.techs.researching);
        if (!tech) return;
        
        // 计算研究进度
        const researchPoints = this.calculateResearchPoints(civ);
        civ.techs.researchProgress += researchPoints * deltaTime;
        
        // 检查是否研究完成
        if (civ.techs.researchProgress >= 100) {
            this.completeResearch(civ, tech);
        }
    }
    
    // 计算文明的研究点数
    calculateResearchPoints(civ) {
        // 基于科技属性、人口和已研究的科技计算研究点数
        let basePoints = civ.tech / 20;
        let populationBonus = civ.population / 500;
        let techBonus = civ.techs.researched.length * 0.5;
        
        return (basePoints + populationBonus + techBonus) * civ.techs.researchSpeed;
    }
    
    // 完成科技研究
    completeResearch(civ, tech) {
        // 添加到已研究列表
        civ.techs.researched.push(tech.id);
        civ.techs.researching = null;
        civ.techs.researchProgress = 0;
        
        // 应用科技效果
        this.applyTechEffects(civ, tech);
        
        // 解锁功能
        if (tech.unlocks) {
            tech.unlocks.forEach(feature => {
                if (!civ.techs.unlockedFeatures.includes(feature)) {
                    civ.techs.unlockedFeatures.push(feature);
                }
            });
        }
        
        console.log(`${civ.name}完成了科技研究: ${tech.name}`);
        
        // 生成科技研究事件
        this.simulator.events.push({
            year: this.simulator.currentYear,
            type: 'tech_research',
            description: `${civ.name}成功研究了${tech.name}科技！`,
            triggeredBy: 'internal',
            affectedCivs: [civ.id],
            impact: {
                techResearch: true,
                techId: tech.id
            }
        });
    }
    
    // 应用科技效果
    applyTechEffects(civ, tech) {
        if (!tech.effects) return;
        
        for (const [effectType, value] of Object.entries(tech.effects)) {
            switch(effectType) {
                case 'population_growth':
                    // 增加人口增长率
                    civ.populationGrowthModifier += value;
                    break;
                case 'food_production':
                    // 增加食物生产
                    civ.foodProductionModifier += value;
                    break;
                case 'food_efficiency':
                    // 增加食物效率
                    civ.foodEfficiencyModifier += value;
                    break;
                case 'mineral_production':
                    // 增加矿产生产
                    civ.mineralProductionModifier += value;
                    break;
                case 'energy_production':
                    // 增加能源生产
                    civ.energyProductionModifier += value;
                    break;
                case 'energy_efficiency':
                    // 增加能源效率
                    civ.energyEfficiencyModifier += value;
                    break;
                case 'culture_growth':
                    // 增加文化增长
                    civ.cultureGrowthModifier += value;
                    break;
                case 'tech_research':
                    // 增加科技研究速度
                    civ.techs.researchSpeed += value;
                    break;
                case 'economy_growth':
                    // 增加经济增长
                    civ.economyGrowthModifier += value;
                    break;
                case 'military_strength':
                    // 增加军事力量
                    civ.militaryStrengthModifier += value;
                    break;
                case 'trade_efficiency':
                    // 增加贸易效率
                    civ.tradeEfficiencyModifier += value;
                    break;
                case 'population_cap':
                    // 增加人口上限
                    civ.populationCapModifier += value;
                    break;
                case 'city_defense':
                    // 增加城市防御
                    civ.cityDefenseModifier += value;
                    break;
                case 'global_awareness':
                    // 增加全球意识
                    civ.globalAwarenessModifier += value;
                    break;
            }
        }
    }
    
    // 获取科技的当前状态
    getTechStatus(techId, civ) {
        if (!this.techTree) return 'unknown';
        
        if (civ.techs.researched.includes(techId)) {
            return 'researched';
        }
        
        if (civ.techs.researching === techId) {
            return 'researching';
        }
        
        const tech = this.techTree.techs.find(t => t.id === techId);
        if (!tech) return 'unknown';
        
        const dependenciesMet = tech.dependencies.every(depId => 
            civ.techs.researched.includes(depId)
        );
        
        return dependenciesMet ? 'available' : 'unavailable';
    }
    
    // 获取科技详情
    getTechDetails(techId) {
        if (!this.techTree) return null;
        return this.techTree.techs.find(tech => tech.id === techId);
    }
    
    // 获取文明的科技信息摘要
    getTechSummary(civ) {
        return {
            totalTechs: this.techTree ? this.techTree.techs.length : 0,
            researchedTechs: civ.techs.researched.length,
            researchingTech: civ.techs.researching,
            researchProgress: civ.techs.researchProgress,
            researchSpeed: civ.techs.researchSpeed,
            unlockedFeatures: civ.techs.unlockedFeatures.length
        };
    }
}
