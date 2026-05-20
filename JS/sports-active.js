// ============ 活跃统计图页面专用代码 ============

function renderActivePage() {
  var container = document.getElementById('activeContent');
  if (!container) return;
  container.innerHTML = '';
  var sportType = 'all';
  var sportSelect = document.getElementById('sportTypeFilter');
  if (sportSelect) sportType = sportSelect.value;

  // 根据运动类型筛选
  var filtered = sportType === 'all' ? activities : activities.filter(function(a) { return a.type === sportType; });

  renderGithubHeatmapForActivities(container, null, filtered);
}

function interpolateHex(c1, c2, ratio) {
  ratio = Math.max(0, Math.min(1, ratio));
  function hex2rgb(h) { h = h.replace('#',''); return [parseInt(h.substr(0,2),16), parseInt(h.substr(2,2),16), parseInt(h.substr(4,2),16)]; }
  function rgb2hex(r,g,b) { return '#' + [r,g,b].map(function(v){ return Math.round(Math.max(0,Math.min(255,v))).toString(16).padStart(2,'0'); }).join(''); }
  var a = hex2rgb(c1), b = hex2rgb(c2);
  return rgb2hex(a[0]+(b[0]-a[0])*ratio, a[1]+(b[1]-a[1])*ratio, a[2]+(b[2]-a[2])*ratio);
}

// ============ GitHub 热力图 ============

function renderGithubHeatmapForActivities(container, year, optActivities) {
  var colors = getThemeColors();
  var source = optActivities || activities;
  var filtered = year ? source.filter(function(a){ return extractYear(a.start_date_local) === String(year); }) : source;

  // 按日期聚合运动时间（秒）
  var timeByDate = {};
  filtered.forEach(function(a) {
    var d = a.start_date_local.substring(0, 10);
    var sec = convertTimeToSeconds(a.moving_time) || convertTimeToSeconds(a.elapsed_time) || 0;
    timeByDate[d] = (timeByDate[d] || 0) + sec;
  });

  // 按年聚合总运动时间
  var timeByYear = {};
  filtered.forEach(function(a) {
    var y = extractYear(a.start_date_local);
    var sec = convertTimeToSeconds(a.moving_time) || convertTimeToSeconds(a.elapsed_time) || 0;
    timeByYear[y] = (timeByYear[y] || 0) + sec;
  });

  // 时间范围
  var times = Object.values(timeByDate);
  var minTime = times.length ? Math.min.apply(null, times) : 0;
  var maxTime = times.length ? Math.max.apply(null, times) : 0;

  var years = year ? [parseInt(year)] : getYearsList();
  years.sort(function(a,b){ return b-a; });

  // 创建卡片网格
  var grid = document.createElement('div');
  grid.className = 'active-grid';

  years.forEach(function(yr) {
    var yearTime = timeByYear[yr] || 0;
    var yearHours = yearTime / 3600;

    var card = document.createElement('div');
    card.className = 'active-card';

    // 卡片头部
    var header = document.createElement('div');
    header.className = 'active-card-header';
    header.innerHTML = '<span class="active-card-year">' + yr + '</span><span class="active-card-hours">' + yearHours.toFixed(1) + ' 小时</span>';
    card.appendChild(header);

    // 热力图 - 按月分组的流式网格
    var heatmap = document.createElement('div');
    heatmap.className = 'active-heatmap';

    var monthNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
    var currentDay = new Date(yr, 0, 1);
    var currentMonth = -1;

    while (currentDay.getFullYear() === yr) {
      var month = currentDay.getMonth();

      // 每月开始时插入月份标题
      if (month !== currentMonth) {
        var monthHeader = document.createElement('div');
        monthHeader.className = 'heatmap-month-header';
        monthHeader.textContent = monthNames[month];
        heatmap.appendChild(monthHeader);
        currentMonth = month;
      }

      var dateStr = formatDate(currentDay);
      var timeSec = timeByDate[dateStr] || 0;
      var timeMin = timeSec / 60;

      var color = colors.empty;
      if (timeSec > 0) {
        var ratio = maxTime > minTime ? (timeSec - minTime) / (maxTime - minTime) : 0;
        if (timeMin >= 120) {
          color = colors.special2;
        } else if (timeMin >= 60) {
          color = colors.special;
        } else {
          if (ratio < 0.25) color = interpolateHex(colors.empty, colors.track, 0.4);
          else if (ratio < 0.5) color = interpolateHex(colors.empty, colors.track, 0.65);
          else if (ratio < 0.75) color = interpolateHex(colors.empty, colors.track, 0.85);
          else color = colors.track;
        }
      }

      var cell = document.createElement('div');
      cell.className = 'heatmap-cell' + (timeSec === 0 ? ' heatmap-cell-empty' : '');
      cell.style.backgroundColor = color;
      cell.setAttribute('data-date', dateStr);
      cell.title = dateStr + (timeSec > 0 ? ' - ' + (timeMin).toFixed(0) + ' 分钟' : '');

      cell.addEventListener('mouseenter', function(e) { showTooltip(e.target, e.target.getAttribute('data-date')); });
      cell.addEventListener('mouseleave', function() { hideTooltip(); });

      heatmap.appendChild(cell);

      currentDay.setDate(currentDay.getDate() + 1);
    }

    card.appendChild(heatmap);
    grid.appendChild(card);
  });

  container.appendChild(grid);
}

// ============ Grid 路线缩略图 ============

function renderGridTracks(container, year) {
  var colors = getThemeColors();
  var filtered = year ? activities.filter(function(a){ return extractYear(a.start_date_local) === String(year); }) : activities;

  var tracks = [];
  filtered.forEach(function(a) {
    if (a.summary_polyline) {
      var coords = decodePolyline(a.summary_polyline);
      if (coords.length >= 2) tracks.push({ activity: a, coords: coords });
    }
  });

  if (tracks.length === 0) return;

  // 使用 Canvas 渲染路线缩略图
  var canvasWidth = 800;
  var canvasHeight = 1200;
  var count = tracks.length;

  var bestSize = null, bestCounts = null, minWaste = -1;
  for (var cx = 1; cx <= count; cx++) {
    var sx = canvasWidth / cx;
    for (var cy = 1; cy <= count; cy++) {
      if (cx * cy >= count) {
        var sy = canvasHeight / cy;
        var size = Math.min(sx, sy);
        var waste = canvasWidth * canvasHeight - count * size * size;
        if (waste < 0) continue;
        if (bestSize === null || waste < minWaste) {
          bestSize = size; bestCounts = [cx, cy]; minWaste = waste;
        }
      }
    }
  }
  if (!bestSize) return;

  var countX = bestCounts[0], countY = bestCounts[1];
  var cellSize = bestSize * 0.85;
  var spacingX = countX <= 1 ? 0 : (canvasWidth - bestSize * countX) / (countX - 1);
  var spacingY = countY <= 1 ? 0 : (canvasHeight - bestSize * countY) / (countY - 1);

  var distances = tracks.map(function(t){ return t.activity.distance || 0; });
  var minDist = Math.min.apply(null, distances);
  var maxDist = Math.max.apply(null, distances);

  var canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  canvas.className = 'grid-tracks-canvas';
  var ctx = canvas.getContext('2d');

  // 背景
  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  tracks.slice().reverse().forEach(function(t, index) {
    var a = t.activity, coords = t.coords;
    var px = (index % countX) * (bestSize + spacingX);
    var py = Math.floor(index / countX) * (bestSize + spacingY);
    var ox = px + bestSize * 0.075;
    var oy = py + bestSize * 0.075;
    var drawSize = cellSize;

    var length = a.distance || 0;
    var distKm = length / 1000;
    var ratio = maxDist > minDist ? (length - minDist) / (maxDist - minDist) : 0;
    var color;
    if (distKm >= 20) color = colors.special2;
    else if (distKm >= 10) color = colors.special;
    else color = colors.track;

    var lats = coords.map(function(c){ return c[0]; });
    var lngs = coords.map(function(c){ return c[1]; });
    var minLat = Math.min.apply(null, lats), maxLat = Math.max.apply(null, lats);
    var minLng = Math.min.apply(null, lngs), maxLng = Math.max.apply(null, lngs);
    var dLat = maxLat - minLat || 1;
    var dLng = maxLng - minLng || 1;

    var isIndoor = a.subtype === 'indoor' || a.subtype === 'treadmill';
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = isIndoor ? 0.8 : 1.2;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalAlpha = isIndoor ? 0.5 : 0.9;
    if (isIndoor) ctx.setLineDash([2, 1]);
    else ctx.setLineDash([]);

    coords.forEach(function(c, ci) {
      var x = ox + (c[1] - minLng) / dLng * drawSize * 0.9 + drawSize * 0.05;
      var y = oy + drawSize - (c[0] - minLat) / dLat * drawSize * 0.9 - drawSize * 0.05;
      if (ci === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.globalAlpha = 1;
  });

  var wrapper = document.createElement('div');
  wrapper.className = 'summary-svg-wrapper';
  wrapper.appendChild(canvas);
  container.appendChild(wrapper);
}

// ============ 辅助函数 ============

function getYearsList() {
  var years = {};
  activities.forEach(function(a) { years[extractYear(a.start_date_local)] = true; });
  return Object.keys(years).map(Number).sort(function(a,b){ return a-b; });
}

function formatDate(d) {
  return d.getFullYear() + '-' + ('0'+(d.getMonth()+1)).slice(-2) + '-' + ('0'+d.getDate()).slice(-2);
}

function initActivePage() {
  var sportSelect = document.getElementById('sportTypeFilter');
  if (sportSelect) {
    getSportTypes().forEach(function(t) {
      var opt = document.createElement('option');
      opt.value = t;
      opt.textContent = typeDisplay(t);
      sportSelect.appendChild(opt);
    });
    sportSelect.addEventListener('change', function() { renderActivePage(); });
  }
  renderActivePage();
}
