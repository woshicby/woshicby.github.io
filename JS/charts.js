// 图表相关功能实现

// 将时间格式的成绩转换为总秒数以便比较
function convertResultToSeconds(result) {
    const parts = result.split(':').map(Number);
    if (parts.length === 3) {
        // 格式为 时:分:秒
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    } else if (parts.length === 2) {
        // 格式为 分:秒
        return parts[0] * 60 + parts[1];
    }
    return 0;
}

// 将秒数转换为时间格式（hh:mm:ss）
function convertSecondsToTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
}

// 按项目分组赛事数据
function groupRacesByEvent(races) {
    const grouped = {};
    races.forEach(race => {
        let eventKey = race.event;
        // 如果是越野跑，统一使用"越野跑"作为项目名称
        if (race.category === '越野跑') {
            eventKey = '越野跑';
        }
        if (!grouped[eventKey]) {
            grouped[eventKey] = [];
        }
        grouped[eventKey].push(race);
    });
    return grouped;
}

// 按赛事系列和项目分组赛事数据
function groupRacesByEventSeries(races) {
    const grouped = {};
    races.forEach(race => {
        const key = `${race.eventSeries}-${race.event}`;
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(race);
    });
    return grouped;
}

// 计算统计指标
function calculateStats(races) {
    const times = races.map(race => convertResultToSeconds(race.result));
    if (times.length === 0) {
        return {
            allTimeAverage: 0,
            oneYearAverage: 0,
            hasOneYearData: false,
            max: 0,
            min: 0,
            trend: 0,
            daysSinceLastRace: 0,
            averageRaceScore: 0,
            maxRaceScore: 0,
            minRaceScore: 0,
            raceScoreTrend: 0
        };
    }
    
    // 计算全部平均成绩
    const sum = times.reduce((a, b) => a + b, 0);
    const allTimeAverage = Math.round(sum / times.length);
    const max = Math.max(...times);
    const min = Math.min(...times);
    
    // 计算趋势（简单线性回归）
    let trend = 0;
    if (times.length > 1) {
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        times.forEach((time, index) => {
            sumX += index;
            sumY += time;
            sumXY += index * time;
            sumX2 += index * index;
        });
        const n = times.length;
        const denominator = n * sumX2 - sumX * sumX;
        if (denominator !== 0) {
            trend = (n * sumXY - sumX * sumY) / denominator;
        }
    }
    
    // 计算近一年平均成绩
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const recentRaces = races.filter(race => new Date(race.date) >= oneYearAgo);
    const hasOneYearData = recentRaces.length > 0;
    let oneYearAverage = 0;
    
    if (hasOneYearData) {
        const recentTimes = recentRaces.map(race => convertResultToSeconds(race.result));
        const recentSum = recentTimes.reduce((a, b) => a + b, 0);
        oneYearAverage = Math.round(recentSum / recentTimes.length);
    }
    
    // 计算上次参赛多少天前
    const sortedRaces = [...races].sort((a, b) => new Date(b.date) - new Date(a.date));
    const lastRaceDate = new Date(sortedRaces[0].date);
    const today = new Date();
    const timeDiff = today.getTime() - lastRaceDate.getTime();
    const daysSinceLastRace = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    // 计算ITRA表现分相关统计
    const raceScores = races.map(race => race.raceScore ? parseInt(race.raceScore) : 0);
    const validRaceScores = raceScores.filter(score => score > 0);
    
    let averageRaceScore = 0;
    let maxRaceScore = 0;
    let minRaceScore = 0;
    let raceScoreTrend = 0;
    
    if (validRaceScores.length > 0) {
        const raceScoreSum = validRaceScores.reduce((a, b) => a + b, 0);
        averageRaceScore = Math.round(raceScoreSum / validRaceScores.length);
        maxRaceScore = Math.max(...validRaceScores);
        minRaceScore = Math.min(...validRaceScores);
        
        // 计算raceScore趋势
        if (validRaceScores.length > 1) {
            let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
            validRaceScores.forEach((score, index) => {
                sumX += index;
                sumY += score;
                sumXY += index * score;
                sumX2 += index * index;
            });
            const n = validRaceScores.length;
            const denominator = n * sumX2 - sumX * sumX;
            if (denominator !== 0) {
                raceScoreTrend = (n * sumXY - sumX * sumY) / denominator;
            }
        }
    }
    
    // 计算ITRA表现分趋势
    const itraPerformanceScores = races.map(race => race.itraPerformanceScore ? parseInt(race.itraPerformanceScore) : 0);
    const validItraPerformanceScores = itraPerformanceScores.filter(score => score > 0);
    let itraPerformanceScoreTrend = 0;
    
    if (validItraPerformanceScores.length > 1) {
        let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
        validItraPerformanceScores.forEach((score, index) => {
            sumX += index;
            sumY += score;
            sumXY += index * score;
            sumX2 += index * index;
        });
        const n = validItraPerformanceScores.length;
        const denominator = n * sumX2 - sumX * sumX;
        if (denominator !== 0) {
            itraPerformanceScoreTrend = (n * sumXY - sumX * sumY) / denominator;
        }
    }
    
    return {
        allTimeAverage: allTimeAverage,
        oneYearAverage: oneYearAverage,
        hasOneYearData: hasOneYearData,
        max: max,
        min: min,
        trend: trend,
        daysSinceLastRace: daysSinceLastRace,
        averageRaceScore: averageRaceScore,
        maxRaceScore: maxRaceScore,
        minRaceScore: minRaceScore,
        raceScoreTrend: raceScoreTrend,
        itraPerformanceScoreTrend: itraPerformanceScoreTrend
    };
}

// 创建时间序列图表（项目成绩变化对比）
function createTimeSeriesChart(canvasId, data, stats, isTrailRun = false) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // 销毁已存在的图表实例
    const existingChart = Chart.getChart(canvasId);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // 准备图表数据
    const chartData = {
        labels: data.map(item => item.date),
        datasets: []
    };
    
    if (isTrailRun) {
        // 越野跑：显示ITRA表现分
        chartData.datasets.push({
            label: '比赛表现分',
            data: data.map(item => ({
                x: item.date,
                y: item.raceScore ? parseInt(item.raceScore) : 0,
                name: item.name,
                raceScore: item.raceScore
            })),
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ff6b6b',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
        },
        // ITRA表现分变化曲线
        {
            label: 'ITRA表现分',
            data: data.map(item => ({
                x: item.date,
                y: item.itraPerformanceScore ? parseInt(item.itraPerformanceScore) : 0,
                name: item.name,
                itraPerformanceScore: item.itraPerformanceScore
            })),
            borderColor: '#4ecdc4',
            backgroundColor: 'transparent',
            borderWidth: 2,
            fill: false,
            tension: 0.4,
            pointBackgroundColor: '#4ecdc4',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
        });
    } else {
        // 路跑：显示成绩
        chartData.datasets.push({
            label: '成绩 (分:秒)',
            data: data.map(item => ({
                x: item.date,
                y: convertResultToSeconds(item.result),
                name: item.name,
                result: item.result
            })),
            borderColor: '#ff6b6b',
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointBackgroundColor: '#ff6b6b',
            pointBorderColor: '#fff',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7
        },
        // 全部平均成绩水平线
        {
            label: `全部平均成绩: ${convertSecondsToTime(stats.allTimeAverage)}`,
            data: data.map(item => ({
                x: item.date,
                y: stats.allTimeAverage
            })),
            borderColor: '#4ecdc4',
            backgroundColor: 'transparent',
            borderWidth: 2,
            borderDash: [],
            fill: false,
            pointRadius: 0,
            pointHoverRadius: 0
        });
        
        // 条件性添加近一年平均成绩水平线（只有在不是赛事成绩对比图表且有近一年数据时添加）
        if (stats.hasOneYearData) {
            chartData.datasets.push({
                label: `近一年平均成绩: ${convertSecondsToTime(stats.oneYearAverage)}`,
                data: data.map(item => ({
                    x: item.date,
                    y: stats.oneYearAverage
                })),
                borderColor: '#45b7d1',
                backgroundColor: 'transparent',
                borderWidth: 2,
                borderDash: [5, 5],
                fill: false,
                pointRadius: 0,
                pointHoverRadius: 0
            });
        }
    }
    
    // 配置图表选项
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: isTrailRun ? 'ITRA表现分' : '成绩 (秒)'
                    },
                    ticks: {
                        callback: function(value) {
                            return isTrailRun ? value : convertSecondsToTime(value);
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: '日期'
                    },
                    ticks: {
                        maxRotation: 45,
                        minRotation: 45
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        title: function(context) {
                            const data = context[0].raw;
                            return `${data.name}\n${data.x}`;
                        },
                        label: function(context) {
                            if (isTrailRun) {
                                const raceScore = context.raw.raceScore;
                                const itraPerformanceScore = context.raw.itraPerformanceScore;
                                if (raceScore) {
                                    return `比赛表现分: ${raceScore}`;
                                } else if (itraPerformanceScore) {
                                    return `ITRA表现分: ${itraPerformanceScore}`;
                                }
                                return '';
                            } else {
                                const result = context.raw.result;
                                return `成绩: ${result}`;
                            }
                        }
                    }
                },
                zoom: {
                    zoom: {
                        wheel: {
                            enabled: false,
                        },
                        pinch: {
                            enabled: false
                        },
                        mode: 'x',
                    },
                    pan: {
                        enabled: false,
                        mode: 'x',
                    }
                },
                legend: {
                    display: true,
                    position: 'top'
                }
            }
        };
    
    // 创建图表
    return new Chart(ctx, {
        type: 'line',
        data: chartData,
        options: chartOptions
    });
}

// 创建横向对比图表（同一赛事多届成绩对比）
function createHorizontalComparisonChart(canvasId, data) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // 销毁已存在的图表实例
    const existingChart = Chart.getChart(canvasId);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // 准备图表数据
    const chartData = {
        labels: data.map(item => item.name),
        datasets: [{
            label: '成绩 (分:秒)',
            data: data.map(item => convertResultToSeconds(item.result)),
            backgroundColor: '#4ecdc4',
            borderColor: '#45b7aa',
            borderWidth: 1
        }]
    };
    
    // 配置图表选项
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: false,
                title: {
                    display: true,
                    text: '成绩 (秒)'
                },
                ticks: {
                    callback: function(value) {
                        return convertSecondsToTime(value);
                    }
                }
            },
            x: {
                title: {
                    display: true,
                    text: '赛事名称'
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        },
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(context) {
                        const value = context.raw;
                        return `成绩: ${convertSecondsToTime(value)}`;
                    }
                }
            },
            legend: {
                display: true,
                position: 'top'
            }
        }
    };
    
    // 创建图表
    return new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: chartOptions
    });
}

// 生成成绩分布热力图数据
function generateHeatmapData(races) {
    const times = races.map(race => convertResultToSeconds(race.result));
    if (times.length === 0) return [];
    
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const binSize = Math.ceil((maxTime - minTime) / 10); // 10个区间
    
    const bins = Array(10).fill(0);
    times.forEach(time => {
        const binIndex = Math.min(Math.floor((time - minTime) / binSize), 9);
        bins[binIndex]++;
    });
    
    return {
        bins: bins,
        binSize: binSize,
        minTime: minTime
    };
}

// 创建成绩分布热力图
function createHeatmapChart(canvasId, heatmapData) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    
    // 销毁已存在的图表实例
    const existingChart = Chart.getChart(canvasId);
    if (existingChart) {
        existingChart.destroy();
    }
    
    // 准备图表数据
    const labels = heatmapData.bins.map((_, index) => {
        const start = heatmapData.minTime + index * heatmapData.binSize;
        const end = start + heatmapData.binSize;
        return `${convertSecondsToTime(start)} - ${convertSecondsToTime(end)}`;
    });
    
    const chartData = {
        labels: labels,
        datasets: [{
            label: '成绩分布',
            data: heatmapData.bins,
            backgroundColor: [
                'rgba(255, 99, 132, 0.6)',
                'rgba(255, 159, 64, 0.6)',
                'rgba(255, 205, 86, 0.6)',
                'rgba(75, 192, 192, 0.6)',
                'rgba(54, 162, 235, 0.6)',
                'rgba(153, 102, 255, 0.6)',
                'rgba(201, 203, 207, 0.6)',
                'rgba(100, 200, 100, 0.6)',
                'rgba(200, 100, 200, 0.6)',
                'rgba(100, 100, 200, 0.6)'
            ],
            borderColor: [
                'rgb(255, 99, 132)',
                'rgb(255, 159, 64)',
                'rgb(255, 205, 86)',
                'rgb(75, 192, 192)',
                'rgb(54, 162, 235)',
                'rgb(153, 102, 255)',
                'rgb(201, 203, 207)',
                'rgb(100, 200, 100)',
                'rgb(200, 100, 200)',
                'rgb(100, 100, 200)'
            ],
            borderWidth: 1
        }]
    };
    
    // 配置图表选项
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
            y: {
                beginAtZero: true,
                title: {
                    display: true,
                    text: '次数'
                }
            },
            x: {
                title: {
                    display: true,
                    text: '成绩区间'
                },
                ticks: {
                    maxRotation: 45,
                    minRotation: 45
                }
            }
        },
        plugins: {
            legend: {
                display: true,
                position: 'top'
            }
        }
    };
    
    // 创建图表
    return new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: chartOptions
    });
}

// 初始化项目成绩对比功能
function initProjectComparison(races) {
    const projectSelect = document.getElementById('project-select');
    const statsContainer = document.getElementById('project-stats');
    
    if (!projectSelect || !statsContainer) return;
    
    // 按项目分组
    const racesByEvent = groupRacesByEvent(races);
    
    // 特殊处理：将所有越野跑归为一个项目
    const trailRuns = races.filter(race => race.category === '越野跑');
    if (trailRuns.length >= 2) {
        racesByEvent['越野跑'] = trailRuns;
    }
    
    // 填充项目选择下拉框（只显示有多次记录的项目）
    const validEvents = Object.keys(racesByEvent).filter(event => racesByEvent[event].length >= 2);
    
    validEvents.forEach(event => {
        const option = document.createElement('option');
        option.value = event;
        option.textContent = event;
        projectSelect.appendChild(option);
    });
    
    // 选择第一个项目
    if (validEvents.length > 0) {
        projectSelect.value = validEvents[0];
        updateProjectComparisonChart(racesByEvent[validEvents[0]]);
    }
    
    // 添加项目选择事件监听
    projectSelect.addEventListener('change', (e) => {
        const selectedEvent = e.target.value;
        updateProjectComparisonChart(racesByEvent[selectedEvent]);
    });
}

// 更新项目成绩对比图表
function updateProjectComparisonChart(races) {
    if (!races || races.length === 0) return;
    
    // 判断是否是越野跑
    const isTrailRun = races[0] && races[0].category === '越野跑';
    
    // 过滤掉未来赛事（没有结果的赛事）
    const pastRaces = races.filter(race => race.result && race.result !== '');
    if (pastRaces.length === 0) return;
    
    // 按日期排序
    const sortedRaces = [...pastRaces].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 计算统计指标
    const stats = calculateStats(sortedRaces);
    
    // 创建时间序列图表
    createTimeSeriesChart('project-comparison-chart', sortedRaces, stats, isTrailRun);
    
    // 更新统计指标显示
    const statsContainer = document.getElementById('project-stats');
    if (statsContainer) {
        let statsHtml = '';
        
        if (isTrailRun) {
            // 越野跑：显示ITRA表现分，不显示平均成绩和近一年平均成绩
            // 获取最新的ITRA表现分
            const latestItraScore = sortedRaces.length > 0 
                ? (sortedRaces[sortedRaces.length - 1].itraPerformanceScore || 0)
                : 0;
            
            statsHtml = `
                <div class="stat-item">
                    <h4>当前ITRA表现分</h4>
                    <p>${latestItraScore}</p>
                </div>
                <div class="stat-item">
                    <h4>最佳比赛表现分</h4>
                    <p>${stats.maxRaceScore || '-'}</p>
                </div>
                <div class="stat-item">
                    <h4>最差比赛表现分</h4>
                    <p>${stats.minRaceScore || '-'}</p>
                </div>
                <div class="stat-item">
                    <h4>表现分趋势</h4>
                    <p>${stats.itraPerformanceScoreTrend > 0 ? '进步' : stats.itraPerformanceScoreTrend < 0 ? '退步' : '持平'}</p>
                </div>
                <div class="stat-item">
                    <h4>上次参赛</h4>
                    <p>${stats.daysSinceLastRace}天前</p>
                </div>
            `;
        } else {
            // 路跑：显示平均成绩等
            statsHtml = `
                <div class="stat-item">
                    <h4>全部平均成绩</h4>
                    <p>${convertSecondsToTime(stats.allTimeAverage)}</p>
                </div>
                <div class="stat-item">
                    <h4>最佳成绩</h4>
                    <p>${convertSecondsToTime(stats.min)}</p>
                </div>
                <div class="stat-item">
                    <h4>最差成绩</h4>
                    <p>${convertSecondsToTime(stats.max)}</p>
                </div>
                <div class="stat-item">
                    <h4>变化趋势</h4>
                    <p>${stats.trend < 0 ? '进步' : stats.trend > 0 ? '退步' : '持平'}</p>
                </div>
                <div class="stat-item">
                    <h4>上次参赛</h4>
                    <p>${stats.daysSinceLastRace}天前</p>
                </div>
            `;
            
            // 条件性添加近一年平均成绩
            if (stats.hasOneYearData) {
                statsHtml = `
                    <div class="stat-item">
                        <h4>全部平均成绩</h4>
                        <p>${convertSecondsToTime(stats.allTimeAverage)}</p>
                    </div>
                    <div class="stat-item">
                        <h4>近一年平均成绩</h4>
                        <p>${convertSecondsToTime(stats.oneYearAverage)}</p>
                    </div>
                    <div class="stat-item">
                        <h4>最佳成绩</h4>
                        <p>${convertSecondsToTime(stats.min)}</p>
                    </div>
                    <div class="stat-item">
                        <h4>最差成绩</h4>
                        <p>${convertSecondsToTime(stats.max)}</p>
                    </div>
                    <div class="stat-item">
                        <h4>变化趋势</h4>
                        <p>${stats.trend < 0 ? '进步' : stats.trend > 0 ? '退步' : '持平'}</p>
                    </div>
                    <div class="stat-item">
                        <h4>上次参赛</h4>
                        <p>${stats.daysSinceLastRace}天前</p>
                    </div>
                `;
            }
        }
        
        statsContainer.innerHTML = statsHtml;
    }
}

// 初始化赛事成绩对比功能
function initEventSeriesComparison(races) {
    const seriesSelect = document.getElementById('series-select');
    
    if (!seriesSelect) return;
    
    // 按赛事系列和项目分组
    const racesBySeries = groupRacesByEventSeries(races);
    
    // 填充赛事系列选择下拉框（只显示有多次记录的赛事系列和项目组合）
    const validSeries = Object.keys(racesBySeries).filter(series => racesBySeries[series].length >= 2);
    
    validSeries.forEach(series => {
        const option = document.createElement('option');
        option.value = series;
        // 显示格式：赛事系列名称 (项目)
        const [seriesName, event] = series.split('-');
        option.textContent = `${seriesName} (${event})`;
        seriesSelect.appendChild(option);
    });
    
    // 选择第一个赛事系列
    if (validSeries.length > 0) {
        seriesSelect.value = validSeries[0];
        updateEventSeriesComparisonChart(racesBySeries[validSeries[0]]);
    }
    
    // 添加赛事系列选择事件监听
    seriesSelect.addEventListener('change', (e) => {
        const selectedSeries = e.target.value;
        updateEventSeriesComparisonChart(racesBySeries[selectedSeries]);
    });
}

// 更新赛事成绩对比图表
function updateEventSeriesComparisonChart(races) {
    if (!races || races.length === 0) return;
    
    // 判断是否是越野跑
    const isTrailRun = races[0] && races[0].category === '越野跑';
    
    // 过滤掉未来赛事（没有结果的赛事）
    const pastRaces = races.filter(race => race.result && race.result !== '');
    if (pastRaces.length === 0) return;
    
    // 按日期排序
    const sortedRaces = [...pastRaces].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 计算统计指标
    const stats = calculateStats(sortedRaces);
    
    // 创建时间序列图表（传递第四个参数表示不添加近一年平均成绩水平线）
    createTimeSeriesChart('event-series-comparison-chart', sortedRaces, stats, isTrailRun);
    
    // 更新统计指标显示
    const statsContainer = document.getElementById('event-series-stats');
    if (statsContainer) {
        const statsHtml = `
            <div class="stat-item">
                <h4>全部平均成绩</h4>
                <p>${convertSecondsToTime(stats.allTimeAverage)}</p>
            </div>
            <div class="stat-item">
                <h4>最佳成绩</h4>
                <p>${convertSecondsToTime(stats.min)}</p>
            </div>
            <div class="stat-item">
                <h4>最差成绩</h4>
                <p>${convertSecondsToTime(stats.max)}</p>
            </div>
            <div class="stat-item">
                <h4>变化趋势</h4>
                <p>${stats.trend < 0 ? '进步' : stats.trend > 0 ? '退步' : '持平'}</p>
            </div>
            <div class="stat-item">
                <h4>上次参赛</h4>
                <p>${stats.daysSinceLastRace}天前</p>
            </div>
        `;
        
        statsContainer.innerHTML = statsHtml;
    }
}

// 导出图表为图片
function exportChart(chartId, filename) {
    const chart = Chart.getChart(chartId);
    if (chart) {
        // 创建下载链接
        const link = document.createElement('a');
        link.download = filename;
        link.href = chart.toBase64Image();
        link.click();
    }
}