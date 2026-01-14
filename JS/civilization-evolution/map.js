// 地图生成与渲染模块
class MapSystem {
    constructor(simulator) {
        this.simulator = simulator;
        this.cellSize = 8;
        this.mapWidth = 800;
        this.mapHeight = 800;
        this.mapCells = [];
        this.cols = 0;
        this.rows = 0;
        this.territory = [];
        this.influence = [];
        
        // 资源类型定义
        this.resourceTypes = {
            mineral: { name: '矿产', color: '#8B4513', effect: { tech: 0.1, economy: 0.05 } },
            food: { name: '食物', color: '#32CD32', effect: { population: 0.15 } },
            energy: { name: '能源', color: '#FFD700', effect: { economy: 0.1, tech: 0.05 } },
            culture: { name: '文化遗迹', color: '#DDA0DD', effect: { culture: 0.2 } },
            rare: { name: '稀有资源', color: '#FF69B4', effect: { tech: 0.15, culture: 0.1 } }
        };
        
        // 资源生成概率配置（基于地形）
        this.resourceGeneration = {
            water: { mineral: 0.01, food: 0.05, energy: 0.02, culture: 0.01, rare: 0.005 },
            plains: { mineral: 0.05, food: 0.3, energy: 0.1, culture: 0.05, rare: 0.01 },
            forest: { mineral: 0.1, food: 0.15, energy: 0.2, culture: 0.1, rare: 0.02 },
            hills: { mineral: 0.25, food: 0.05, energy: 0.15, culture: 0.08, rare: 0.03 },
            mountains: { mineral: 0.4, food: 0.02, energy: 0.1, culture: 0.15, rare: 0.05 }
        };
        
        // 格子类型的属性限制配置
        this.cellTypeLimits = {
            water: { tech: 10, culture: 10, economy: 5, military: 5, population: 100, influenceObstacle: 0.0 },
            plains: { tech: 50, culture: 50, economy: 100, military: 70, population: 1000, influenceObstacle: 0.2 },
            forest: { tech: 30, culture: 80, economy: 30, military: 50, population: 500, influenceObstacle: 0.5 },
            hills: { tech: 40, culture: 40, economy: 40, military: 100, population: 300, influenceObstacle: 0.7 },
            mountains: { tech: 100, culture: 30, economy: 20, military: 80, population: 100, influenceObstacle: 0.9 }
        };
    }
    
    // 初始化地图系统
    init() {
        // 获取canvas实际尺寸
        const canvas = document.getElementById('civilizationMap');
        if (canvas) {
            this.mapWidth = canvas.width;
            this.mapHeight = canvas.height;
        }
        
        this.mapCells = this.generateMap();
        
        // 初始化领土系统
        this.cols = Math.floor(this.mapWidth / this.cellSize);
        this.rows = Math.floor(this.mapHeight / this.cellSize);
        this.territory = [];
        this.influence = [];
        
        for (let y = 0; y < this.rows; y++) {
            this.territory[y] = [];
            this.influence[y] = [];
            for (let x = 0; x < this.cols; x++) {
                // 获取格子地形类型
                const terrain = this.mapCells[y][x];
                
                // 生成资源
                const resource = this.generateResource(terrain);
                
                // 初始化格子属性
                this.territory[y][x] = {
                    owner: null,
                    influence: {},
                    isDisputed: false,
                    // 格子属性
                    tech: 0,
                    culture: 0,
                    economy: 0,
                    military: 0,
                    population: 0,
                    // 格子类型
                    terrain: terrain,
                    // 格子资源
                    resource: resource,
                    // 格子属性上限（基于地形类型）
                    limits: this.cellTypeLimits[terrain],
                    // 格子发展历史
                    history: []
                };
                this.influence[y][x] = {};
            }
        }
    }
    
    // 生成资源
    generateResource(terrain) {
        // 基于地形的资源生成概率
        const probabilities = this.resourceGeneration[terrain];
        const rand = Math.random();
        let cumulativeProbability = 0;
        
        // 遍历资源类型，根据概率生成资源
        for (const [resourceType, probability] of Object.entries(probabilities)) {
            cumulativeProbability += probability;
            if (rand < cumulativeProbability) {
                // 生成资源数量（随机1-5）
                const quantity = Math.floor(Math.random() * 5) + 1;
                return {
                    type: resourceType,
                    name: this.resourceTypes[resourceType].name,
                    quantity: quantity,
                    effect: this.resourceTypes[resourceType].effect,
                    color: this.resourceTypes[resourceType].color
                };
            }
        }
        
        // 没有生成资源
        return null;
    }
    
    // 生成地图 - 简单的随机地形生成
    generateMap() {
        const cols = Math.floor(this.mapWidth / this.cellSize);
        const rows = Math.floor(this.mapHeight / this.cellSize);
        const cells = [];
        
        // 生成随机地形
        for (let y = 0; y < rows; y++) {
            cells[y] = [];
            for (let x = 0; x < cols; x++) {
                // 使用简单的随机地形算法
                const rand = Math.random();
                if (rand < 0.3) {
                    cells[y][x] = 'water'; // 海洋 30%
                } else if (rand < 0.5) {
                    cells[y][x] = 'plains'; // 平原 20%
                } else if (rand < 0.7) {
                    cells[y][x] = 'forest'; // 森林 20%
                } else if (rand < 0.85) {
                    cells[y][x] = 'hills'; // 丘陵 15%
                } else {
                    cells[y][x] = 'mountains'; // 山脉 15%
                }
            }
        }
        
        // 添加一些大陆结构 - 简单的平滑处理
        for (let i = 0; i < 3; i++) {
            this.smoothMap(cells, cols, rows);
        }
        
        return cells;
    }
    
    // 平滑地图
    smoothMap(cells, cols, rows) {
        const newCells = [];
        
        for (let y = 0; y < rows; y++) {
            newCells[y] = [];
            for (let x = 0; x < cols; x++) {
                let waterCount = 0;
                let landCount = 0;
                
                // 检查周围8个格子
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (nx >= 0 && nx < cols && ny >= 0 && ny < rows) {
                            if (cells[ny][nx] === 'water') {
                                waterCount++;
                            } else {
                                landCount++;
                            }
                        }
                    }
                }
                
                // 平滑规则：如果周围水多则变为水，否则保持或变为陆地
                if (waterCount > 5) {
                    newCells[y][x] = 'water';
                } else if (landCount > 5) {
                    // 随机选择陆地类型
                    const rand = Math.random();
                    if (rand < 0.4) {
                        newCells[y][x] = 'plains';
                    } else if (rand < 0.7) {
                        newCells[y][x] = 'forest';
                    } else if (rand < 0.9) {
                        newCells[y][x] = 'hills';
                    } else {
                        newCells[y][x] = 'mountains';
                    }
                } else {
                    newCells[y][x] = cells[y][x];
                }
            }
        }
        
        // 复制回原数组
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                cells[y][x] = newCells[y][x];
            }
        }
    }
    
    // 改进的地图绘制 - 基于格子的领土显示，添加实力范围
    drawMap() {
        const canvas = document.getElementById('civilizationMap');
        if (!canvas) return;
        
        // 获取canvas的实际显示尺寸
        const displayWidth = canvas.clientWidth;
        const displayHeight = canvas.clientHeight;
        
        // 确保canvas的尺寸与显示尺寸匹配，避免模糊
        if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
            canvas.width = displayWidth;
            canvas.height = displayHeight;
        }
        
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // 固定格子数量（100x100）
        const gridCols = 100;
        const gridRows = 100;
        
        // 计算每个格子的实际大小
        const cellSize = Math.min(width / gridCols, height / gridRows);
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        // 预计算地形颜色
        const terrainColors = {
            water: '#2196F3',
            plains: '#8BC34A',
            forest: '#4CAF50',
            hills: '#795548',
            mountains: '#9E9E9E'
        };
        
        // 预计算文明颜色
        const civColors = [];
        const civColorMap = [];
        this.simulator.civilizations.forEach((civ, index) => {
            const baseHue = index * 137.5 % 360;
            civColors[civ.id] = baseHue;
            civColorMap.push({ civ, baseHue });
        });
        
        // 绘制地图格子和领土
        for (let y = 0; y < gridRows; y++) {
            for (let x = 0; x < gridCols; x++) {
                // 确保不超出地图数组范围
                if (y < this.rows && x < this.cols) {
                    // 绘制地形基础颜色
                    const cell = this.mapCells[y][x];
                    const terrainColor = terrainColors[cell] || '#8BC34A';
                    
                    // 绘制格子基础颜色
                    ctx.fillStyle = terrainColor;
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                    
                    // 绘制领土颜色叠加和实力范围
                    const territory = this.territory[y][x];
                    if (territory.owner !== null) {
                        // 找到对应的文明
                        const baseHue = civColors[territory.owner];
                        if (baseHue !== undefined) {
                            // 计算格子实力强度（基于格子的各项属性）
                            const power = (territory.tech + territory.culture + territory.economy + territory.military + territory.population / 100) / 5;
                            const maxPower = (territory.limits.tech + territory.limits.culture + territory.limits.economy + territory.limits.military + territory.limits.population / 100) / 5;
                            const powerIntensity = Math.min(1, power / maxPower);
                            
                            // 根据实力强度调整颜色亮度和透明度
                            const saturation = 70 + (powerIntensity * 20);
                            const lightness = 50 - (powerIntensity * 20);
                            const alpha = 0.4 + (powerIntensity * 0.4);
                            
                            // 文明颜色
                            const civColor = `hsla(${baseHue}, ${saturation}%, ${lightness}%, ${alpha})`;
                            
                            ctx.fillStyle = civColor;
                            ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                        }
                    }
                    
                    // 绘制资源点
                    if (territory.resource) {
                        // 绘制资源点，使用资源颜色和大小表示资源数量
                        const resourceSize = Math.min(
                            (territory.resource.quantity / 15) * cellSize * 0.6,
                            cellSize / 2
                        );
                        const centerX = x * cellSize + cellSize / 2;
                        const centerY = y * cellSize + cellSize / 2;
                        
                        // 将资源颜色改为半透明，避免覆盖文明领土颜色
                        const resourceColor = territory.resource.color;
                        // 将十六进制颜色转换为RGB，然后创建HSLA颜色
                        const hex = resourceColor.replace('#', '');
                        const r = parseInt(hex.substring(0, 2), 16);
                        const g = parseInt(hex.substring(2, 4), 16);
                        const b = parseInt(hex.substring(4, 6), 16);
                        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
                        
                        ctx.beginPath();
                        ctx.arc(centerX, centerY, resourceSize, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
                
                // 绘制网格线
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }
        
        // 绘制文明颜色图例
        this.drawCivilizationLegend(ctx, width, height, civColorMap);

    }
    
    // 绘制文明颜色图例
    drawCivilizationLegend(ctx, width, height, civColorMap) {
        if (civColorMap.length === 0) return;
        
        // 图例位置和大小
        const legendX = width - 180;
        const legendY = 20;
        const legendWidth = 160;
        const legendHeight = 30 * civColorMap.length + 20;
        
        // 绘制图例背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        ctx.lineWidth = 1;
        ctx.fillRect(legendX, legendY, legendWidth, legendHeight);
        ctx.strokeRect(legendX, legendY, legendWidth, legendHeight);
        
        // 绘制图例标题
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('文明颜色图例', legendX + 10, legendY + 20);
        
        // 绘制每个文明的颜色和名称
        civColorMap.forEach(({ civ, baseHue }, index) => {
            const itemY = legendY + 40 + index * 25;
            
            // 绘制颜色块
            const colorBlockSize = 16;
            const colorBlockX = legendX + 10;
            const colorBlockY = itemY - 8;
            
            // 使用与地图相同的颜色计算方式
            const saturation = 80;
            const lightness = 40;
            const alpha = 0.8;
            const civColor = `hsla(${baseHue}, ${saturation}%, ${lightness}%, ${alpha})`;
            
            ctx.fillStyle = civColor;
            ctx.fillRect(colorBlockX, colorBlockY, colorBlockSize, colorBlockSize);
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.lineWidth = 1;
            ctx.strokeRect(colorBlockX, colorBlockY, colorBlockSize, colorBlockSize);
            
            // 绘制文明名称
            ctx.fillStyle = '#333';
            ctx.font = '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(civ.name, legendX + 30, itemY + 5);
        });
    }
    
    // 初始化地图交互 - 添加格子悬停显示
    initMapInteraction() {
        const canvas = document.getElementById('civilizationMap');
        if (!canvas) return;
        
        const tooltip = document.createElement('div');
        tooltip.className = 'map-tooltip';
        tooltip.style.position = 'absolute';
        tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        tooltip.style.color = '#fff';
        tooltip.style.padding = '8px 12px';
        tooltip.style.borderRadius = '4px';
        tooltip.style.fontSize = '12px';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.zIndex = '1000';
        tooltip.style.maxWidth = '250px';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);
        
        // 鼠标移动事件
        canvas.addEventListener('mousemove', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = Math.floor((e.clientX - rect.left) / this.cellSize);
            const y = Math.floor((e.clientY - rect.top) / this.cellSize);
            
            // 检查坐标是否在地图范围内
            if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
                const territory = this.territory[y][x];
                const terrain = this.mapCells[y][x];
                
                // 构建tooltip内容
                let content = `<strong>格子信息</strong><br>`;
                content += `地形：${this.getTerrainName(terrain)}<br>`;
                
                // 显示资源信息
                if (territory.resource) {
                    content += `资源：${territory.resource.name}<br>`;
                    content += `资源数量：${territory.resource.quantity}<br>`;
                    content += `资源效果：`;
                    for (const [attr, effect] of Object.entries(territory.resource.effect)) {
                        content += `${this.getAttributeName(attr)} +${effect * 100}% `;
                    }
                    content += `<br>`;
                } else {
                    content += `资源：无<br>`;
                }
                
                if (territory.owner) {
                    const civ = this.simulator.civilizations.find(c => c.id === territory.owner);
                    content += `所有者：${civ ? civ.name : '未知'}<br>`;
                    content += `争议地带：${territory.isDisputed ? '是' : '否'}<br>`;
                } else {
                    content += `所有者：无<br>`;
                }
                
                // 显示格子属性
                content += `<br><strong>属性：</strong><br>`;
                content += `科技：${Math.round(territory.tech)}/${territory.limits.tech}<br>`;
                content += `文化：${Math.round(territory.culture)}/${territory.limits.culture}<br>`;
                content += `经济：${Math.round(territory.economy)}/${territory.limits.economy}<br>`;
                content += `军事：${Math.round(territory.military)}/${territory.limits.military}<br>`;
                content += `人口：${Math.round(territory.population)}/${territory.limits.population}<br>`;
                
                // 计算并显示实力强度
                const power = (territory.tech + territory.culture + territory.economy + territory.military + territory.population / 100) / 5;
                const maxPower = (territory.limits.tech + territory.limits.culture + territory.limits.economy + territory.limits.military + territory.limits.population / 100) / 5;
                const powerIntensity = Math.min(1, power / maxPower) * 100;
                content += `实力强度：${Math.round(powerIntensity)}%<br>`;
                
                tooltip.innerHTML = content;
                tooltip.style.display = 'block';
                tooltip.style.left = `${e.pageX + 10}px`;
                tooltip.style.top = `${e.pageY + 10}px`;
            } else {
                tooltip.style.display = 'none';
            }
        });
        
        // 鼠标离开事件
        canvas.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
    }
    
    // 获取地形名称的中文显示
    getTerrainName(terrain) {
        const terrainNames = {
            water: '海洋',
            plains: '平原',
            forest: '森林',
            hills: '丘陵',
            mountains: '山脉'
        };
        return terrainNames[terrain] || terrain;
    }
    
    // 获取属性名称的中文显示
    getAttributeName(attribute) {
        const attributeNames = {
            tech: '科技',
            culture: '文化',
            economy: '经济',
            military: '军事',
            population: '人口'
        };
        return attributeNames[attribute] || attribute;
    }
    
    // 为文明分配初始领土和属性
    assignInitialTerritory(civ, centerX, centerY) {
        // 为文明分配中心格子和周围格子
        for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
                const x = centerX + dx;
                const y = centerY + dy;
                
                // 检查坐标是否在地图范围内
                if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
                    const terrain = this.mapCells[y][x];
                    
                    // 只分配非海洋格子
                    if (terrain !== 'water') {
                        // 中心格子直接分配，周围格子根据距离概率分配
                        const distance = Math.abs(dx) + Math.abs(dy);
                        const probability = Math.exp(-distance / 1.5);
                        
                        if (distance === 0 || Math.random() < probability) {
                            // 分配领土
                            this.territory[y][x].owner = civ.id;
                            this.territory[y][x].isDisputed = false;
                            
                            // 分配初始属性（降低初始属性比例，从0.5改为0.3）
                        const limits = this.territory[y][x].limits;
                        this.territory[y][x].tech = limits.tech * 0.3;
                        this.territory[y][x].culture = limits.culture * 0.3;
                        this.territory[y][x].economy = limits.economy * 0.3;
                        this.territory[y][x].military = limits.military * 0.3;
                        this.territory[y][x].population = limits.population * 0.3;
                        }
                    }
                }
            }
        }
    }
    
    // 寻找适合文明复兴的区域
    findSuitableAreaForRevival() {
        // 寻找无主的非海洋区域
        const unownedLandCells = [];
        
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const terrain = this.mapCells[y][x];
                const territory = this.territory[y][x];
                
                // 非海洋且无主的格子
                if (terrain !== 'water' && territory.owner === null && !territory.isDisputed) {
                    unownedLandCells.push({ x, y });
                }
            }
        }
        
        // 如果无主陆地格子不足5个，返回null
        if (unownedLandCells.length < 5) {
            return null;
        }
        
        // 随机选择一个起始格子
        this.shuffleArray(unownedLandCells);
        
        // 使用BFS寻找连续的无主区域
        const visited = new Set();
        
        for (const startCell of unownedLandCells) {
            const startKey = `${startCell.x},${startCell.y}`;
            if (visited.has(startKey)) {
                continue;
            }
            
            const queue = [startCell];
            const connectedCells = [startCell];
            visited.add(startKey);
            
            while (queue.length > 0) {
                const current = queue.shift();
                
                // 检查周围8个格子
                const neighbors = [
                    { x: current.x-1, y: current.y-1 }, { x: current.x, y: current.y-1 }, { x: current.x+1, y: current.y-1 },
                    { x: current.x-1, y: current.y },                     { x: current.x+1, y: current.y },
                    { x: current.x-1, y: current.y+1 }, { x: current.x, y: current.y+1 }, { x: current.x+1, y: current.y+1 }
                ];
                
                for (const neighbor of neighbors) {
                    const key = `${neighbor.x},${neighbor.y}`;
                    if (neighbor.x >= 0 && neighbor.x < this.cols && neighbor.y >= 0 && neighbor.y < this.rows && !visited.has(key)) {
                        const terrain = this.mapCells[neighbor.y][neighbor.x];
                        const territory = this.territory[neighbor.y][neighbor.x];
                        
                        if (terrain !== 'water' && territory.owner === null && !territory.isDisputed) {
                            visited.add(key);
                            queue.push(neighbor);
                            connectedCells.push(neighbor);
                        }
                    }
                }
            }
            
            // 如果找到至少5个连续的无主格子，返回中心位置
            if (connectedCells.length >= 5) {
                // 计算中心位置
                const center = connectedCells.reduce((sum, cell) => {
                    return { x: sum.x + cell.x, y: sum.y + cell.y };
                }, { x: 0, y: 0 });
                
                center.x = Math.round(center.x / connectedCells.length);
                center.y = Math.round(center.y / connectedCells.length);
                
                return center;
            }
        }
        
        return null;
    }
    
    // 打乱数组
    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
    
    // 寻找两个文明之间的相邻格子
    findAdjacentCellsBetweenCivs(civ1Id, civ2Id) {
        const adjacentCells = [];
        
        // 遍历所有格子
        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                const territory = this.territory[y][x];
                
                // 如果当前格子属于civ1
                if (territory.owner === civ1Id) {
                    // 检查周围8个格子
                    const neighbors = [
                        { x: x-1, y: y-1 }, { x: x, y: y-1 }, { x: x+1, y: y-1 },
                        { x: x-1, y: y },                     { x: x+1, y: y },
                        { x: x-1, y: y+1 }, { x: x, y: y+1 }, { x: x+1, y: y+1 }
                    ];
                    
                    // 检查是否有邻居属于civ2
                    for (const neighbor of neighbors) {
                        if (neighbor.x >= 0 && neighbor.x < this.cols && neighbor.y >= 0 && neighbor.y < this.rows) {
                            const neighborTerritory = this.territory[neighbor.y][neighbor.x];
                            if (neighborTerritory.owner === civ2Id) {
                                adjacentCells.push({ x, y });
                                break;
                            }
                        }
                    }
                }
            }
        }
        
        return adjacentCells;
    }
}