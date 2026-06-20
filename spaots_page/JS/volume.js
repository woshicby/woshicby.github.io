// ============ 运动量统计页面专用代码 ============

let currentSummaryYear = 'Total'; // 统计页面当前年份

function renderVolumePage() {
  var container = document.getElementById('volumeContent');
  if (!container) return;
  container.innerHTML = '';
  var interval = 'month';
  var sportType = 'all';
  var intervalSelect = document.getElementById('intervalFilter');
  var sportSelect = document.getElementById('sportTypeFilter');
  if (intervalSelect) interval = intervalSelect.value;
  if (sportSelect) sportType = sportSelect.value;

  if (interval === 'day') {
    renderActivityCards(container, sportType);
  } else {
    renderVolumeCards(container, interval, sportType);
  }
}

function filterBySportType(list, sportType) {
  if (sportType === 'all') return list;
  return list.filter(function(a) { return a.type === sportType; });
}

function groupActivities(interval, sportType) {
  var filtered = filterBySportType(activities, sportType);
  var groups = {};

  filtered.forEach(function(a) {
    var dateStr = a.start_date_local || '';
    var key = '';
    if (interval === 'year') {
      key = dateStr.substring(0, 4);
    } else if (interval === 'month') {
      key = dateStr.substring(0, 7);
    } else if (interval === 'week') {
      var d = new Date(dateStr);
      var oneJan = new Date(d.getFullYear(), 0, 1);
      var weekNum = Math.ceil(((d - oneJan) / 86400000 + oneJan.getDay() + 1) / 7);
      key = d.getFullYear() + '-W' + (weekNum < 10 ? '0' : '') + weekNum;
    }
    if (!key) return;
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  });

  return groups;
}

function renderVolumeCards(container, interval, sportType) {
  var groups = groupActivities(interval, sportType);
  var keys = Object.keys(groups).sort().reverse();

  // 年份筛选
  if (currentSummaryYear !== 'Total') {
    var yearStr = String(currentSummaryYear);
    if (interval === 'year') {
      keys = keys.filter(function(k) { return k === yearStr; });
    } else {
      keys = keys.filter(function(k) { return k.startsWith(yearStr); });
    }
  }

  // 卡片网格容器
  var grid = document.createElement('div');
  grid.className = 'volume-grid';

  keys.forEach(function(key) {
    var acts = groups[key];
    var totalDist = acts.reduce(function(s, a) { return s + (a.distance || 0); }, 0);
    var totalTime = acts.reduce(function(s, a) { return s + convertTimeToSeconds(a.moving_time || '0:0:0'); }, 0);
    var totalElev = acts.reduce(function(s, a) { return s + (Math.min(a.elevation_gain || 0, 20000)); }, 0);
    var maxDist = 0;
    acts.forEach(function(a) { if ((a.distance || 0) > maxDist) maxDist = a.distance; });

    var avgPace = '--';
    if (totalDist > 0 && totalTime > 0) {
      var pm = (totalTime / 60) / (totalDist / 1000);
      var m = Math.floor(pm);
      var s = Math.round((pm - m) * 60);
      avgPace = m + "'" + (s < 10 ? '0' : '') + s + '"';
    }

    var hrSum = 0, hrCount = 0;
    acts.forEach(function(a) {
      if (a.average_heartrate && a.average_heartrate > 0) { hrSum += a.average_heartrate; hrCount++; }
    });
    var avgHR = hrCount > 0 ? Math.round(hrSum / hrCount) : null;

    // 计算柱状图数据
    var chartData = computeChartData(acts, interval);

    var card = document.createElement('div');
    card.className = 'volume-card' + (interval === 'year' ? ' vc-year' : '');
    var html = '<div class="vc-header">' + key + '</div>';
    html += '<div class="vc-stats">';
    html += '<div class="vc-stat"><span class="vc-label">总距离</span><span class="vc-val">' + formatDistance(totalDist) + '</span><span class="vc-unit">公里</span></div>';
    html += '<div class="vc-stat"><span class="vc-label">次数</span><span class="vc-val">' + acts.length + '</span><span class="vc-unit">次</span></div>';
    html += '<div class="vc-stat"><span class="vc-label">平均配速</span><span class="vc-val">' + avgPace + '</span><span class="vc-unit"></span></div>';
    html += '<div class="vc-stat"><span class="vc-label">总时长</span><span class="vc-val">' + formatDuration(totalTime) + '</span><span class="vc-unit"></span></div>';
    if (totalElev > 0) html += '<div class="vc-stat"><span class="vc-label">爬升</span><span class="vc-val">' + totalElev.toFixed(0) + '</span><span class="vc-unit">米</span></div>';
    if (avgHR) html += '<div class="vc-stat"><span class="vc-label">心率</span><span class="vc-val">' + avgHR + '</span><span class="vc-unit">次/分</span></div>';
    html += '<div class="vc-stat"><span class="vc-label">最长</span><span class="vc-val">' + formatDistance(maxDist) + '</span><span class="vc-unit">公里</span></div>';
    html += '</div>';

    // 柱状图
    if (chartData.length > 0) {
      html += renderBarChart(chartData, interval);
    }

    card.innerHTML = html;
    grid.appendChild(card);

    // 年份间隔时，追加年度总结
    if (interval === 'year') {
      var yearNum = parseInt(key);
      if (!isNaN(yearNum)) {
        var summaryDiv = document.createElement('div');
        summaryDiv.className = 'volume-year-summary';
        renderYearSummary(summaryDiv, yearNum, acts);
        grid.appendChild(summaryDiv);
      }
    }
  });

  container.appendChild(grid);
}

function computeChartData(acts, interval) {
  var buckets = {};
  acts.forEach(function(a) {
    var dateStr = a.start_date_local || '';
    var idx = 0;
    if (interval === 'year') {
      idx = parseInt(dateStr.substring(5, 7), 10) - 1; // 0-11
    } else if (interval === 'month') {
      idx = parseInt(dateStr.substring(8, 10), 10) - 1; // 0-30
    } else if (interval === 'week') {
      var d = new Date(dateStr);
      idx = d.getDay(); // 0-6
    }
    if (isNaN(idx)) return;
    if (!buckets[idx]) buckets[idx] = 0;
    buckets[idx] += (a.distance || 0) / 1000;
  });

  var data = [];
  var labels = [];
  if (interval === 'year') {
    for (var i = 0; i < 12; i++) {
      data.push(buckets[i] || 0);
      labels.push((i + 1) + '');
    }
  } else if (interval === 'month') {
    var days = 31;
    for (var i = 0; i < days; i++) {
      data.push(buckets[i] || 0);
      labels.push((i + 1) + '');
    }
  } else if (interval === 'week') {
    var dayNames = ['日', '一', '二', '三', '四', '五', '六'];
    for (var i = 0; i < 7; i++) {
      data.push(buckets[i] || 0);
      labels.push(dayNames[i]);
    }
  }

  return data.map(function(v, i) { return { label: labels[i], value: v }; });
}

function renderBarChart(chartData, interval) {
  var maxVal = 0;
  chartData.forEach(function(d) { if (d.value > maxVal) maxVal = d.value; });
  if (maxVal === 0) return '';

  var barCount = chartData.length;

  // Y轴刻度
  var yMax = Math.ceil(maxVal / 5) * 5;
  if (yMax === 0) yMax = 5;
  var yTicks = [];
  for (var t = 0; t <= yMax; t += Math.max(5, Math.ceil(yMax / 4))) {
    yTicks.push(t);
  }

  // X轴单位
  var xUnit = '';
  if (interval === 'year') xUnit = '月';
  else if (interval === 'month') xUnit = '日';
  else if (interval === 'week') xUnit = '周';

  // 单一 CSS Grid：第1列Y轴，第2~N+1列柱子
  var html = '<div class="vc-chart" style="--bar-count:' + barCount + '">';
  html += '<div class="vc-chart-corner"></div>';
  html += '<span class="vc-axis-label vc-axis-label-y">公里</span>';

  // 柱子（每根占一列，从第2列开始）
  chartData.forEach(function(d, i) {
    var pct = yMax > 0 ? (d.value / yMax * 100).toFixed(1) : 0;
    html += '<div class="vc-bar" style="grid-column:' + (i + 2) + ';height:' + pct + '%" title="' + d.label + ': ' + d.value.toFixed(1) + ' 公里"></div>';
  });

  // Y轴刻度 + 网格线（覆盖在柱子区域上）
  html += '<div class="vc-overlay">';
  yTicks.forEach(function(tick) {
    var pct = (tick / yMax * 100).toFixed(1);
    html += '<span class="vc-tick-label" style="bottom:' + pct + '%">' + tick + '</span>';
    html += '<div class="vc-grid-line" style="bottom:' + pct + '%"></div>';
  });
  html += '</div>';

  // X轴标签（每根柱子下方）
  chartData.forEach(function(d, i) {
    var showLabel = barCount <= 12 || i % Math.ceil(barCount / 12) === 0;
    html += '<span class="vc-bar-label' + (showLabel ? '' : ' vc-bar-label-hidden') + '" style="grid-column:' + (i + 2) + '">' + d.label + '</span>';
  });

  // X轴单位（右下角）
  html += '<span class="vc-axis-label vc-axis-label-x">' + xUnit + '</span>';

  html += '</div>';
  return html;
}

function renderActivityCards(container, sportType) {
  var filtered = filterBySportType(activities, sportType);
  if (currentSummaryYear !== 'Total') {
    filtered = filtered.filter(function(a) { return filterYearRuns(a, currentSummaryYear); });
  }
  filtered.sort(sortDateFunc);

  // 卡片网格容器
  var grid = document.createElement('div');
  grid.className = 'volume-grid';

  // 按日分组
  var groups = {};
  filtered.forEach(function(a) {
    var key = a.start_date_local ? a.start_date_local.substring(0, 10) : 'unknown';
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  });

  var keys = Object.keys(groups).sort().reverse();
  keys.forEach(function(key) {
    var acts = groups[key];
    var card = document.createElement('div');
    card.className = 'volume-card vc-day';

    var html = '<div class="vc-header">' + key + '</div>';
    html += '<div class="vc-activities">';
    acts.forEach(function(a) {
      var pace = formatPace(a.distance, convertTimeToSeconds(a.moving_time || '0:0:0'));
      var dur = formatDuration(convertTimeToSeconds(a.moving_time || '0:0:0'));
      var type = typeDisplay(a.type || 'Run');
      var name = a.name || '';

      html += '<div class="vc-activity-row">';
      html += '<a href="activity.html?id=' + a.run_id + '" class="vc-row-link">';
      html += '<span class="vc-type">' + type + '</span>';
      html += '<span class="vc-name">' + name + '</span>';
      html += '<span class="vc-dist">' + formatDistance(a.distance) + ' 公里</span>';
      html += '<span class="vc-pace">' + pace + '</span>';
      html += '<span class="vc-dur">' + dur + '</span>';
      html += '</a>';
      html += '</div>';
    });
    html += '</div>';
    card.innerHTML = html;
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

function renderYearSummary(container, year, optTracks) {
  var colors = getThemeColors();
  var yearTracks = optTracks || activities.filter(function(a){ return extractYear(a.start_date_local) === String(year); });
  if (!yearTracks.length) return;

  // 统计
  var totalRuns = yearTracks.length;
  var totalDistM = yearTracks.reduce(function(s,a){ return s + (a.distance||0); }, 0);
  var totalDistKm = totalDistM / 1000;
  var totalTimeS = yearTracks.reduce(function(s,a){ return s + convertTimeToSeconds(a.moving_time); }, 0);
  var totalHours = Math.floor(totalTimeS / 3600);
  var longestKm = Math.max.apply(null, yearTracks.map(function(a){ return (a.distance||0)/1000; }));

  // 配速
  var avgPace = "0'00\"";
  if (totalDistM > 0 && totalTimeS > 0) {
    var paceS = totalTimeS / totalDistKm;
    avgPace = Math.floor(paceS/60) + "'" + ("0" + Math.floor(paceS%60)).slice(-2) + '"';
  }

  // 连续天数
  var dateSet = [];
  yearTracks.forEach(function(a) { var d = a.start_date_local.substring(0,10); if (dateSet.indexOf(d)===-1) dateSet.push(d); });
  dateSet.sort();
  var maxStreak = 1, curStreak = 1;
  for (var i = 1; i < dateSet.length; i++) {
    var d1 = new Date(dateSet[i-1]), d2 = new Date(dateSet[i]);
    if ((d2-d1)/(1000*60*60*24) === 1) { curStreak++; maxStreak = Math.max(maxStreak, curStreak); }
    else curStreak = 1;
  }

  // 赛事统计
  var marathonCount = yearTracks.filter(function(a){ return (a.distance||0) >= 42000; }).length;
  var halfCount = yearTracks.filter(function(a){ var d=(a.distance||0); return d>=21000 && d<42000; }).length;
  var tenKCount = yearTracks.filter(function(a){ var d=(a.distance||0); return d>=10000 && d<21000; }).length;

  // 按月按日聚合
  var monthData = {};
  for (var m = 1; m <= 12; m++) { monthData[m] = {}; }
  yearTracks.forEach(function(a) {
    var parts = a.start_date_local.substring(0,10).split('-');
    var mm = parseInt(parts[1]), dd = parseInt(parts[2]);
    monthData[mm][dd] = (monthData[mm][dd] || 0) + (a.distance || 0) / 1000;
  });

  // 渲染
  var html = '<div class="year-summary">';
  html += '<div class="ys-left">';
  html += '<div class="ys-header">累计 ' + totalRuns + ' 次运动</div>';
  html += '<div class="ys-section-title">里程碑</div>';
  html += '<div class="ys-races">';

  var raceNum = 1;
  if (marathonCount > 0) { html += '<div class="ys-race"><span class="ys-race-num">' + (raceNum++) + '</span><span class="ys-race-name">全马</span><span class="ys-race-count">' + marathonCount + '次</span></div>'; }
  if (halfCount > 0) { html += '<div class="ys-race"><span class="ys-race-num">' + (raceNum++) + '</span><span class="ys-race-name">半马</span><span class="ys-race-count">' + halfCount + '次</span></div>'; }
  if (tenKCount > 0) { html += '<div class="ys-race"><span class="ys-race-num">' + (raceNum++) + '</span><span class="ys-race-name">10K</span><span class="ys-race-count">' + tenKCount + '次</span></div>'; }

  html += '</div>';

  html += '<div class="ys-section-title">统计</div>';
  html += '<div class="ys-stats-grid">';
  html += ysStatItem('距离', Math.round(totalDistKm) + '', '公里');
  html += ysStatItem('次数', totalRuns + '', '');
  html += ysStatItem('平均配速', avgPace, '');
  html += ysStatItem('连续', maxStreak + '', '天');
  html += ysStatItem('时长', totalHours + '', '小时');
  html += ysStatItem('最长', longestKm.toFixed(1), '公里');
  html += '</div>';
  html += '<div class="ys-footer">运动主页/' + year + '</div>';
  html += '</div>'; // ys-left

  // 月度点阵 - 每月一行
  html += '<div class="ys-right">';
  html += '<div class="ys-month-rows">';
  var monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
  for (var mm = 1; mm <= 12; mm++) {
    html += '<div class="ys-month-row">';
    html += '<div class="ys-month-label">' + monthNames[mm-1] + '</div>';
    html += '<div class="ys-month-dots">';
    var daysInMonth = new Date(year, mm, 0).getDate();
    for (var dd = 1; dd <= daysInMonth; dd++) {
      var dist = monthData[mm][dd] || 0;
      var dotClass = 'ys-dot';
      var dotStyle = '';
      if (dist > 0) {
        if (dist >= 20) { dotClass += ' ys-dot-special2'; }
        else if (dist >= 10) { dotClass += ' ys-dot-special'; }
        else {
          var intensity = Math.min(dist / 10, 1);
          dotClass += ' ys-dot-active';
          dotStyle = ' style="opacity:' + (0.3 + intensity * 0.7) + '"';
        }
      } else {
        dotClass += ' ys-dot-empty';
      }
      html += '<div class="' + dotClass + '"' + dotStyle + ' data-date="' + year + '-' + ("0"+mm).slice(-2) + '-' + ("0"+dd).slice(-2) + '"></div>';
    }
    html += '</div>'; // ys-month-dots
    html += '</div>'; // ys-month-row
  }
  html += '</div>'; // ys-month-rows
  html += '</div>'; // ys-right
  html += '</div>'; // year-summary

  var wrapper = document.createElement('div');
  wrapper.className = 'summary-svg-wrapper';
  wrapper.innerHTML = html;
  container.appendChild(wrapper);

  // 为年度总结点添加悬停事件
  wrapper.querySelectorAll('.ys-dot[data-date]').forEach(function(dot) {
    dot.addEventListener('mouseenter', function(e) { showTooltip(e.target, dot.getAttribute('data-date')); });
    dot.addEventListener('mouseleave', function() { hideTooltip(); });
  });
}

function ysStatItem(label, value, unit) {
  return '<div class="ys-stat"><div class="ys-stat-label">' + label + '</div><div class="ys-stat-value">' + value + (unit ? '<span class="ys-stat-unit">' + unit + '</span>' : '') + '</div></div>';
}

function initVolumePage() {
  // 填充运动类型筛选器
  var sportSelect = document.getElementById('sportTypeFilter');
  if (sportSelect) {
    getSportTypes().forEach(function(t) {
      var opt = document.createElement('option');
      opt.value = t;
      opt.textContent = typeDisplay(t);
      sportSelect.appendChild(opt);
    });
    sportSelect.addEventListener('change', function() { renderVolumePage(); });
  }

  // 绑定时间间隔筛选器
  var intervalSelect = document.getElementById('intervalFilter');
  if (intervalSelect) {
    intervalSelect.addEventListener('change', function() { renderVolumePage(); });
  }
  renderVolumePage();
}
