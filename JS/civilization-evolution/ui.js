// UI系统模块
class UISystem {
    constructor(simulator) {
        this.simulator = simulator;
    }
    
    // 初始化UI
    init() {
        // 生成文明卡片
        this.generateCivilizationCards();
        
        // 更新初始UI
        this.updateUI();
        this.simulator.map.drawMap();
        this.updateRelations();
        this.updateDetails();
        this.updateTimeline();
        
        // 初始化地图交互
        this.simulator.map.initMapInteraction();
        
        // 绑定速度选择事件
        const speedSelect = document.getElementById('speedSelect');
        if (speedSelect) {
            speedSelect.addEventListener('change', (e) => {
                this.simulator.speed = e.target.value;
                this.simulator.restart();
            });
        }
    }
    
    // 生成文明卡片
    generateCivilizationCards() {
        const container = document.getElementById('civilizationsContainer');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.simulator.civilizations.forEach(civ => {
            const card = document.createElement('div');
            card.className = 'civilization-card';
            card.id = `civ${civ.id}`;
            
            // 计算文明颜色（与地图相同的计算方式）
            const baseHue = this.simulator.civilizations.indexOf(civ) * 137.5 % 360;
            const saturation = 80;
            const lightness = 40;
            const civColor = `hsla(${baseHue}, ${saturation}%, ${lightness}%, 0.8)`;
            
            card.innerHTML = `
                <div class="civ-color-indicator" style="background-color: ${civColor}"></div>
                <h3 class="civ-name">${civ.name}</h3>
                <div class="civ-type">${civ.type}</div>
                <div class="civ-strategy">策略：${civ.strategy}</div>
                <div class="civ-stats">
                    <div class="stat-item">
                        <span class="stat-label">科技：</span>
                        <div class="stat-bar">
                            <div class="stat-fill" id="civ${civ.id}-tech" style="width: ${civ.tech}%"></div>
                            <span class="stat-value" id="civ${civ.id}-tech-value">${Math.round(civ.tech)}</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">文化：</span>
                        <div class="stat-bar">
                            <div class="stat-fill" id="civ${civ.id}-culture" style="width: ${civ.culture}%"></div>
                            <span class="stat-value" id="civ${civ.id}-culture-value">${Math.round(civ.culture)}</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">经济：</span>
                        <div class="stat-bar">
                            <div class="stat-fill" id="civ${civ.id}-economy" style="width: ${civ.economy}%"></div>
                            <span class="stat-value" id="civ${civ.id}-economy-value">${Math.round(civ.economy)}</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">军事：</span>
                        <div class="stat-bar">
                            <div class="stat-fill" id="civ${civ.id}-military" style="width: ${civ.military}%"></div>
                            <span class="stat-value" id="civ${civ.id}-military-value">${Math.round(civ.military)}</span>
                        </div>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">人口：</span>
                        <span class="stat-value" id="civ${civ.id}-population">${Math.round(civ.population).toLocaleString()}</span>
                    </div>
                </div>
                <div class="civ-resources">
                    <h4>资源状况</h4>
                    <div class="resources-grid">
                        <div class="resource-item">
                            <span class="resource-label">矿产：</span>
                            <span class="resource-value" id="civ${civ.id}-mineral">${Math.round(this.simulator.calculateCivilizationResources(civ).mineral)}</span>
                        </div>
                        <div class="resource-item">
                            <span class="resource-label">食物：</span>
                            <span class="resource-value" id="civ${civ.id}-food">${Math.round(this.simulator.calculateCivilizationResources(civ).food)}</span>
                        </div>
                        <div class="resource-item">
                            <span class="resource-label">能源：</span>
                            <span class="resource-value" id="civ${civ.id}-energy">${Math.round(this.simulator.calculateCivilizationResources(civ).energy)}</span>
                        </div>
                        <div class="resource-item">
                            <span class="resource-label">文化：</span>
                            <span class="resource-value" id="civ${civ.id}-culture-res">${Math.round(this.simulator.calculateCivilizationResources(civ).culture)}</span>
                        </div>
                        <div class="resource-item">
                            <span class="resource-label">稀有：</span>
                            <span class="resource-value" id="civ${civ.id}-rare">${Math.round(this.simulator.calculateCivilizationResources(civ).rare)}</span>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
    }
    
    // 更新UI
    updateUI() {
        // 更新时间
        const currentTimeEl = document.getElementById('currentTime');
        if (currentTimeEl) {
            currentTimeEl.textContent = this.simulator.formatYear(this.simulator.currentYear);
        }
        
        // 更新运行时间
        const runningTimeEl = document.getElementById('runningTime');
        if (runningTimeEl) {
            runningTimeEl.textContent = `${this.simulator.runningTime.toFixed(1)}分钟`;
        }
        
        // 重新生成文明卡片（支持文明数量变化）
        this.generateCivilizationCards();
        
        // 更新文明统计
        this.simulator.civilizations.forEach(civ => {
            const prefix = `civ${civ.id}`;
            
            // 更新科技
            const techFill = document.getElementById(`${prefix}-tech`);
            const techValue = document.getElementById(`${prefix}-tech-value`);
            if (techFill) techFill.style.width = `${Math.min(100, civ.tech)}%`;
            if (techValue) techValue.textContent = Math.round(civ.tech);
            
            // 更新文化
            const cultureFill = document.getElementById(`${prefix}-culture`);
            const cultureValue = document.getElementById(`${prefix}-culture-value`);
            if (cultureFill) cultureFill.style.width = `${Math.min(100, civ.culture)}%`;
            if (cultureValue) cultureValue.textContent = Math.round(civ.culture);
            
            // 更新经济
            const economyFill = document.getElementById(`${prefix}-economy`);
            const economyValue = document.getElementById(`${prefix}-economy-value`);
            if (economyFill) economyFill.style.width = `${Math.min(100, civ.economy)}%`;
            if (economyValue) economyValue.textContent = Math.round(civ.economy);
            
            // 更新军事
            const militaryFill = document.getElementById(`${prefix}-military`);
            const militaryValue = document.getElementById(`${prefix}-military-value`);
            if (militaryFill) militaryFill.style.width = `${Math.min(100, civ.military)}%`;
            if (militaryValue) militaryValue.textContent = Math.round(civ.military);
            
            // 更新人口
            const populationValue = document.getElementById(`${prefix}-population`);
            if (populationValue) {
                populationValue.textContent = Math.round(civ.population).toLocaleString();
            }
            
            // 更新资源状况（从格子中汇总）
            const resources = this.simulator.calculateCivilizationResources(civ);
            const mineralValue = document.getElementById(`${prefix}-mineral`);
            const foodValue = document.getElementById(`${prefix}-food`);
            const energyValue = document.getElementById(`${prefix}-energy`);
            const cultureResValue = document.getElementById(`${prefix}-culture-res`);
            const rareValue = document.getElementById(`${prefix}-rare`);
            
            if (mineralValue) mineralValue.textContent = Math.round(resources.mineral);
            if (foodValue) foodValue.textContent = Math.round(resources.food);
            if (energyValue) energyValue.textContent = Math.round(resources.energy);
            if (cultureResValue) cultureResValue.textContent = Math.round(resources.culture);
            if (rareValue) rareValue.textContent = Math.round(resources.rare);
        });
    }
    
    // 更新文明关系 - 矩阵式布局
    updateRelations() {
        const graph = document.getElementById('relationsGraph');
        if (!graph) return;
        
        graph.innerHTML = '';
        
        // 创建关系矩阵表格
        const table = document.createElement('table');
        table.className = 'relations-matrix';
        
        // 创建表头行
        const headerRow = document.createElement('tr');
        const emptyHeader = document.createElement('th');
        headerRow.appendChild(emptyHeader);
        
        // 添加文明名称作为表头
        this.simulator.civilizations.forEach(civ => {
            const th = document.createElement('th');
            th.textContent = civ.name;
            th.title = civ.strategy;
            th.className = 'civ-header';
            headerRow.appendChild(th);
        });
        table.appendChild(headerRow);
        
        // 为每个文明创建行
        this.simulator.civilizations.forEach((civ1, i) => {
            const row = document.createElement('tr');
            
            // 添加文明名称作为行标题
            const rowHeader = document.createElement('th');
            rowHeader.textContent = civ1.name;
            rowHeader.title = civ1.strategy;
            rowHeader.className = 'civ-header';
            row.appendChild(rowHeader);
            
            // 添加与其他文明的关系单元格
            this.simulator.civilizations.forEach((civ2, j) => {
                const cell = document.createElement('td');
                
                if (i === j) {
                    // 自己与自己的关系
                    cell.textContent = '✓';
                    cell.className = 'relation-cell self';
                } else {
                    // 与其他文明的关系
                    const relation = Math.round(civ1.relations[civ2.id]);
                    cell.textContent = relation > 0 ? `+${relation}` : relation;
                    
                    // 根据关系值设置样式
                    let relationClass = '';
                    if (relation > 10) {
                        relationClass = 'friendly';
                    } else if (relation < -10) {
                        relationClass = 'hostile';
                    } else {
                        relationClass = 'neutral';
                    }
                    cell.className = `relation-cell ${relationClass}`;
                    
                    // 添加悬停提示
                    cell.title = `${civ1.name} 与 ${civ2.name} 的关系：${relation}`;
                }
                
                row.appendChild(cell);
            });
            
            table.appendChild(row);
        });
        
        // 添加表格到容器
        graph.appendChild(table);
    }
    
    // 更新文明详情
    updateDetails() {
        const container = document.getElementById('civilizationDetails');
        if (!container) return;
        
        container.innerHTML = '';
        
        this.simulator.civilizations.forEach(civ => {
            // 计算基于格子的统计信息
            const cellStats = this.simulator.getCivilizationCellStats(civ.id);
            
            const card = document.createElement('div');
            card.className = 'civ-detail-card';
            
            // 根据策略获取策略描述和颜色
            let strategyDesc = '';
            let strategyColor = '';
            switch(civ.strategy) {
                case '扩张主义':
                    strategyDesc = '优先发展军事，积极对外扩张';
                    strategyColor = '#F44336'; // 红色
                    break;
                case '防御主义':
                    strategyDesc = '优先发展军事和科技，注重防御';
                    strategyColor = '#2196F3'; // 蓝色
                    break;
                case '文化主义':
                    strategyDesc = '优先发展文化，积极文化输出';
                    strategyColor = '#9C27B0'; // 紫色
                    break;
                case '经济主义':
                    strategyDesc = '优先发展经济，注重贸易合作';
                    strategyColor = '#4CAF50'; // 绿色
                    break;
                case '平衡主义':
                    strategyDesc = '平衡发展各项指标，寻求稳定';
                    strategyColor = '#FFC107'; // 黄色
                    break;
            }
            
            card.innerHTML = `
                <div class="civ-detail-header">
                    <h4>${civ.name}</h4>
                    <div class="civ-strategy" style="background-color: ${strategyColor}20; color: ${strategyColor};">
                        <span class="strategy-label">策略：</span>
                        <span class="strategy-name">${civ.strategy}</span>
                    </div>
                </div>
                <div class="civ-strategy-desc">${strategyDesc}</div>
                
                <div class="civ-territory-stats">
                    <h5>领土统计</h5>
                    <div class="civ-territory-grid">
                        <div class="territory-stat-item">
                            <span class="territory-stat-label">领土大小：</span>
                            <span class="territory-stat-value">${cellStats.totalCells} 格子</span>
                        </div>
                        <div class="territory-stat-item">
                            <span class="territory-stat-label">争议地带：</span>
                            <span class="territory-stat-value">${cellStats.disputedCells} 格子</span>
                        </div>
                        <div class="territory-stat-item">
                            <span class="territory-stat-label">平原：</span>
                            <span class="territory-stat-value">${cellStats.terrain.plains} 格子</span>
                        </div>
                        <div class="territory-stat-item">
                            <span class="territory-stat-label">森林：</span>
                            <span class="territory-stat-value">${cellStats.terrain.forest} 格子</span>
                        </div>
                        <div class="territory-stat-item">
                            <span class="territory-stat-label">丘陵：</span>
                            <span class="territory-stat-value">${cellStats.terrain.hills} 格子</span>
                        </div>
                        <div class="territory-stat-item">
                            <span class="territory-stat-label">山脉：</span>
                            <span class="territory-stat-value">${cellStats.terrain.mountains} 格子</span>
                        </div>
                    </div>
                </div>
                
                <div class="civ-detail-stats">
                    <div class="civ-detail-stat">
                        <span class="civ-detail-stat-label">科技：</span>
                        <span class="civ-detail-stat-value">${Math.round(civ.tech)}</span>
                        <div class="stat-bar-small">
                            <div class="stat-fill-small" style="width: ${Math.min(100, civ.tech / 2)}%; background-color: #2196F3;"></div>
                        </div>
                    </div>
                    <div class="civ-detail-stat">
                        <span class="civ-detail-stat-label">文化：</span>
                        <span class="civ-detail-stat-value">${Math.round(civ.culture)}</span>
                        <div class="stat-bar-small">
                            <div class="stat-fill-small" style="width: ${Math.min(100, civ.culture / 2)}%; background-color: #9C27B0;"></div>
                        </div>
                    </div>
                    <div class="civ-detail-stat">
                        <span class="civ-detail-stat-label">经济：</span>
                        <span class="civ-detail-stat-value">${Math.round(civ.economy)}</span>
                        <div class="stat-bar-small">
                            <div class="stat-fill-small" style="width: ${Math.min(100, civ.economy / 2)}%; background-color: #4CAF50;"></div>
                        </div>
                    </div>
                    <div class="civ-detail-stat">
                        <span class="civ-detail-stat-label">军事：</span>
                        <span class="civ-detail-stat-value">${Math.round(civ.military)}</span>
                        <div class="stat-bar-small">
                            <div class="stat-fill-small" style="width: ${Math.min(100, civ.military / 2)}%; background-color: #F44336;"></div>
                        </div>
                    </div>
                    <div class="civ-detail-stat">
                        <span class="civ-detail-stat-label">人口：</span>
                        <span class="civ-detail-stat-value">${Math.round(civ.population).toLocaleString()}</span>
                    </div>
                    <div class="civ-detail-stat">
                        <span class="civ-detail-stat-label">历史位置：</span>
                        <span class="civ-detail-stat-value">${civ.history.length}处</span>
                    </div>
                </div>
                
                <div class="civ-resources-detail">
                    <h5>资源状况</h5>
                    <div class="civ-resources-grid">
                        <div class="resource-detail-item">
                            <span class="resource-detail-label">矿产：</span>
                            <span class="resource-detail-value">${Math.round(this.simulator.calculateCivilizationResources(civ).mineral)}</span>
                        </div>
                        <div class="resource-detail-item">
                            <span class="resource-detail-label">食物：</span>
                            <span class="resource-detail-value">${Math.round(this.simulator.calculateCivilizationResources(civ).food)}</span>
                        </div>
                        <div class="resource-detail-item">
                            <span class="resource-detail-label">能源：</span>
                            <span class="resource-detail-value">${Math.round(this.simulator.calculateCivilizationResources(civ).energy)}</span>
                        </div>
                        <div class="resource-detail-item">
                            <span class="resource-detail-label">文化资源：</span>
                            <span class="resource-detail-value">${Math.round(this.simulator.calculateCivilizationResources(civ).culture)}</span>
                        </div>
                        <div class="resource-detail-item">
                            <span class="resource-detail-label">稀有资源：</span>
                            <span class="resource-detail-value">${Math.round(this.simulator.calculateCivilizationResources(civ).rare)}</span>
                        </div>
                    </div>
                </div>
                
                <div class="civ-cell-attributes">
                    <h5>平均格子属性</h5>
                    <div class="civ-cell-attr-grid">
                        <div class="cell-attr-item">
                            <span class="cell-attr-label">平均科技：</span>
                            <span class="cell-attr-value">${cellStats.avgAttributes.tech.toFixed(1)}</span>
                        </div>
                        <div class="cell-attr-item">
                            <span class="cell-attr-label">平均文化：</span>
                            <span class="cell-attr-value">${cellStats.avgAttributes.culture.toFixed(1)}</span>
                        </div>
                        <div class="cell-attr-item">
                            <span class="cell-attr-label">平均经济：</span>
                            <span class="cell-attr-value">${cellStats.avgAttributes.economy.toFixed(1)}</span>
                        </div>
                        <div class="cell-attr-item">
                            <span class="cell-attr-label">平均军事：</span>
                            <span class="cell-attr-value">${cellStats.avgAttributes.military.toFixed(1)}</span>
                        </div>
                        <div class="cell-attr-item">
                            <span class="cell-attr-label">平均人口：</span>
                            <span class="cell-attr-value">${Math.round(cellStats.avgAttributes.population)}</span>
                        </div>
                    </div>
                </div>
            `;
            
            container.appendChild(card);
        });
    }
    
    // 更新时间线
    updateTimeline() {
        const container = document.getElementById('timeline');
        if (!container) return;
        
        container.innerHTML = '';
        
        // 从最新到最旧排序事件
        const sortedEvents = [...this.simulator.events].reverse();
        
        sortedEvents.forEach(event => {
            const eventItem = document.createElement('div');
            eventItem.className = 'timeline-item';
            
            // 事件类型中文名称映射
            const eventTypeNames = {
                internal: '内部事件',
                diplomatic: '外交事件',
                war: '战争事件',
                trade: '贸易事件',
                global: '全球事件',
                collapse: '文明灭亡',
                revival: '文明复兴',
                merge: '文明合并',
                split: '文明分裂'
            };
            
            // 事件影响描述
            let impactDesc = '';
            if (event.impact && Object.keys(event.impact).length > 0) {
                if (event.type === 'war') {
                    impactDesc = `<div class="event-impact">影响：${event.impact.civilization1}与${event.impact.civilization2}发生战争，${event.impact.winner}获胜！</div>`;
                } else if (event.type === 'trade') {
                    impactDesc = `<div class="event-impact">影响：${event.impact.civilization1}与${event.impact.civilization2}开展贸易，经济和文化得到提升！</div>`;
                } else if (event.type === 'diplomatic') {
                    impactDesc = `<div class="event-impact">影响：${event.impact.civilization1}与${event.impact.civilization2}的关系${event.impact.relationChange > 0 ? '改善' : '恶化'}了${Math.abs(event.impact.relationChange)}点！</div>`;
                } else if (event.type === 'internal') {
                    impactDesc = `<div class="event-impact">影响：${event.impact.civilization}进行了内部资源调度！</div>`;
                } else if (event.type === 'global') {
                    impactDesc = `<div class="event-impact">影响：全球${event.impact.globalEffect > 0 ? '增长' : '衰退'}了${Math.abs(event.impact.globalEffect)}%，影响了${event.impact.affectedCivilizations}个文明！</div>`;
                } else if (event.type === 'collapse') {
                    impactDesc = `<div class="event-impact">影响：${event.impact.civilization}灭亡了！</div>`;
                } else if (event.type === 'revival') {
                    impactDesc = `<div class="event-impact">影响：${event.impact.civilization}复兴了！</div>`;
                } else if (event.type === 'merge') {
                    impactDesc = `<div class="event-impact">影响：两个文明合并为${event.impact.civilization}！</div>`;
                } else if (event.type === 'split') {
                    impactDesc = `<div class="event-impact">影响：${event.impact.civilization}分裂为${event.impact.civilization}和${event.impact.newCivilization}！</div>`;
                }
            }
            
            eventItem.innerHTML = `
                <div class="event-header">
                    <span class="timeline-year">${this.simulator.formatYear(event.year)}</span>
                    <span class="event-type ${event.type}">${eventTypeNames[event.type] || event.type}</span>
                </div>
                <div class="event-description">${event.description}</div>
                ${impactDesc}
            `;
            
            container.appendChild(eventItem);
        });
    }
}