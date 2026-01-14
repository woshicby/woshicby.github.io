// 赛事日历功能实现

// 赛事数据
let upcomingRaces = [];

// 当前显示的年份和月份
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// 当前视图类型：'month' 或 'year'
let currentView = 'month';

// 响应式断点（参考其他页面的响应式设置）
const RESPONSIVE_BREAKPOINT = 768;

// 优化后的赛事类型配置 - 包含颜色信息，便于集中管理和扩展
const raceTypeConfig = {
    '路跑': { color: '#ff6b6b', class: 'race-road-run' },
    '越野跑': { color: '#4bc0c0', class: 'race-trail-run' },
    '场地跑': { color: '#36a2eb', class: 'race-track-run' },
    'other': { color: '#ffcd56', class: 'race-other' }
};

// 兼容旧代码的映射，确保现有功能正常工作
const raceTypeColorMap = {};
Object.keys(raceTypeConfig).forEach(type => {
    raceTypeColorMap[type] = raceTypeConfig[type].class;
});

// 初始化赛事日历
function initCalendar() {
    // 动态生成赛事类型CSS样式
    generateRaceTypeCSS();
    
    // 加载赛事数据
    loadUpcomingRaces();
    
    // 检查视图类型（根据窗口宽度）
    checkViewType();
    
    // 渲染日历
    renderCalendar();
    
    // 初始化提醒功能
    initReminders();
    
    // 监听窗口大小变化事件
    window.addEventListener('resize', () => {
        checkViewType();
        renderCalendar();
    });
}

// 检查视图类型（根据窗口宽度）
function checkViewType() {
    if (window.innerWidth >= RESPONSIVE_BREAKPOINT) {
        currentView = 'year';
    } else {
        currentView = 'month';
    }
}

// 加载赛事数据
function loadUpcomingRaces() {
    // 从现有赛事数据中筛选出所有赛事
    upcomingRaces = raceRecords
        .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 只有在raceRecords为空时才加载示例数据
    if (upcomingRaces.length === 0) {
        // 添加一些示例赛事（兼容格式），与真实数据有明显区分
        // 包括各种边界情况：不同类型、不同认证状态、不同距离、过去/未来赛事
        const today = new Date().toISOString().split('T')[0];
        const sampleRaces = [
            {
                "id": 999,
                "name": "[示例] 2026年城市迷你跑",
                "date": today,
                "location": "市中心人民广场",
                "event": "3km",
                "result": "",
                "distance": "3公里",
                "pace": "",
                "stravaLink": "",
                "season": "2026春季",
                "certification": [],
                "category": "路跑",
                "eventSeries": "城市迷你跑"
            },
            {
                "id": 1000,
                "name": "[示例] 2026海南儋州马拉松",
                "date": "2026-05-15",
                "location": "海南省儋州市那大镇",
                "event": "半程马拉松",
                "result": "",
                "distance": "21.0975公里",
                "pace": "",
                "stravaLink": "",
                "season": "2026春季",
                "certification": ["A1","国际标牌"],
                "category": "路跑",
                "eventSeries": "海南儋州马拉松"
            },
            {
                "id": 1001,
                "name": "[示例] 2026年海南大学第四届荧光夜跑",
                "date": "2026-10-20",
                "location": "海南大学海甸校区第一田径场",
                "event": "3.4km",
                "result": "",
                "distance": "3.4公里",
                "pace": "",
                "stravaLink": "",
                "season": "2026秋季",
                "certification": [],
                "category": "越野跑",
                "eventSeries": "海南大学荧光夜跑"
            },
            {
                "id": 1002,
                "name": "[示例] 2026三亚超级马拉松",
                "date": "2025-12-31",
                "location": "海南省三亚市",
                "event": "全程马拉松",
                "result": "3:59:45",
                "distance": "42.195公里",
                "pace": "5:41",
                "stravaLink": "https://www.strava.com/activities/example",
                "season": "2025秋季",
                "certification": ["A1","国际金标"],
                "category": "路跑",
                "eventSeries": "三亚超级马拉松"
            },
            {
                "id": 1003,
                "name": "[示例] 2026昆明国际越野挑战赛",
                "date": "2026-08-25",
                "location": "云南省昆明市",
                "event": "50km",
                "result": "",
                "distance": "50公里",
                "pace": "",
                "stravaLink": "",
                "season": "2026夏季",
                "certification": ["ITRA 3分"],
                "category": "越野跑",
                "eventSeries": "昆明国际越野挑战赛"
            },
            {
                "id": 1004,
                "name": "[示例] 2026青岛半程马拉松",
                "date": "2025-11-10",
                "location": "山东省青岛市",
                "event": "半程马拉松",
                "result": "1:38:22",
                "distance": "21.0975公里",
                "pace": "4:37",
                "stravaLink": "https://www.strava.com/activities/example2",
                "season": "2025秋季",
                "certification": ["B"],
                "category": "路跑",
                "eventSeries": "青岛半程马拉松"
            },
            {
                "id": 1005,
                "name": "[示例] 2026泰山越野挑战赛",
                "date": "2026-09-15",
                "location": "山东省泰安市",
                "event": "25km",
                "result": "",
                "distance": "25公里",
                "pace": "",
                "stravaLink": "",
                "season": "2026秋季",
                "certification": ["ITRA 1分"],
                "category": "越野跑",
                "eventSeries": "泰山越野挑战赛"
            }
        ];
        
        upcomingRaces = [...upcomingRaces, ...sampleRaces];
    }
    
    // 按日期排序
    upcomingRaces.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// 动态生成赛事类型CSS样式
function generateRaceTypeCSS() {
    // 检查是否已存在样式元素
    let styleElement = document.getElementById('race-type-styles');
    
    // 如果不存在，创建新的样式元素
    if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = 'race-type-styles';
        document.head.appendChild(styleElement);
    }
    
    // 生成CSS内容
    let cssContent = '';
    Object.entries(raceTypeConfig).forEach(([type, config]) => {
        // 将十六进制颜色转换为rgba格式，添加透明度
        const hexToRgba = (hex, alpha = 0.3) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        
        cssContent += `.${config.class} { --race-color: ${hexToRgba(config.color)}; }
`;
    });
    
    // 更新样式内容
    styleElement.textContent = cssContent;
}

// 创建全局提示框元素
function createTooltip() {
    let tooltip = document.getElementById('race-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'race-tooltip';
        tooltip.className = 'race-tooltip';
        tooltip.style.display = 'none';
        document.body.appendChild(tooltip);
    }
    return tooltip;
}

// 显示赛事提示框
function showRaceTooltip(event, race) {
    const tooltip = createTooltip();
    
    // 判断是过去赛事还是未来赛事
    const currentDate = new Date();
    const raceDate = new Date(race.date);
    const isPastRace = raceDate < currentDate || (raceDate.toDateString() === currentDate.toDateString() && race.result && race.result !== '');
    
    // 生成提示框内容
    let content = `
        <div class="race-tooltip-title">${race.name}</div>
        <div class="race-tooltip-item">
            <span class="race-tooltip-label">日期：</span>${race.date}
        </div>
    `;
    
    if (isPastRace) {
        content += `
            <div class="race-tooltip-item">
                <span class="race-tooltip-label">成绩：</span>${race.result || '无成绩'}
            </div>
        `;
    } else {
        content += `
            <div class="race-tooltip-item">
                <span class="race-tooltip-label">时间：</span>${race.startTime || '待定'}
            </div>
        `;
    }
    
    tooltip.innerHTML = content;
    
    // 设置提示框位置
    tooltip.style.display = 'block';
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
}

// 隐藏赛事提示框
function hideRaceTooltip() {
    const tooltip = document.getElementById('race-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

// 渲染赛事图例
function renderLegend(calendarContainer) {
    // 创建图例容器
    const legendContainer = document.createElement('div');
    legendContainer.className = 'calendar-legend';
    
    // 创建图例标题
    const legendTitle = document.createElement('span');
    legendTitle.className = 'legend-title';
    legendTitle.textContent = '赛事类型图例：';
    legendContainer.appendChild(legendTitle);
    
    // 遍历赛事类型配置，生成图例项
    Object.entries(raceTypeConfig).forEach(([type, config]) => {
        // 跳过默认类型
        if (type === 'other') return;
        
        // 创建图例项
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        
        // 创建颜色方块
        const colorSquare = document.createElement('span');
        colorSquare.className = 'legend-color';
        // 使用与日历中相同的rgba格式，确保颜色一致
        const hexToRgba = (hex, alpha = 0.8) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        };
        colorSquare.style.backgroundColor = hexToRgba(config.color);
        legendItem.appendChild(colorSquare);
        
        // 创建类型名称
        const typeName = document.createElement('span');
        typeName.className = 'legend-text';
        typeName.textContent = type;
        legendItem.appendChild(typeName);
        
        // 添加到图例容器
        legendContainer.appendChild(legendItem);
    });
    
    // 添加到日历容器顶部
    calendarContainer.insertBefore(legendContainer, calendarContainer.firstChild);
}

// 渲染日历
function renderCalendar() {
    const calendarContainer = document.getElementById('calendar');
    if (!calendarContainer) return;
    
    // 清空日历容器
    calendarContainer.innerHTML = '';
    
    // 渲染图例
    renderLegend(calendarContainer);
    
    // 根据当前视图类型渲染不同的内容
    if (currentView === 'month') {
        renderMonthView(calendarContainer);
    } else {
        renderYearView(calendarContainer);
    }
    
    // 渲染当前视图内的赛事列表
    renderCurrentViewRaces();
}

// 渲染月视图
function renderMonthView(calendarContainer) {
    // 创建日历头部
    const calendarHeader = document.createElement('div');
    calendarHeader.className = 'calendar-header';
    
    // 月份导航按钮
    const prevMonthBtn = document.createElement('button');
    prevMonthBtn.className = 'calendar-nav-btn';
    prevMonthBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevMonthBtn.onclick = () => changeMonth(-1);
    
    const nextMonthBtn = document.createElement('button');
    nextMonthBtn.className = 'calendar-nav-btn';
    nextMonthBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextMonthBtn.onclick = () => changeMonth(1);
    
    // 月份标题
    const monthTitle = document.createElement('h3');
    monthTitle.className = 'calendar-month-title';
    monthTitle.textContent = `${currentYear}年${currentMonth + 1}月`;
    
    // 组装日历头部
    calendarHeader.appendChild(prevMonthBtn);
    calendarHeader.appendChild(monthTitle);
    calendarHeader.appendChild(nextMonthBtn);
    calendarContainer.appendChild(calendarHeader);
    
    // 创建日历表格
    const calendarTable = document.createElement('table');
    calendarTable.className = 'calendar-table';
    
    // 创建表头
    const thead = document.createElement('thead');
    const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
    const headerRow = document.createElement('tr');
    daysOfWeek.forEach(day => {
        const th = document.createElement('th');
        th.textContent = day;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    calendarTable.appendChild(thead);
    
    // 创建表体
    const tbody = document.createElement('tbody');
    
    // 获取当月第一天是星期几
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    
    // 获取当月的天数
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    // 获取上月的天数
    const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();
    
    // 生成日历单元格
    let dayCount = 1;
    let prevDayCount = daysInPrevMonth - firstDay + 1;
    let nextDayCount = 1;
    
    for (let i = 0; i < 6; i++) {
        const row = document.createElement('tr');
        
        for (let j = 0; j < 7; j++) {
            const cell = document.createElement('td');
            
            if (i === 0 && j < firstDay) {
                // 上月的日期
                cell.className = 'calendar-day other-month';
                cell.textContent = prevDayCount++;
            } else if (dayCount > daysInMonth) {
                // 下月的日期
                cell.className = 'calendar-day other-month';
                cell.textContent = nextDayCount++;
            } else {
                // 当月的日期
                const currentDate = new Date(currentYear, currentMonth, dayCount);
                // 使用本地日期字符串，避免时区问题导致的日期偏移
                const year = currentDate.getFullYear();
                const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
                const day = String(currentDate.getDate()).padStart(2, '0');
                const dateStr = `${year}-${monthStr}-${day}`;
                
                cell.className = 'calendar-day';
                cell.textContent = dayCount;
                
                // 检查当天是否有赛事
                const dayRaces = getRacesByDate(dateStr);
                if (dayRaces.length > 0) {
                    // 获取第一个赛事的类型
                    const raceType = dayRaces[0].category;
                    // 根据赛事类型添加相应的颜色类
                    const colorClass = raceTypeColorMap[raceType] || raceTypeColorMap['other'];
                    cell.classList.add(colorClass);
                    
                    // 根据赛事结果判断是过去还是未来赛事
                    const isPastRace = dayRaces[0].result && dayRaces[0].result !== '';
                    cell.classList.add(isPastRace ? 'race-past' : 'race-future');
                    
                    // 添加点击事件，显示赛事详情和提醒设置
                    cell.onclick = () => showRaceDetails(dayRaces[0]);
                    
                    // 添加鼠标悬停事件，显示赛事提示框
                    const race = dayRaces[0];
                    cell.addEventListener('mouseenter', (event) => {
                        showRaceTooltip(event, race);
                    });
                    cell.addEventListener('mouseleave', () => {
                        hideRaceTooltip();
                    });
                    cell.addEventListener('mousemove', (event) => {
                        showRaceTooltip(event, race);
                    });
                }
                
                dayCount++;
            }
            
            row.appendChild(cell);
        }
        
        tbody.appendChild(row);
        
        // 如果已经显示了当月所有日期，结束循环
        if (dayCount > daysInMonth) {
            break;
        }
    }
    
    calendarTable.appendChild(tbody);
    calendarContainer.appendChild(calendarTable);
}

// 渲染年视图
function renderYearView(calendarContainer) {
    // 创建日历头部
    const calendarHeader = document.createElement('div');
    calendarHeader.className = 'calendar-header';
    
    // 年份导航按钮
    const prevYearBtn = document.createElement('button');
    prevYearBtn.className = 'calendar-nav-btn';
    prevYearBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
    prevYearBtn.onclick = () => changeYear(-1);
    
    const nextYearBtn = document.createElement('button');
    nextYearBtn.className = 'calendar-nav-btn';
    nextYearBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
    nextYearBtn.onclick = () => changeYear(1);
    
    // 年份标题
    const yearTitle = document.createElement('h3');
    yearTitle.className = 'calendar-year-title';
    yearTitle.textContent = `${currentYear}年`;
    
    // 组装日历头部
    calendarHeader.appendChild(prevYearBtn);
    calendarHeader.appendChild(yearTitle);
    calendarHeader.appendChild(nextYearBtn);
    calendarContainer.appendChild(calendarHeader);
    
    // 创建年视图容器
    const yearViewContainer = document.createElement('div');
    yearViewContainer.className = 'calendar-year-view';
    
    // 生成12个月的视图
    for (let month = 0; month < 12; month++) {
        const monthContainer = document.createElement('div');
        monthContainer.className = 'calendar-month-container';
        
        // 月份标题
        const monthTitle = document.createElement('h4');
        monthTitle.className = 'calendar-month-title';
        monthTitle.textContent = `${month + 1}月`;
        monthContainer.appendChild(monthTitle);
        
        // 创建月视图表格
        const monthTable = document.createElement('table');
        monthTable.className = 'calendar-month-table';
        
        // 创建表头
        const thead = document.createElement('thead');
        const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
        const headerRow = document.createElement('tr');
        daysOfWeek.forEach(day => {
            const th = document.createElement('th');
            th.textContent = day;
            th.className = 'weekday-header';
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        monthTable.appendChild(thead);
        
        // 创建表体
        const tbody = document.createElement('tbody');
        
        // 获取当月第一天是星期几
        const firstDay = new Date(currentYear, month, 1).getDay();
        
        // 获取当月的天数
        const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
        
        // 生成日历单元格
        let dayCount = 1;
        
        for (let i = 0; i < 6; i++) {
            const row = document.createElement('tr');
            
            for (let j = 0; j < 7; j++) {
                const cell = document.createElement('td');
                
                if (i === 0 && j < firstDay) {
                    // 空白单元格
                    cell.className = 'calendar-day empty';
                } else if (dayCount > daysInMonth) {
                    // 空白单元格
                    cell.className = 'calendar-day empty';
                } else {
                    // 当月的日期
                    const currentDate = new Date(currentYear, month, dayCount);
                    // 使用本地日期字符串，避免时区问题导致的日期偏移
                    const year = currentDate.getFullYear();
                    const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
                    const day = String(currentDate.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${monthStr}-${day}`;
                    
                    cell.className = 'calendar-day';
                    cell.textContent = dayCount;
                    
                    // 检查当天是否有赛事
                const dayRaces = getRacesByDate(dateStr);
                if (dayRaces.length > 0) {
                    // 获取第一个赛事的类型
                    const raceType = dayRaces[0].category;
                    // 根据赛事类型添加相应的颜色类
                    const colorClass = raceTypeColorMap[raceType] || raceTypeColorMap['other'];
                    cell.classList.add(colorClass);
                    
                    // 根据赛事结果判断是过去还是未来赛事
                    const isPastRace = dayRaces[0].result && dayRaces[0].result !== '';
                    cell.classList.add(isPastRace ? 'race-past' : 'race-future');
                    
                    // 添加鼠标悬停事件，显示赛事提示框
                    const race = dayRaces[0];
                    cell.addEventListener('mouseenter', (event) => {
                        showRaceTooltip(event, race);
                    });
                    cell.addEventListener('mouseleave', () => {
                        hideRaceTooltip();
                    });
                    cell.addEventListener('mousemove', (event) => {
                        showRaceTooltip(event, race);
                    });
                }
                
                // 添加点击事件，切换到月视图查看详情
                const clickedDay = dayCount;
                cell.onclick = () => {
                    currentMonth = month;
                    currentView = 'month';
                    renderCalendar();
                };
                    
                    dayCount++;
                }
                
                row.appendChild(cell);
            }
            
            tbody.appendChild(row);
            
            // 如果已经显示了当月所有日期，结束循环
            if (dayCount > daysInMonth) {
                break;
            }
        }
        
        monthTable.appendChild(tbody);
        monthContainer.appendChild(monthTable);
        yearViewContainer.appendChild(monthContainer);
    }
    
    calendarContainer.appendChild(yearViewContainer);
}

// 切换年份
function changeYear(direction) {
    currentYear += direction;
    renderCalendar();
}

// 切换月份
function changeMonth(direction) {
    currentMonth += direction;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    } else if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    renderCalendar();
}

// 根据日期获取赛事
function getRacesByDate(dateStr) {
    return upcomingRaces.filter(race => race.date === dateStr);
}

// 显示赛事详情和提醒设置
function showRaceDetails(race) {
    // 创建模态框
    const modal = document.createElement('div');
    modal.className = 'race-details-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h3>${race.name}</h3>
                <button class="close-btn" onclick="closeModal()">&times;</button>
            </div>
            <div class="modal-body">
                <div class="race-detail-item">
                    <strong>日期：</strong>${race.date}
                </div>
                <div class="race-detail-item">
                    <strong>时间：</strong>${race.startTime || '待定'}
                </div>
                <div class="race-detail-item">
                    <strong>地点：</strong>${race.location}
                </div>
                <div class="race-detail-item">
                    <strong>项目：</strong>${race.event}
                </div>
                <div class="race-detail-item">
                    <strong>类型：</strong>${race.category}
                </div>
                <div class="race-detail-item">
                    <strong>成绩：</strong>${race.result || '未完成'}
                </div>
                <div class="race-detail-item">
                    <strong>地区：</strong>${race.region}
                </div>
                <div class="reminder-setting">
                    <h4>提醒设置</h4>
                    <div class="reminder-options">
                        <label>
                            <input type="checkbox" id="reminder-checkbox" ${race.reminderSet ? 'checked' : ''}>
                            设置提醒
                        </label>
                        <div class="reminder-time-setting" ${!race.reminderSet ? 'style="display: none;"' : ''}>
                            <label for="reminder-time">提醒时间：</label>
                            <select id="reminder-time">
                                <option value="15">提前15分钟</option>
                                <option value="30">提前30分钟</option>
                                <option value="60">提前1小时</option>
                                <option value="1440">提前1天</option>
                                <option value="10080">提前1周</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="save-btn" onclick="saveReminder(${race.id})">保存</button>
                <button class="cancel-btn" onclick="closeModal()">取消</button>
            </div>
        </div>
    `;
    
    // 添加到页面
    document.body.appendChild(modal);
    
    // 添加关闭模态框的事件监听
    const checkbox = modal.querySelector('#reminder-checkbox');
    const timeSetting = modal.querySelector('.reminder-time-setting');
    
    checkbox.addEventListener('change', () => {
        timeSetting.style.display = checkbox.checked ? 'block' : 'none';
    });
}

// 关闭模态框
function closeModal() {
    const modal = document.querySelector('.race-details-modal');
    if (modal) {
        modal.remove();
    }
}

// 初始化提醒功能
function initReminders() {
    // 检查浏览器是否支持通知
    if ('Notification' in window) {
        // 请求通知权限
        Notification.requestPermission();
    }
    
    // 定期检查是否有即将到来的提醒
    setInterval(checkReminders, 60000); // 每分钟检查一次
}

// 保存提醒设置
function saveReminder(raceId) {
    const checkbox = document.querySelector('#reminder-checkbox');
    const timeSelect = document.querySelector('#reminder-time');
    
    if (!checkbox || !timeSelect) {
        return;
    }
    
    const reminderSet = checkbox.checked;
    const reminderTime = parseInt(timeSelect.value);
    
    // 更新赛事的提醒设置
    const raceIndex = upcomingRaces.findIndex(race => race.id === raceId);
    if (raceIndex !== -1) {
        upcomingRaces[raceIndex].reminderSet = reminderSet;
        
        if (reminderSet) {
            // 保存到localStorage
            saveReminderToStorage(upcomingRaces[raceIndex], reminderTime);
        } else {
            // 从localStorage中删除
            removeReminderFromStorage(raceId);
        }
    }
    
    // 关闭模态框
    closeModal();
    
    // 显示保存成功提示
    showNotification('提醒设置已保存');
}

// 保存提醒到localStorage
function saveReminderToStorage(race, reminderTime) {
    let reminders = JSON.parse(localStorage.getItem('raceReminders') || '[]');
    
    // 检查是否已存在该赛事的提醒
    const existingIndex = reminders.findIndex(r => r.eventId === race.id);
    
    // 计算提醒时间
    const raceDate = new Date(race.date);
    if (race.startTime) {
        const [hours, minutes] = race.startTime.split(':').map(Number);
        raceDate.setHours(hours, minutes, 0, 0);
    }
    const reminderDate = new Date(raceDate.getTime() - reminderTime * 60 * 1000);
    
    const reminder = {
        eventId: race.id,
        eventName: race.name,
        eventDate: race.date,
        eventTime: race.startTime,
        reminderTime: reminderTime,
        reminderDate: reminderDate.toISOString(),
        isEnabled: true
    };
    
    if (existingIndex !== -1) {
        // 更新现有提醒
        reminders[existingIndex] = reminder;
    } else {
        // 添加新提醒
        reminders.push(reminder);
    }
    
    // 保存到localStorage
    localStorage.setItem('raceReminders', JSON.stringify(reminders));
}

// 从localStorage中删除提醒
function removeReminderFromStorage(raceId) {
    let reminders = JSON.parse(localStorage.getItem('raceReminders') || '[]');
    
    // 过滤掉该赛事的提醒
    reminders = reminders.filter(r => r.eventId !== raceId);
    
    // 保存到localStorage
    localStorage.setItem('raceReminders', JSON.stringify(reminders));
}

// 检查提醒
function checkReminders() {
    const reminders = JSON.parse(localStorage.getItem('raceReminders') || '[]');
    const now = new Date();
    
    reminders.forEach(reminder => {
        if (reminder.isEnabled) {
            const reminderDate = new Date(reminder.reminderDate);
            
            // 检查是否到了提醒时间（前后5分钟内）
            if (Math.abs(now.getTime() - reminderDate.getTime()) < 5 * 60 * 1000) {
                // 显示提醒
                showRaceNotification(reminder);
                
                // 标记为已提醒
                reminder.isEnabled = false;
            }
        }
    });
    
    // 保存更新后的提醒列表
    localStorage.setItem('raceReminders', JSON.stringify(reminders));
}

// 显示赛事提醒通知
function showRaceNotification(reminder) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('赛事提醒', {
            body: `${reminder.eventName}\n日期：${reminder.eventDate}\n时间：${reminder.eventTime || '待定'}`,
            icon: './images/favicon.ico'
        });
    }
}

// 渲染当前视图内的赛事列表
function renderCurrentViewRaces() {
    const calendarContainer = document.getElementById('calendar');
    if (!calendarContainer) return;
    
    // 移除已存在的赛事列表（包括单个赛事项和列表容器）
    const existingRaceItems = calendarContainer.querySelectorAll('.race-item');
    existingRaceItems.forEach(item => item.remove());
    
    const existingRaceList = calendarContainer.querySelector('.races-list');
    if (existingRaceList) {
        existingRaceList.remove();
    }
    
    // 根据当前视图类型筛选赛事
    let viewRaces = [];
    
    if (currentView === 'month') {
        // 月视图：筛选当前月份的赛事
        viewRaces = upcomingRaces.filter(race => {
            const raceDate = new Date(race.date);
            return raceDate.getFullYear() === currentYear && 
                   raceDate.getMonth() === currentMonth;
        });
    } else {
        // 年视图：筛选当前年份的赛事
        viewRaces = upcomingRaces.filter(race => {
            const raceDate = new Date(race.date);
            return raceDate.getFullYear() === currentYear;
        });
    }
    
    // 按时间顺序排序
    viewRaces.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // 如果没有赛事，不显示列表
    if (viewRaces.length === 0) {
        return;
    }
    
    // 添加赛事分隔线
    const divider = document.createElement('hr');
    divider.className = 'calendar-races-divider';
    calendarContainer.appendChild(divider);
    
    // 创建赛事列表容器，使用与年视图相同的网格布局
    const racesList = document.createElement('div');
    racesList.className = 'races-list calendar-year-view';
    
    // 添加每个赛事项到赛事列表容器中
    viewRaces.forEach(race => {
        const raceItem = document.createElement('div');
        raceItem.className = 'race-item calendar-month-container';
        
        // 判断是过去赛事还是未来赛事
        const currentDate = new Date();
        const raceDate = new Date(race.date);
        const isPastRace = raceDate < currentDate || (raceDate.toDateString() === currentDate.toDateString() && race.result && race.result !== '');
        
        // 过去赛事显示成绩，未来赛事显示起跑时间
        const displayTime = isPastRace ? (race.result || '无成绩') : (race.startTime || '待定');
        
        raceItem.innerHTML = `
            <div class="race-item-header calendar-month-title">${race.date}</div>
            <div class="race-item-content">
                <div class="race-item-name">${race.name}</div>
                <div class="race-item-time">${displayTime}</div>
                <div class="race-item-details">
                    <span class="race-item-location">${race.location}</span>
                    <span class="race-item-event">${race.event}</span>
                    <span class="race-item-category">${race.category}</span>
                </div>
            </div>
        `;
        
        // 添加点击事件，显示赛事详情和提醒设置
        raceItem.onclick = () => showRaceDetails(race);
        
        racesList.appendChild(raceItem);
    });
    
    // 将赛事列表容器添加到日历容器中
    calendarContainer.appendChild(racesList);
}

// 显示普通通知
function showNotification(message) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('通知', {
            body: message,
            icon: './images/favicon.ico'
        });
    } else {
        // 如果不支持通知，显示alert
        alert(message);
    }
}

