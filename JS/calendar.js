// 赛事日历功能实现

// 将十六进制颜色转换为rgba格式
function hexToRgba(hex, alpha = 0.3) {
   const r = parseInt(hex.slice(1, 3), 16);
   const g = parseInt(hex.slice(3, 5), 16);
   const b = parseInt(hex.slice(5, 7), 16);
   return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 赛事数据
let upcomingRaces = [];

// 判断赛事是否为待抽签状态
function isPendingLottery(race) {
   return race.status && !['finished', 'registered', 'DNS', 'DNF', '待报名'].includes(race.status);
}

function isToBeRegistered(race) {
   return race.status === '待报名';
}

// 当前显示的年份和月份
let currentYear = new Date().getFullYear();
let currentMonth = new Date().getMonth();

// 当前视图类型：'month' 或 'year'
let currentView = 'month';

let currentFilter = 'all';

// 响应式断点（参考其他页面的响应式设置）
const RESPONSIVE_BREAKPOINT = 768;

// 优化后的赛事类型配置 - 包含颜色信息，便于集中管理和扩展
const raceTypeConfig = {
   '路跑': { color: '#ff6b6b', class: 'race-road-run' },
   '越野跑': { color: '#4bc0c0', class: 'race-trail-run' },
   '场地跑': { color: '#36a2eb', class: 'race-track-run' },
   '其他': { color: '#ffcd56', class: 'race-other' }
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
               "activityLink": "",
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
               "activityLink": "",
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
               "activityLink": "",
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
               "activityLink": "https://www.strava.com/activities/example",
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
               "activityLink": "",
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
               "activityLink": "https://www.strava.com/activities/example2",
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
               "activityLink": "",
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
function showRaceTooltip(event, races) {
   const tooltip = createTooltip();
   const raceList = Array.isArray(races) ? races : [races];
   
   const currentDate = new Date();
   
   let content = '';
   raceList.forEach((race, index) => {
       if (index > 0) {
           content += '<div class="race-tooltip-divider"></div>';
       }
       
       const raceDate = new Date(race.date);
       const isPastRace = raceDate < currentDate || (raceDate.toDateString() === currentDate.toDateString() && race.result && race.result !== '');
       
       content += `
           <div class="race-tooltip-title">${race.name}</div>
           <div class="race-tooltip-item">
               <span class="race-tooltip-label">日期：</span>${race.date}
           </div>
       `;
       
       if (isToBeRegistered(race)) {
           content += `
               <div class="race-tooltip-item">
                   <span class="race-tooltip-label">状态：</span>待报名
               </div>
           `;
       } else if (isPendingLottery(race)) {
           const lotteryLabel = race.status === 'TBD' ? '待抽签（出签日期待定）' : `待抽签（${race.status}出签）`;
           content += `
               <div class="race-tooltip-item">
                   <span class="race-tooltip-label">状态：</span>${lotteryLabel}
               </div>
           `;
       } else if (isPastRace) {
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
   });
   
   tooltip.innerHTML = content;
   
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
function renderLegend(calendarContainer, viewRaces) {
   // 创建图例容器
   const legendContainer = document.createElement('div');
   legendContainer.className = 'calendar-legend';
   
   // 创建图例标题
   const legendTitle = document.createElement('span');
   legendTitle.className = 'legend-title';
   legendTitle.textContent = '赛事类型图例：';
   legendContainer.appendChild(legendTitle);
   
   // 获取当前视图中存在的赛事类型
   const existingRaceTypes = new Set(
       viewRaces.map(race => race.category)
   );
   
   // 遍历赛事类型配置，生成图例项
   Object.entries(raceTypeConfig).forEach(([type, config]) => {
       // 只显示当前视图中存在的赛事类型
       if (existingRaceTypes.has(type) || type === 'other') {
           // 创建图例项
           const legendItem = document.createElement('div');
           legendItem.className = 'legend-item';
           
           // 创建颜色方块
           const colorSquare = document.createElement('span');
           colorSquare.className = 'legend-color';
           colorSquare.style.backgroundColor = hexToRgba(config.color, 0.8);
           legendItem.appendChild(colorSquare);
           
           // 创建类型名称
           const typeName = document.createElement('span');
           typeName.className = 'legend-text';
           typeName.textContent = type;
           legendItem.appendChild(typeName);
           
           // 添加到图例容器
           legendContainer.appendChild(legendItem);
       }
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
   
   // 根据当前视图类型筛选赛事
   let viewRaces = [];
   
   if (currentView === 'month') {
       viewRaces = upcomingRaces.filter(race => {
           if (race.date === 'TBC') {
               const now = new Date();
               return currentYear === now.getFullYear() && currentMonth === now.getMonth();
           }
           const raceDate = new Date(race.date);
           return raceDate.getFullYear() === currentYear && 
                  raceDate.getMonth() === currentMonth;
       });
   } else {
       viewRaces = upcomingRaces.filter(race => {
           if (race.date === 'TBC') {
               return currentYear === new Date().getFullYear();
           }
           const raceDate = new Date(race.date);
           return raceDate.getFullYear() === currentYear;
       });
   }
   
   // 渲染图例
   renderLegend(calendarContainer, viewRaces);
   
   // 根据当前视图类型渲染不同的内容
   if (currentView === 'month') {
       renderMonthView(calendarContainer);
   } else {
       renderYearView(calendarContainer);
   }
   
   // 应用筛选
   const filteredRaces = applyFilter(viewRaces);
   
   // 渲染当前视图内的赛事列表
   renderCurrentViewRaces(filteredRaces, viewRaces);
   
   // 启动倒计时更新
   startCountdownUpdater();
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
                   const raceType = dayRaces[0].category;
                   const colorClass = raceTypeColorMap[raceType] || raceTypeColorMap['other'];
                   cell.classList.add(colorClass);
                   
                   const isPastRace = dayRaces[0].result && dayRaces[0].result !== '';
                   cell.classList.add(isPastRace ? 'race-past' : 'race-future');
                   
                   if (isPendingLottery(dayRaces[0])) {
                       cell.classList.add('race-pending-lottery');
                   }
                   
                   if (isToBeRegistered(dayRaces[0])) {
                       cell.classList.add('race-to-be-registered');
                   }
                   
                   cell.addEventListener('mouseenter', (event) => {
                       showRaceTooltip(event, dayRaces);
                   });
                   cell.addEventListener('mouseleave', () => {
                       hideRaceTooltip();
                   });
                   cell.addEventListener('mousemove', (event) => {
                       showRaceTooltip(event, dayRaces);
                   });
               }
               
               dayCount++;
           }
           
           row.appendChild(cell);
       }
       
       tbody.appendChild(row);
       
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
                       const raceType = dayRaces[0].category;
                       const colorClass = raceTypeColorMap[raceType] || raceTypeColorMap['other'];
                       cell.classList.add(colorClass);
                       
                       const isPastRace = dayRaces[0].result && dayRaces[0].result !== '';
                       cell.classList.add(isPastRace ? 'race-past' : 'race-future');
                       
                       if (isPendingLottery(dayRaces[0])) {
                           cell.classList.add('race-pending-lottery');
                       }
                       
                       if (isToBeRegistered(dayRaces[0])) {
                           cell.classList.add('race-to-be-registered');
                       }
                       
                       cell.addEventListener('mouseenter', (event) => {
                           showRaceTooltip(event, dayRaces);
                       });
                       cell.addEventListener('mouseleave', () => {
                           hideRaceTooltip();
                       });
                       cell.addEventListener('mousemove', (event) => {
                           showRaceTooltip(event, dayRaces);
                       });
                   }
                   
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

function applyFilter(races) {
   if (currentFilter === 'all') return races;
   if (currentFilter === 'finished') return races.filter(race => race.status === 'finished');
   if (currentFilter === 'unfinished') return races.filter(race => race.status !== 'finished');
   return races;
}

function isRaceFinished(race) {
   return race.status === 'finished';
 }

function updateCalendarDimmedDates(filteredRaces, allViewRaces) {
   const allDayCells = document.querySelectorAll('.calendar-day:not(.empty)');
   
   if (currentFilter === 'all') {
       allDayCells.forEach(cell => cell.classList.remove('race-dimmed'));
       return;
   }
   
   const filteredDates = new Set(filteredRaces.map(r => r.date));
   const allRaceDates = new Set(allViewRaces.map(r => r.date));
   
   allDayCells.forEach(cell => {
       const cellDate = getCellDate(cell);
       if (!cellDate) return;
       
       if (allRaceDates.has(cellDate) && !filteredDates.has(cellDate)) {
           cell.classList.add('race-dimmed');
       } else {
           cell.classList.remove('race-dimmed');
       }
   });
}

function getCellDate(cell) {
   const table = cell.closest('table');
   if (!table) return null;
   
   const monthContainer = table.closest('.calendar-month-container');
   let year = currentYear;
   let month = currentMonth;
   
   if (monthContainer) {
       const titleEl = monthContainer.querySelector('.calendar-month-title');
       if (titleEl) {
           const fullText = titleEl.textContent.trim();
           const yearMatch = fullText.match(/(\d{4})年/);
           const monthMatch = fullText.match(/(\d{1,2})月/);
           if (yearMatch) year = parseInt(yearMatch[1]);
           if (monthMatch) month = parseInt(monthMatch[1]) - 1;
       }
   }
   
   const day = parseInt(cell.textContent);
   if (isNaN(day)) return null;
   
   const monthStr = String(month + 1).padStart(2, '0');
   const dayStr = String(day).padStart(2, '0');
   return `${year}-${monthStr}-${dayStr}`;
}



// 渲染当前视图内的赛事列表
function renderCurrentViewRaces(viewRaces, allViewRaces) {
    const calendarContainer = document.getElementById('calendar');
    if (!calendarContainer) return;
    
    const existingRaceItems = calendarContainer.querySelectorAll('.race-item, .upcoming-race-card');
    existingRaceItems.forEach(item => item.remove());
    
    const existingRaceList = calendarContainer.querySelector('.races-list, .upcoming-races-list');
    if (existingRaceList) {
        existingRaceList.remove();
    }
    
    const existingPendingSection = calendarContainer.querySelector('.pending-lottery-section');
    if (existingPendingSection) {
        existingPendingSection.remove();
    }
    
    const existingDivider = calendarContainer.querySelector('.calendar-races-divider');
    if (existingDivider) {
        existingDivider.remove();
    }
    
    const existingFilterBar = calendarContainer.querySelector('.race-filter-bar');
    if (existingFilterBar) {
        existingFilterBar.remove();
    }
    
    const filterBar = document.createElement('div');
    filterBar.className = 'race-filter-bar';
    
    const filterToggle = document.createElement('button');
    filterToggle.className = 'race-filter-toggle';
    filterToggle.innerHTML = `<span class="filter-icon">⚙</span> 筛选`;
    filterBar.appendChild(filterToggle);
    
    const filterOptions = document.createElement('div');
    filterOptions.className = 'race-filter-options collapsed';
    
    const filters = [
        { key: 'all', label: '全部赛事' },
        { key: 'finished', label: '已参赛赛事' },
        { key: 'unfinished', label: '未参赛赛事' }
    ];
    
    filters.forEach(f => {
        const btn = document.createElement('button');
        btn.className = 'race-filter-btn' + (currentFilter === f.key ? ' active' : '');
        btn.textContent = f.label;
        btn.addEventListener('click', () => {
            currentFilter = f.key;
            renderCalendar();
        });
        filterOptions.appendChild(btn);
    });
    
    filterBar.appendChild(filterOptions);
    
    filterToggle.addEventListener('click', () => {
        filterOptions.classList.toggle('collapsed');
        filterToggle.classList.toggle('expanded');
    });
    
    calendarContainer.appendChild(filterBar);
    
    updateCalendarDimmedDates(viewRaces, allViewRaces);
    
    viewRaces.sort((a, b) => {
        const dateA = a.date === 'TBC' ? Infinity : new Date(a.date).getTime();
        const dateB = b.date === 'TBC' ? Infinity : new Date(b.date).getTime();
        return dateA - dateB;
    });
    
    if (viewRaces.length === 0) {
        return;
    }
    
    const divider = document.createElement('hr');
    divider.className = 'calendar-races-divider';
    calendarContainer.appendChild(divider);
    
    const racesList = document.createElement('div');
    racesList.className = 'upcoming-races-list';
    
    viewRaces.forEach(race => {
        const raceItem = createRaceItemElement(race, isPendingLottery(race));
        racesList.appendChild(raceItem);
    });
    
    calendarContainer.appendChild(racesList);
}

// 创建赛事项DOM元素
function createRaceItemElement(race, isPendingLottery = false) {
    const raceItem = document.createElement('div');
    raceItem.className = 'upcoming-race-card' + (isPendingLottery ? ' pending-lottery-item' : '');
    
    const isTBC = race.date === 'TBC';
    const currentDate = new Date();
    const raceDate = isTBC ? null : new Date(race.date);
    const isPastRace = !isTBC && (raceDate < currentDate || (raceDate.toDateString() === currentDate.toDateString() && race.result && race.result !== ''));
    
    let statusBadge = '';
    if (isToBeRegistered(race)) {
        statusBadge = '<span class="status-badge to-be-registered">待报名</span>';
    } else if (isPendingLottery) {
        if (race.status === 'TBD') {
            statusBadge = '<span class="status-badge tbd">待抽签</span>';
        } else {
            statusBadge = `<span class="status-badge pending">待抽签 (${race.status})</span>`;
        }
    } else if (race.status === 'registered') {
        statusBadge = '<span class="status-badge registered">已报名</span>';
    } else if (isPastRace) {
        statusBadge = '<span class="status-badge finished">已完赛</span>';
    }
    
    let countdownHTML = '';
    if (isTBC) {
        countdownHTML = `
            <div class="upcoming-race-countdown">
                <span class="countdown-label">距开赛还剩：</span>
                <span class="countdown-timer">∞</span>
            </div>
        `;
    } else if (isPastRace) {
        countdownHTML = `
            <div class="upcoming-race-countdown">
                <span class="countdown-label">成绩：</span>
                <span class="countdown-timer finished">${race.result || '无成绩'}</span>
            </div>
        `;
    } else {
        const now = Date.now();
        const [hours, minutes] = (race.startTime || '07:30').split(':').map(Number);
        const [year, month, day] = race.date.split('-').map(Number);
        const startTime = new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();
        const remaining = startTime - now;
        
        countdownHTML = `
            <div class="upcoming-race-countdown">
                <span class="countdown-label">距开赛还剩：</span>
                <span class="countdown-timer" data-race-id="${race.id}">${formatCountdown(remaining)}</span>
            </div>
        `;
    }
    
    const displayDate = isTBC ? '待定' : race.date;
    const displayTime = isTBC ? '' : (race.startTime || '');
    const displayLocation = race.location === 'TBC' ? '待定' : race.location;
    
    raceItem.innerHTML = `
        <div class="upcoming-race-card-content">
            <div class="upcoming-race-header">
                <h3 class="upcoming-race-title">${race.name}</h3>
                ${statusBadge}
            </div>
            <div class="upcoming-race-meta">
                <span class="upcoming-race-date">📅 ${displayDate} ${displayTime}</span>
                <span class="upcoming-race-location">📍 ${displayLocation}</span>
            </div>
            <div class="upcoming-race-details">
                <span class="upcoming-race-category">${race.category}</span>
                <span class="upcoming-race-event">${race.event}</span>
                <span class="upcoming-race-distance">${race.distance}</span>
            </div>
        </div>
        ${countdownHTML}
    `;
    
    raceItem.onclick = null;
    
    return raceItem;
}

// 格式化倒计时
function formatCountdown(ms) {
    if (ms <= 0) return '赛事进行中或已结束';
    
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    return `${days}天 ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// 倒计时更新器
let countdownInterval = null;

// 更新倒计时显示
function updateCountdowns() {
    const countdownElements = document.querySelectorAll('.countdown-timer');
    
    countdownElements.forEach(el => {
        const raceId = parseInt(el.dataset.raceId);
        if (isNaN(raceId)) return;
        
        const race = upcomingRaces.find(r => r.id === raceId);
        if (!race) return;
        
        const now = Date.now();
        const [hours, minutes] = (race.startTime || '07:30').split(':').map(Number);
        const [year, month, day] = race.date.split('-').map(Number);
        const startTime = new Date(year, month - 1, day, hours, minutes, 0, 0).getTime();
        const remaining = startTime - now;
        
        el.textContent = formatCountdown(remaining);
        
        // 根据剩余时间改变颜色
        if (remaining <= 0) {
            el.style.color = '#e74c3c';
        } else if (remaining < 24 * 60 * 60 * 1000) {
            el.style.color = '#f39c12';
        } else {
            el.style.color = '#27ae60';
        }
    });
}

// 启动倒计时更新
function startCountdownUpdater() {
    if (countdownInterval) clearInterval(countdownInterval);
    countdownInterval = setInterval(updateCountdowns, 1000);
}

function stopCountdownUpdater() {
    if (countdownInterval) {
        clearInterval(countdownInterval);
        countdownInterval = null;
    }
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopCountdownUpdater();
    } else {
        startCountdownUpdater();
    }
});

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

