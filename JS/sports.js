// 运动比赛记录数据 - 从外部文件加载
let raceRecords = [];

// 模拟比赛记录数据，用于在无法加载外部JSON文件时使用
const mockRaceRecords = [
    {
        "id": 1,
        "name": "2023城市马拉松",
        "date": "2023-03-15",
        "location": "北京",
        "event": "全程马拉松",
        "distance": "42.195公里",
        "result": "3:45:30",
        "pace": "5'20'/公里",
        "season": "2023春季",
        "isTrail": false,
        "certification": ["AIMS"],
        "stravaLink": ""
    },
    {
        "id": 2,
        "name": "2023春季10公里赛",
        "date": "2023-04-22",
        "location": "上海",
        "event": "10公里",
        "distance": "10公里",
        "result": "42:15",
        "pace": "4'13'/公里",
        "season": "2023春季",
        "isTrail": false,
        "certification": [],
        "stravaLink": ""
    },
    {
        "id": 3,
        "name": "2023越野挑战赛",
        "date": "2023-06-10",
        "location": "杭州",
        "event": "越野20公里",
        "distance": "20公里",
        "result": "2:15:40",
        "pace": "6'47'/公里",
        "season": "2023夏季",
        "isTrail": true,
        "certification": [],
        "stravaLink": ""
    },
    {
        "id": 4,
        "name": "2023秋季半马",
        "date": "2023-09-17",
        "location": "广州",
        "event": "半程马拉松",
        "distance": "21.0975公里",
        "result": "1:48:22",
        "pace": "5'07'/公里",
        "season": "2023秋季",
        "isTrail": false,
        "certification": ["IAAF"],
        "stravaLink": ""
    },
    {
        "id": 5,
        "name": "2023冬季5公里赛",
        "date": "2023-12-03",
        "location": "深圳",
        "event": "5公里",
        "distance": "5公里",
        "result": "19:30",
        "pace": "3'54'/公里",
        "season": "2023冬季",
        "isTrail": false,
        "certification": [],
        "stravaLink": ""
    }
];

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

// 从距离字符串中提取公里数
function extractDistanceInKm(distanceStr) {
    // 匹配数字部分，支持小数
    const match = distanceStr.match(/([\d.]+)/);
    return match ? parseFloat(match[1]) : 0;
}

// 计算配速（分:秒/公里）
function calculatePace(result, distanceStr) {
    // 解析成绩为总秒数
    const totalSeconds = convertResultToSeconds(result);
    if (totalSeconds === 0) return "0'00\"/公里";
    
    // 解析距离为公里数
    const distanceKm = extractDistanceInKm(distanceStr);
    if (distanceKm === 0) return "0'00\"/公里";
    
    // 计算每公里配速（秒）
    const paceSecondsPerKm = totalSeconds / distanceKm;
    
    // 转换为分:秒格式
    const paceMinutes = Math.floor(paceSecondsPerKm / 60);
    const paceSeconds = Math.round(paceSecondsPerKm % 60);
    
    return `${paceMinutes}'${paceSeconds.toString().padStart(2, '0')}\"/公里`;
}

// 按项目分组比赛记录
function groupRacesByEvent(races) {
    const grouped = {};
    races.forEach(race => {
        if (!grouped[race.event]) {
            grouped[race.event] = [];
        }
        grouped[race.event].push(race);
    });
    return grouped;
}

// 按赛季和项目分组比赛记录
function groupRacesBySeasonAndEvent(races) {
    const grouped = {};
    races.forEach(race => {
        const key = `${race.season}-${race.event}`;
        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(race);
    });
    return grouped;
}

// 找出每个项目的个人最佳(PB) - 排除越野赛
function findPersonalBests(races) {
    // 过滤掉越野赛
    const nonTrailRaces = races.filter(race => !race.isTrail);
    
    const racesByEvent = groupRacesByEvent(nonTrailRaces);
    const pbs = {};
    
    Object.keys(racesByEvent).forEach(event => {
        const eventRaces = racesByEvent[event];
        // 按成绩排序（升序，时间越短越好）
        eventRaces.sort((a, b) => convertResultToSeconds(a.result) - convertResultToSeconds(b.result));
        // 最佳成绩是第一个
        if (eventRaces.length > 0) {
            pbs[event] = eventRaces[0].id;
        }
    });
    
    return pbs;
}

// 找出每个赛季每个项目的赛季最佳(SB) - 排除越野赛
function findSeasonBests(races) {
    // 过滤掉越野赛
    const nonTrailRaces = races.filter(race => !race.isTrail);
    
    const racesBySeasonEvent = groupRacesBySeasonAndEvent(nonTrailRaces);
    const sbs = {};
    
    Object.keys(racesBySeasonEvent).forEach(key => {
        const seasonEventRaces = racesBySeasonEvent[key];
        // 按成绩排序（升序，时间越短越好）
        seasonEventRaces.sort((a, b) => convertResultToSeconds(a.result) - convertResultToSeconds(b.result));
        // 最佳成绩是第一个
        if (seasonEventRaces.length > 0) {
            sbs[seasonEventRaces[0].id] = true;
        }
    });
    
    return sbs;
}

// 按赛季对比赛记录进行分组
function groupRacesBySeason(races) {
    const grouped = {};
    races.forEach(race => {
        if (!grouped[race.season]) {
            grouped[race.season] = [];
        }
        grouped[race.season].push(race);
    });
    return grouped;
}

// 生成个人记录HTML - 排除越野赛
function generatePersonalRecords(races) {
    const pbs = findPersonalBests(races);
    const raceMap = {};
    
    // 创建比赛记录映射，方便查找
    races.forEach(race => {
        raceMap[race.id] = race;
    });
    
    // 创建个人记录容器
    const prContainer = document.createElement('div');
    prContainer.className = 'personal-records';
    prContainer.innerHTML = '<h2>个人最佳成绩(PB)</h2>';
    
    // 创建个人记录内容容器
    const prContent = document.createElement('div');
    prContent.className = 'personal-records-content';
    
    // 为每个项目的PB生成HTML
    Object.keys(pbs).forEach(event => {
        const raceId = pbs[event];
        const race = raceMap[raceId];
        
        if (race) {
            const prItem = document.createElement('div');
            prItem.className = 'personal-record-item';
            
            prItem.innerHTML = `
                <div class="pr-info">
                    <h3>${event}</h3>
                    <span class="pr-race-name">${race.name}</span>
                    <span class="pr-date">${race.date}</span>
                </div>
                <div class="pr-details">
                    <div class="pr-result">
                        <strong>最佳成绩:</strong> <span class="race-time">${race.result}</span>
                    </div>
                    <div class="pr-pace">
                        <strong>配速:</strong> ${race.pace}
                    </div>
                </div>
            `;
            
            prContent.appendChild(prItem);
        }
    });
    
    prContainer.appendChild(prContent);
    return prContainer;
}

// 生成比赛记录HTML
function generateRaceRecords() {
    const raceList = document.querySelector('.race-list');
    if (!raceList) return;
    
    // 清空现有内容
    raceList.innerHTML = '';
    
    // 找出个人最佳(PB)和赛季最佳(SB)
    const pbs = findPersonalBests(raceRecords);
    const sbs = findSeasonBests(raceRecords);
    
    // 生成个人记录并添加到mainbox中，位于比赛记录上方
    const prContainer = generatePersonalRecords(raceRecords);
    const mainbox = document.querySelector('.mainbox');
    const raceRecordsSection = document.getElementById('race-records');
    if (mainbox && raceRecordsSection) {
        mainbox.insertBefore(prContainer, raceRecordsSection);
    }
    
    // 按赛季分组比赛记录
    const racesBySeason = groupRacesBySeason(raceRecords);
    
    // 遍历每个赛季，生成HTML
    Object.keys(racesBySeason).forEach(season => {
        // 创建赛季容器
        const seasonContainer = document.createElement('div');
        seasonContainer.className = 'season-container';
        
        // 创建赛季标题栏（可点击展开/折叠）
        const seasonHeader = document.createElement('div');
        seasonHeader.className = 'season-header';
        
        // 找出本赛季的所有PB项目
        const currentSeasonRaces = racesBySeason[season];
        const pbEventsInSeason = [...new Set(
            currentSeasonRaces
                .filter(race => pbs[race.event] === race.id)
                .map(race => race.event)
        )];
        
        // 为每个PB项目生成标签HTML
        const pbTags = pbEventsInSeason
            .map(event => `<span class="race-marker pb">${event}-PB</span>`)
            .join(' ');
        
        // 设置赛季标题内容，包含所有PB标签
        seasonHeader.innerHTML = `
            <h3>${season} ${pbTags}</h3>
            <span class="season-toggle">▶</span>
        `;
        
        // 创建赛季内容容器
        const seasonContent = document.createElement('div');
        seasonContent.className = 'season-content collapsed';
        
        // 为该赛季的所有比赛生成HTML
        racesBySeason[season].forEach(race => {
            // 检查是否为PB或SB
            const isPB = pbs[race.event] === race.id;
            const isSB = sbs[race.id];
            
            // 生成认证标记HTML
            let certificationMark = '';
            if (race.certification && Array.isArray(race.certification)) {
                race.certification.forEach(cert => {
                    certificationMark += `<span class="race-certification">${cert}</span>`;
                });
            } else if (race.certification) {
                // 兼容旧格式（单个字符串）
                certificationMark = `<span class="race-certification">${race.certification}</span>`;
            }
            
            // 生成最佳成绩标记HTML
            let markers = '';
            if (isPB) markers += `<span class="race-marker pb">${race.event}-PB</span>`;
            if (isSB) markers += `<span class="race-marker sb">${race.event}-SB</span>`;
            
            const raceItem = document.createElement('div');
            raceItem.className = 'race-item';
            
            raceItem.innerHTML = `
                <div class="race-info">
                    <h3 class="race-title">${race.name}</h3>
                    <div class="race-tags">${certificationMark} ${markers}</div>
                    <div class="race-meta">
                        <span class="race-date">${race.date}</span>
                        <span class="race-location">${race.location}</span>
                    </div>
                </div>
                <div class="race-details">
                    <div class="race-event">
                        <strong>项目:</strong> ${race.event}
                    </div>
                    <div class="race-result">
                        <strong>成绩:</strong> <span class="race-time">${race.result}</span>
                    </div>
                    <div class="race-distance">
                        <strong>距离:</strong> ${race.distance}
                    </div>
                    <div class="race-pace">
                        <strong>配速:</strong> ${race.pace}
                    </div>
                    <div class="race-links">
                        <a href="${race.stravaLink}" class="sports_record" target="_blank">查看Strava活动</a>
                    </div>
                </div>
            `;
            
            seasonContent.appendChild(raceItem);
        });
        
        // 添加赛季容器到列表
        seasonContainer.appendChild(seasonHeader);
        seasonContainer.appendChild(seasonContent);
        raceList.appendChild(seasonContainer);
        
        // 添加展开/折叠事件监听
        seasonHeader.addEventListener('click', () => {
            seasonContent.classList.toggle('collapsed');
            const toggleIcon = seasonHeader.querySelector('.season-toggle');
            toggleIcon.textContent = seasonContent.classList.contains('collapsed') ? '▶' : '▼';
        });
    });
}

// 页面加载时从外部JSON文件加载数据并生成比赛记录
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const response = await fetch('../documents/race-records.json');
        raceRecords = await response.json();
        
        // 自动计算缺失的配速
        raceRecords.forEach(race => {
            if (!race.pace || race.pace === "") {
                race.pace = calculatePace(race.result, race.distance);
            }
        });
        
        generateRaceRecords();
    } catch (error) {
        console.error('加载比赛记录数据失败，使用模拟数据:', error);
        // 使用模拟数据
        raceRecords = mockRaceRecords;
        generateRaceRecords();
    }
});
