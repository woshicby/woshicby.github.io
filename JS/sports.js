// 运动比赛记录数据 - 从外部文件加载
let raceRecords = [];

// 模拟比赛记录数据，用于在无法加载外部JSON文件时使用
const mockRaceRecords = [
    {
        "id": 1,
        "name": "2023年海南城市夜跑",
        "date": "2023-08-18",
        "location": "海南省海口市龙华区世纪公园(渡海路西)",
        "event": "5km",
        "result": "25:37",
        "distance": "5公里",
        "pace": "",
        "stravaLink": "",
        "season": "2023秋季",
        "certification": [],
        "isTrail": false
    },
    {
        "id": 2,
        "name": "2023海南儋州马拉松",
        "date": "2023-12-17",
        "location": "海南省儋州市那大镇",
        "event": "半程马拉松",
        "result": "1:50:40",
        "distance": "21.0975公里",
        "pace": "",
        "stravaLink": "",
        "season": "2023秋季",
        "certification": ["A1","国际标牌"],
        "isTrail": false
    },
    {
        "id": 3,
        "name": "2024茂名马拉松",
        "date": "2024-03-24",
        "location": "广东省茂名市中国第一滩",
        "event": "半程马拉松",
        "result": "1:47:22",
        "distance": "21.0975公里",
        "pace": "",
        "stravaLink": "",
        "season": "2024春季",
        "certification": ["A1"],
        "isTrail": false
    },
    {
        "id": 4,
        "name": "2024陵水半程马拉松",
        "date": "2024-03-31",
        "location": "海南省陵水黎族自治县英州镇清水湾",
        "event": "半程马拉松",
        "result": "2:13:58",
        "distance": "21.0975公里",
        "pace": "",
        "stravaLink": "",
        "season": "2024春季",
        "certification": ["A1"],
        "isTrail": false
    },
    {
        "id": 5,
        "name": "2024年海南大学第二届荧光夜跑",
        "date": "2024-04-20",
        "location": "海南大学海甸校区第一田径场",
        "event": "3.4km",
        "result": "24:19",
        "distance": "3.4公里",
        "pace": "",
        "stravaLink": "",
        "season": "2024春季",
        "certification": [],
        "isTrail": true
    },
    {
        "id": 6,
        "name": "2024海南（海口）万人健步大会",
        "date": "2024-04-27",
        "location": "海南省海口市白沙门公园阳光草坪",
        "event": "8.8km",
        "result": "51:06",
        "distance": "8.8公里",
        "pace": "",
        "stravaLink": "",
        "season": "2024春季",
        "certification": [],
        "isTrail": true
    },
    {
        "id": 7,
        "name": "2024海口湾路跑段位赛(5K)",
        "date": "2024-05-01",
        "location": "海南省海口市海口湾",
        "event": "5km",
        "result": "22:23",
        "distance": "5公里",
        "pace": "",
        "stravaLink": "",
        "season": "2024春季",
        "certification": [],
        "isTrail": false
    },
    {
        "id": 8,
        "name": "2024海南定安幸福跑",
        "date": "2024-05-12",
        "location": "海南省定安县",
        "event": "10km",
        "result": "49:45",
        "distance": "10公里",
        "pace": "",
        "stravaLink": "",
        "season": "2024春季",
        "certification": [],
        "isTrail": false
    },
    {
        "id": 9,
        "name": "2024高校百英里资格赛（海南大学）-5月",
        "date": "2024-05-18",
        "location": "海南大学海甸校区第二田径场",
        "event": "3000m",
        "result": "12:41",
        "distance": "3公里",
        "pace": "",
        "stravaLink": "",
        "season": "2024春季",
        "certification": [],
        "isTrail": false
    },
    {
        "id": 10,
        "name": "2024高校百英里资格赛（海南大学）-6月",
        "date": "2024-06-10",
        "location": "海南大学海甸校区第二田径场",
        "event": "3000m",
        "result": "12:46",
        "distance": "3公里",
        "pace": "",
        "stravaLink": "",
        "season": "2024春季",
        "certification": [],
        "isTrail": false
    },
    {
        "id": 11,
        "name": "2024夜跑莆田木兰溪马拉松接力赛",
        "date": "2024-08-03",
        "location": "福建省莆田市体育中心",
        "event": "5200m",
        "result": "24:31",
        "distance": "5.20公里",
        "pace": "",
        "stravaLink": "",
        "season": "2024春季",
        "certification": [],
        "isTrail": true
    },
    {
        "id": 12,
        "name": "南国食品·2024年（第二届）全民健康跑（10km段位赛）",
        "date": "2024-10-07",
        "location": "海南省海口市龙华区海口湾1号西北(观海路南)FUNBAY自在湾",
        "event": "10km",
        "result": "47:27",
        "distance": "10公里",
        "pace": "",
        "stravaLink": "",
        "season": "2024秋季",
        "certification": [],
        "isTrail": false
    },
    {
        "id": 13,
        "name": "2024澄迈半程马拉松",
        "date": "2024-11-17",
        "location": "海南省澄迈县",
        "event": "半程马拉松",
        "result": "1:41:51",
        "distance": "21.0975公里",
        "pace": "",
        "stravaLink": "",
        "season": "2024秋季",
        "certification": ["A1"],
        "isTrail": false
    },
    {
        "id": 14,
        "name": "2024海南儋州马拉松",
        "date": "2024-12-15",
        "location": "海南省儋州市那大镇",
        "event": "半程马拉松",
        "result": "1:40:53",
        "distance": "21.0975公里",
        "pace": "",
        "stravaLink": "",
        "season": "2024秋季",
        "certification": ["A1","国际标牌"],
        "isTrail": false
    },
    {
        "id": 15,
        "name": "2024莆田木兰溪马拉松",
        "date": "2024-12-29",
        "location": "福建省莆田市",
        "event": "半程马拉松",
        "result": "1:51:24",
        "distance": "21.0975公里",
        "pace": "",
        "stravaLink": "",
        "season": "2024秋季",
        "certification": ["A1"],
        "isTrail": false
    },
    {
        "id": 16,
        "name": "2025万宁马拉松",
        "date": "2025-03-02",
        "location": "海南省万宁市",
        "event": "半程马拉松",
        "result": "2:13:07",
        "distance": "21.0975公里",
        "pace": "",
        "stravaLink": "",
        "season": "2025春季",
        "certification": ["C"],
        "isTrail": false
    },
    {
        "id": 17,
        "name": "2025陵水半程马拉松",
        "date": "2025-03-09",
        "location": "海南省陵水黎族自治县",
        "event": "半程马拉松",
        "result": "1:48:48",
        "distance": "21.0975公里",
        "pace": "",
        "stravaLink": "",
        "season": "2025春季",
        "certification": ["C"],
        "isTrail": false
    },
    {
        "id": 18,
        "name": "2025年海南大学第三届荧光夜跑",
        "date": "2025-04-19",
        "location": "海南大学海甸校区第一田径场",
        "event": "3.4km",
        "result": "23:19",
        "distance": "3.40公里",
        "pace": "",
        "stravaLink": "",
        "season": "2025春季",
        "certification": [],
        "isTrail": true
    },
    {
        "id": 19,
        "name": "2025海南定安幸福跑",
        "date": "2025-05-11",
        "location": "海南省定安县",
        "event": "10km",
        "result": "50:48",
        "distance": "10公里",
        "pace": "",
        "stravaLink": "",
        "season": "2025春季",
        "certification": [],
        "isTrail": false
    },
    {
        "id": 20,
        "name": "2025中国(海南)热带雨林健步走公开赛(10k)",
        "date": "2025-06-01",
        "location": "海南省五指山市",
        "event": "10km",
        "result": "1:06:14",
        "distance": "10公里",
        "pace": "",
        "stravaLink": "",
        "season": "2025春季",
        "certification": ["C"],
        "isTrail": false
    },
    {
        "id": 21,
        "name": "2025莱州（石都）半程马拉松",
        "date": "2025-09-14",
        "location": "山东省烟台市莱州市市民之家",
        "event": "半程马拉松",
        "result": "1:58:28",
        "distance": "21.0975公里",
        "pace": "",
        "stravaLink": "",
        "season": "2025秋季",
        "certification": ["C"],
        "isTrail": false
    },
    {
        "id": 22,
        "name": "2025昆嵛50越野挑战赛",
        "date": "2025-09-21",
        "location": "山东省威海市文登区昆嵛山",
        "event": "问水·25km",
        "result": "4:56:02",
        "distance": "28公里",
        "pace": "",
        "stravaLink": "",
        "season": "2025秋季",
        "certification": ["ITRA 1分"],
        "isTrail": true
    },
    {
        "id": 23,
        "name": "2025烟台山星空越野赛",
        "date": "2025-10-05",
        "location": "山东省烟台市芝罘区滨海广场",
        "event": "22km",
        "result": "3:09:59",
        "distance": "22公里",
        "pace": "",
        "stravaLink": "",
        "season": "2025秋季",
        "certification": ["ITRA 1分"],
        "isTrail": true
    },
    {
        "id": 24,
        "name": "2025栖霞环湖赛",
        "date": "2025-10-12",
        "location": "山东省烟台市栖霞龙腾广场",
        "event": "20.25km",
        "result": "1:27:30",
        "distance": "16.68公里",
        "pace": "",
        "stravaLink": "",
        "season": "2025秋季",
        "certification": ["C"],
        "isTrail": true
    },
    {
        "id": 25,
        "name": "2025黄河口（东营）马拉松",
        "date": "2025-10-19",
        "location": "山东省东营市新世纪广场",
        "event": "半程马拉松",
        "result": "1:44:17",
        "distance": "21.0975公里",
        "pace": "",
        "stravaLink": "",
        "season": "2025秋季",
        "certification": ["A1","国际金标"],
        "isTrail": false
    },
    {
        "id": 26,
        "name": "2025日照马拉松",
        "date": "2025-10-26",
        "location": "山东省日照市人民广场",
        "event": "半程马拉松",
        "result": "1:49:43",
        "distance": "21.0975公里",
        "pace": "",
        "stravaLink": "",
        "season": "2025秋季",
        "certification": ["A1"],
        "isTrail": false
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
    
    races.forEach(race => {
        raceMap[race.id] = race;
    });
    
    // 获取硬编码的个人记录内容容器
    const prContent = document.getElementById('personal-records-content');
    if (!prContent) return;
    
    // 清空容器内容
    prContent.innerHTML = '';
    
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
    
    // 生成个人记录内容
    generatePersonalRecords(raceRecords);
    
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
        const response = await fetch('./JSON/race-records.json');
        if (!response.ok) {
            throw new Error(`HTTP错误! 状态码: ${response.status}`);
        }
        raceRecords = await response.json();
        
        // 自动计算缺失的配速
        raceRecords.forEach(race => {
            if (!race.pace || race.pace === "") {
                race.pace = calculatePace(race.result, race.distance);
            }
        });
        
        console.log('已从JSON文件加载比赛记录数据:', raceRecords.length, '条记录');
        generateRaceRecords();
        // 加载并处理完赛证书数据
        loadCertificatesData();
    } catch (error) {
        console.error('加载比赛记录数据失败，使用模拟数据:', error);
        // 使用模拟数据
        raceRecords = mockRaceRecords;
        console.log('已使用模拟数据:', raceRecords.length, '条记录');
        generateRaceRecords();
        // 加载并处理完赛证书数据
        loadCertificatesData();
    }
});

// 加载完赛证书数据 - 现在从raceRecords中获取信息
function loadCertificatesData() {
    // 从raceRecords中构建证书列表
    const certificates = raceRecords.map(race => {
        // 从日期字符串中提取YYYYMMDD格式的日期部分
        const datePart = race.date.replace(/-/g, '');
        
        // 构建证书对象
        return {
            id: race.id,
            name: race.name,
            date: race.date,
            datePart: datePart
        };
    });
    
    // 调用生成证书函数
    generateCertificates(certificates);
}

// 生成完赛证书HTML
function generateCertificates(certificates) {
    const certificatesGrid = document.getElementById('certificates-grid');
    if (!certificatesGrid) return;
    
    // 清空现有内容
    certificatesGrid.innerHTML = '';
    
    // 按日期倒序排序证书
    certificates.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // 定义可能的文件扩展名
    const extensions = ['.png', '.jpg', '.jpeg'];
    
    certificates.forEach(certificate => {
        const certificateItem = document.createElement('div');
        certificateItem.className = 'certificate-item';
        
        // 创建证书图片链接
        const certificateLink = document.createElement('a');
        certificateLink.target = '_blank';
        certificateLink.rel = 'noopener noreferrer';
        
        // 创建证书图片容器
        const certificateImageContainer = document.createElement('div');
        certificateImageContainer.style.width = '100%';
        certificateImageContainer.style.overflow = 'hidden';
        certificateImageContainer.style.display = 'flex';
        certificateImageContainer.style.justifyContent = 'center';
        certificateImageContainer.style.alignItems = 'center';
        certificateImageContainer.style.backgroundColor = 'var(--background-color)';
        
        // 创建证书图片
        const certificateImage = document.createElement('img');
        certificateImage.alt = `${certificate.name}完赛证书`;
        certificateImage.style.width = '100%';
        certificateImage.style.height = '100%';
        certificateImage.style.objectFit = 'contain';
        certificateImage.style.display = 'block';
        
        // 创建证书信息区域
        const certificateInfo = document.createElement('div');
        certificateInfo.style.padding = '1rem';
        certificateInfo.style.background = 'var(--card-bg-color)';
        
        // 创建证书标题
        const certificateTitle = document.createElement('h3');
        certificateTitle.textContent = certificate.name;
        certificateTitle.style.margin = '0 0 0.5rem 0';
        certificateTitle.style.fontSize = '1.1rem';
        
        // 创建证书日期
        const certificateDate = document.createElement('p');
        certificateDate.textContent = `比赛日期: ${certificate.date}`;
        certificateDate.style.margin = '0';
        certificateDate.style.color = 'var(--secondary-color)';
        certificateDate.style.fontSize = '0.9rem';
        
        // 组装证书信息
        certificateInfo.appendChild(certificateTitle);
        certificateInfo.appendChild(certificateDate);
        
        // 尝试不同的文件扩展名
        let index = 0;
        const tryNextExtension = () => {
            if (index < extensions.length) {
                const extension = extensions[index];
                const filename = `${certificate.datePart}-${certificate.id}${extension}`;
                const imagePath = `./images/finisher_certificates/${filename}`;
                
                certificateImage.src = imagePath;
                certificateLink.href = imagePath;
                index++;
            } else {
                // 所有扩展名都尝试过，文件不存在，隐藏此证书项
                certificateItem.style.display = 'none';
            }
        };
        
        // 设置图片加载失败事件处理程序
        certificateImage.onerror = tryNextExtension;
        
        // 设置图片加载成功事件处理程序
        certificateImage.onload = () => {
            // 图片加载成功，不需要隐藏
        };
        
        // 开始尝试第一个扩展名
        tryNextExtension();
        
        // 组装证书项
        certificateImageContainer.appendChild(certificateImage);
        certificateLink.appendChild(certificateImageContainer);
        certificateItem.appendChild(certificateLink);
        certificateItem.appendChild(certificateInfo);
        
        // 添加到证书网格
        certificatesGrid.appendChild(certificateItem);
    });
}
