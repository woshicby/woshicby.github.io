// ============ 运动详情页专用代码 ============

var activityMap = null;

// ============ 初始化 ============

function initActivityPage() {
  var params = new URLSearchParams(window.location.search);
  var runId = params.get('id');

  // 根据来源页面设置返回按钮
  var backButton = document.getElementById('backButton');
  if (backButton) {
    var referrer = document.referrer;
    if (referrer && referrer.includes('races.html')) {
      backButton.href = 'races.html';
      backButton.innerHTML = '&larr; 返回比赛页面';
    } else {
      backButton.href = 'sports.html';
      backButton.innerHTML = '&larr; 返回活动列表';
    }
  }

  if (!runId) {
    document.getElementById('activityInfo').innerHTML = '<div class="chart-empty">未指定活动 ID</div>';
    return;
  }

  var activity = activities.find(function(a) { return String(a.run_id) === String(runId); });
  if (!activity) {
    document.getElementById('activityInfo').innerHTML = '<div class="chart-empty">未找到该活动</div>';
    return;
  }

  renderActivityInfo(activity);

  if (activity.summary_polyline) {
    renderActivityMap(activity);
  }

  loadDetailAndRenderCharts(runId, activity);
  
  // 监听主题变化事件
  document.addEventListener('themeChanged', onThemeChange);
}

// ============ 侧边栏信息 ============

function renderActivityInfo(act) {
  var container = document.getElementById('activityInfo');
  var dist = (act.distance || 0) / 1000;
  var movingSec = convertTimeToSeconds(act.moving_time);
  var pace = formatPace(act.distance, movingSec);
  var avgSpeed = act.average_speed || 0;
  var elev = Math.min(act.elevation_gain || 0, 20000);
  var hr = act.average_heartrate;
  var date = act.start_date_local || '';
  var type = act.type || 'Run';
  var name = act.name || typeDisplay(type) + ' ' + date.substring(0, 10);
  var location = act.location_country || '';

  var html = '';
  html += '<div class="act-name">' + escapeHtml(name) + '</div>';
  html += '<div class="act-date">' + escapeHtml(date) + '</div>';
  html += '<span class="act-type-badge">' + escapeHtml(typeDisplay(type)) + '</span>';

  html += '<div class="act-stats-grid">';
  html += statItem('距离', dist.toFixed(2), '公里');
  html += statItem('时长', formatDuration(movingSec), '');
  html += statItem('配速', pace, '/公里');
  if (avgSpeed > 0) html += statItem('均速', avgSpeed.toFixed(1), '米/秒');
  if (elev > 0) html += statItem('爬升', elev.toFixed(0), '米');
  if (hr) html += statItem('心率', hr, '次/分');
  html += '</div>';

  if (location) {
    html += '<hr class="act-divider">';
    html += '<div class="act-location">' + escapeHtml(location) + '</div>';
  }

  container.innerHTML = html;
}

function statItem(label, value, unit) {
  return '<div class="act-stat-item">' +
    '<span class="act-stat-label">' + label + '</span>' +
    '<span class="act-stat-value">' + value + '<span class="act-stat-unit">' + unit + '</span></span>' +
    '</div>';
}

// escapeHtml 已移至 common.js 的 escapeHtml

// ============ 地图 ============

function renderActivityMap(act) {
  var mapEl = document.getElementById('activityMap');
  if (!mapEl || typeof mapboxgl === 'undefined') return;

  mapEl.style.display = '';
  mapboxgl.accessToken = MAPBOX_TOKEN;

  activityMap = new mapboxgl.Map({
    container: mapEl,
    style: getCurrentMapStyle(),
    center: [116.4074, 39.9042],
    zoom: 3,
    attributionControl: false,
  });

  activityMap.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
  activityMap.addControl(new mapboxgl.FullscreenControl(), 'top-right');

  activityMap.on('load', function() {
    var coords = pathForActivity(act);
    if (!coords || coords.length === 0) return;

    activityMap.addSource('route-bg', {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: coords }
      }
    });
    activityMap.addLayer({
      id: 'route-bg',
      type: 'line',
      source: 'route-bg',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': getThemeColors().brand,
        'line-width': 4,
        'line-opacity': 0.9
      }
    });

    var bounds = new mapboxgl.LngLatBounds();
    coords.forEach(function(c) { bounds.extend(c); });
    activityMap.fitBounds(bounds, { padding: 40 });

    addActivityMarkers(coords);
    addTileVendorControl(activityMap, 'activityMap', onActivityTileSwitch);
  });
}

// ============ 瓦片供应商切换 ============

// 详情页瓦片切换后的回调：重绘路线和标记
function onActivityTileSwitch() {
  var params = new URLSearchParams(window.location.search);
  var runId = params.get('id');
  if (runId) {
    var act = activities.find(function(a) { return String(a.run_id) === String(runId); });
    if (act) {
      var coords = pathForActivity(act);
      if (coords && coords.length > 0) {
        activityMap.addSource('route-bg', {
          type: 'geojson',
          data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } }
        });
        activityMap.addLayer({
          id: 'route-bg',
          type: 'line',
          source: 'route-bg',
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': getThemeColors().brand,
            'line-width': 4,
            'line-opacity': 0.9
          }
        });
        addActivityMarkers(coords);
      }
    }
  }
}

function addActivityMarkers(coords) {
  if (!activityMap || coords.length < 2) return;

  var start = coords[0];
  var end = coords[coords.length - 1];

  // 使用 GeoJSON 图层渲染标记，与轨迹在同一 WebGL 管线中，坐标精确对齐
  activityMap.addSource('markers', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: { type: 'start', label: '起' },
          geometry: { type: 'Point', coordinates: start }
        },
        {
          type: 'Feature',
          properties: { type: 'end', label: '终' },
          geometry: { type: 'Point', coordinates: end }
        }
      ]
    }
  });

  // 圆点层
  activityMap.addLayer({
    id: 'markers-circle',
    type: 'circle',
    source: 'markers',
    paint: {
      'circle-radius': 9,
      'circle-color': [
        'case',
        ['==', ['get', 'type'], 'start'], getThemeColors().track,
        getThemeColors().special2
      ],
      'circle-stroke-width': 2,
      'circle-stroke-color': getThemeColors().onBrand
    }
  });

  // 文字层
  activityMap.addLayer({
    id: 'markers-label',
    type: 'symbol',
    source: 'markers',
    layout: {
      'text-field': ['get', 'label'],
      'text-size': 11,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold']
    },
    paint: {
      'text-color': getThemeColors().onBrand
    }
  });
}

// ============ 详细数据与图表 ============

// 全局图表状态
var _chartRecords = null;     // 当前活动的原始 records
var _chartHasDist = false;    // 是否有距离数据
var _chartXMode = 'dist';    // 当前 X 轴模式: 'dist' 或 'time'
var _chartCards = [];         // 所有图表卡片的元信息，用于联动
var _chartHoverIdx = -1;     // 当前悬停对应的数据索引

async function loadDetailAndRenderCharts(runId, summaryAct) {
  var chartsContainer = document.getElementById('activityCharts');
  chartsContainer.innerHTML = '';
  _chartCards = [];
  _chartHoverIdx = -1;

  var detail = null;
  try {
    var resp = await fetch('activities_detail/' + runId + '.json');
    if (resp.ok) {
      detail = await resp.json();
    }
  } catch (e) {}

  if (!detail || !detail.records || detail.records.length === 0) {
    chartsContainer.innerHTML = '<div class="chart-empty">暂无详细数据</div>';
    return;
  }

  var records = detail.records;
  _chartRecords = records;

  var hasAlt = records.some(function(r) { return r.alt !== undefined; });
  var hasHR = records.some(function(r) { return r.hr !== undefined; });
  var hasSpeed = records.some(function(r) { return r.speed !== undefined; });
  var hasDist = records.some(function(r) { return r.dist !== undefined && r.dist > 0; });
  var hasCadence = records.some(function(r) { return r.cadence !== undefined; });
  _chartHasDist = hasDist;

  // 默认模式：有距离数据时按距离显示，否则按时间
  _chartXMode = hasDist ? 'dist' : 'time';

  // 切换按钮：仅当有距离数据时显示
  if (hasDist) {
    var toggleBar = document.createElement('div');
    toggleBar.className = 'chart-toggle-bar';
    toggleBar.innerHTML =
      '<button class="chart-toggle-btn active" data-mode="dist">按距离</button>' +
      '<button class="chart-toggle-btn" data-mode="time">按时间</button>';
    toggleBar.addEventListener('click', function(e) {
      var btn = e.target.closest('.chart-toggle-btn');
      if (!btn) return;
      var mode = btn.getAttribute('data-mode');
      if (mode === _chartXMode) return;
      _chartXMode = mode;
      // 更新按钮状态
      toggleBar.querySelectorAll('.chart-toggle-btn').forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('data-mode') === mode);
      });
      // 重新渲染所有图表
      rebuildCharts();
    });
    chartsContainer.appendChild(toggleBar);
  }

  // 创建各图表
  appendChartCards(records, hasAlt, hasSpeed, hasHR, hasCadence);
}

function appendChartCards(records, hasAlt, hasSpeed, hasHR, hasCadence) {
  var chartsContainer = document.getElementById('activityCharts');
  var xType = _chartXMode;
  var xData = records.map(function(r) { return r[xType] || 0; });
  var xLabel = xType === 'dist' ? '距离 (公里)' : '时间 (分钟)';

  var colors = getThemeColors();
  if (hasAlt) {
    var altData = records.map(function(r) { return r.alt; });
    chartsContainer.appendChild(createChartCard('海拔', xLabel, '米', xData, altData, colors.track));
  }

  if (hasSpeed) {
    var paceData = records.map(function(r) {
      if (!r.speed || r.speed < 0.5) return null;
      var pace = 1000 / (r.speed * 60);
      return pace > 15 ? null : pace;
    });
    var validPace = paceData.filter(function(p) { return p !== null && p < 15; });
    if (validPace.length > 5) {
      chartsContainer.appendChild(createChartCard('配速', xLabel, '分钟/公里', xData, paceData, colors.special, true));
    }
  }

  if (hasHR) {
    var hrData = records.map(function(r) { return r.hr; });
    chartsContainer.appendChild(createChartCard('心率', xLabel, '次/分', xData, hrData, colors.special2));
  }

  if (hasCadence) {
    var cadData = records.map(function(r) { return r.cadence; });
    chartsContainer.appendChild(createChartCard('步频', xLabel, '步/分', xData, cadData, '#a78bfa'));
  }
}

function rebuildCharts() {
  var chartsContainer = document.getElementById('activityCharts');
  // 保留切换按钮
  var toggleBar = chartsContainer.querySelector('.chart-toggle-bar');
  // 清除所有图表卡片
  var cards = chartsContainer.querySelectorAll('.chart-card');
  cards.forEach(function(c) { c.remove(); });
  _chartCards = [];
  _chartHoverIdx = -1;

  var records = _chartRecords;
  var hasAlt = records.some(function(r) { return r.alt !== undefined; });
  var hasHR = records.some(function(r) { return r.hr !== undefined; });
  var hasSpeed = records.some(function(r) { return r.speed !== undefined; });
  var hasCadence = records.some(function(r) { return r.cadence !== undefined; });

  appendChartCards(records, hasAlt, hasSpeed, hasHR, hasCadence);
}

// 联动：当某个图表触发悬停时，通知所有图表
function _notifyChartHover(dataIdx) {
  _chartHoverIdx = dataIdx;
  _chartCards.forEach(function(info) {
    _updateChartVline(info, dataIdx);
  });
}

function _notifyChartLeave() {
  _chartHoverIdx = -1;
  _chartCards.forEach(function(info) {
    info.vline.style.display = 'none';
    info.tooltip.style.display = 'none';
    // 清除高亮点
    if (info.highlightCanvas) {
      var ctx = info.highlightCanvas.getContext('2d');
      ctx.clearRect(0, 0, info.highlightCanvas.width, info.highlightCanvas.height);
    }
  });
}

// 更新单个图表的竖线和提示
function _updateChartVline(info, dataIdx) {
  if (dataIdx < 0 || dataIdx >= info.xData.length) {
    info.vline.style.display = 'none';
    info.tooltip.style.display = 'none';
    if (info.highlightCanvas) {
      var ctx = info.highlightCanvas.getContext('2d');
      ctx.clearRect(0, 0, info.highlightCanvas.width, info.highlightCanvas.height);
    }
    return;
  }

  var xVal = info.xData[dataIdx];
  var yVal = info.yData[dataIdx];

  if (xVal < info.xMin || xVal > info.xMax) {
    info.vline.style.display = 'none';
    info.tooltip.style.display = 'none';
    return;
  }

  var pointPx = info.pl + ((xVal - info.xMin) / (info.xMax - info.xMin)) * info.cw;

  info.vline.style.display = 'block';
  info.vline.style.left = pointPx + 'px';

  // 绘制高亮点
  if (info.highlightCanvas && yVal !== null && yVal !== undefined) {
    var dpr = window.devicePixelRatio || 1;
    var hCanvas = info.highlightCanvas;
    var ctx = hCanvas.getContext('2d');
    ctx.clearRect(0, 0, hCanvas.width, hCanvas.height);
    ctx.save();
    ctx.scale(dpr, dpr);
    var yPos = info.sy(yVal);
    // 外圈光晕
    ctx.beginPath();
    ctx.arc(pointPx, yPos, 6, 0, Math.PI * 2);
    ctx.fillStyle = info.color;
    ctx.globalAlpha = 0.3;
    ctx.fill();
    // 内圈实心点
    ctx.beginPath();
    ctx.arc(pointPx, yPos, 3.5, 0, Math.PI * 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = info.color;
    ctx.fill();
    ctx.strokeStyle = getThemeColors().onBrand;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  if (yVal !== null && yVal !== undefined) {
    info.tooltip.style.display = 'block';
    info.tooltip.style.left = pointPx + 'px';
    var xStr = info.xLabel.indexOf('公里') >= 0
      ? (info.xData[dataIdx] / 1000).toFixed(2) + ' 公里'
      : formatDuration(info.xData[dataIdx]);
    info.tooltip.textContent = xStr + ' | ' + formatChartVal(yVal) + ' ' + info.yLabel;
  } else {
    info.tooltip.style.display = 'none';
  }
}

// ============ Canvas 图表渲染 ============

function createChartCard(title, xLabel, yLabel, xData, yData, color, invertY) {
  var card = document.createElement('div');
  card.className = 'chart-card';

  var titleEl = document.createElement('div');
  titleEl.className = 'chart-title';
  titleEl.textContent = title + ' (' + yLabel + ')';
  card.appendChild(titleEl);

  var wrapper = document.createElement('div');
  wrapper.className = 'chart-canvas-wrapper';
  card.appendChild(wrapper);

  var canvas = document.createElement('canvas');
  canvas.className = 'chart-canvas';
  wrapper.appendChild(canvas);

  // 高亮层 canvas（覆盖在主 canvas 之上，用于绘制悬停高亮点）
  var highlightCanvas = document.createElement('canvas');
  highlightCanvas.className = 'chart-canvas chart-canvas-highlight';
  wrapper.appendChild(highlightCanvas);

  // 悬停提示
  var tooltip = document.createElement('div');
  tooltip.className = 'chart-canvas-tooltip';
  tooltip.style.display = 'none';
  wrapper.appendChild(tooltip);

  // 悬停竖线
  var vline = document.createElement('div');
  vline.className = 'chart-canvas-vline';
  vline.style.display = 'none';
  wrapper.appendChild(vline);

  // 先添加到 DOM 获取尺寸
  card.style.visibility = 'hidden';
  document.getElementById('activityCharts').appendChild(card);

  requestAnimationFrame(function() {
    var rect = wrapper.getBoundingClientRect();
    var dpr = window.devicePixelRatio || 1;
    var w = Math.round(rect.width);
    var h = Math.round(rect.height);

    if (w < 50 || h < 30) {
      card.style.visibility = '';
      return;
    }

    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';

    highlightCanvas.width = w * dpr;
    highlightCanvas.height = h * dpr;
    highlightCanvas.style.width = w + 'px';
    highlightCanvas.style.height = h + 'px';

    // 计算有效数据
    var valid = [];
    for (var i = 0; i < yData.length; i++) {
      if (yData[i] !== null && yData[i] !== undefined && !isNaN(yData[i])) {
        valid.push({ x: xData[i], y: yData[i], idx: i });
      }
    }

    if (valid.length < 2) {
      wrapper.innerHTML = '<div class="chart-empty">数据不足</div>';
      card.style.visibility = '';
      return;
    }

    var xMin = valid[0].x;
    var xMax = valid[valid.length - 1].x;
    var yMin = Infinity, yMax = -Infinity;
    valid.forEach(function(p) {
      if (p.y < yMin) yMin = p.y;
      if (p.y > yMax) yMax = p.y;
    });

    var yRange = yMax - yMin || 1;
    yMin -= yRange * 0.05;
    yMax += yRange * 0.05;
    var yRangePadded = yMax - yMin;
    var xRange = xMax - xMin || 1;

    // 绘制区域边距
    var pl = 45, pr = 10, pt = 8, pb = 22;
    var cw = w - pl - pr;
    var ch = h - pt - pb;

    function sx(v) { return pl + ((v - xMin) / xRange) * cw; }
    function syFn(v) {
      if (invertY) return pt + ((v - yMin) / yRangePadded) * ch;
      return pt + ch - ((v - yMin) / yRangePadded) * ch;
    }

    // 绘制 Canvas
    var ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    var colors = getThemeColors();

    // Y 轴网格线和标签
    var yTicks = 4;
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (var t = 0; t <= yTicks; t++) {
      var yVal = yMin + yRangePadded * t / yTicks;
      var yPos = syFn(yVal);
      ctx.strokeStyle = colors.dim;
      ctx.globalAlpha = 0.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(pl, yPos);
      ctx.lineTo(w - pr, yPos);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.fillStyle = colors.dim;
      ctx.fillText(formatChartVal(yVal), pl - 4, yPos);
    }

    // X 轴标签
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = '9px sans-serif';
    var xTicks = Math.min(6, valid.length);
    for (var t = 0; t <= xTicks; t++) {
      var xVal = xMin + (xMax - xMin) * t / xTicks;
      var xPos = sx(xVal);
      ctx.fillStyle = colors.dim;
      ctx.fillText(formatXVal(xVal, xLabel), xPos, h - pb + 6);
    }

    // 面积填充
    ctx.beginPath();
    ctx.moveTo(sx(valid[0].x), pt + ch);
    valid.forEach(function(p) { ctx.lineTo(sx(p.x), syFn(p.y)); });
    ctx.lineTo(sx(valid[valid.length - 1].x), pt + ch);
    ctx.closePath();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = color;
    ctx.fill();
    ctx.globalAlpha = 1;

    // 折线
    ctx.beginPath();
    valid.forEach(function(p, i) {
      var px = sx(p.x), py = syFn(p.y);
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.stroke();

    // 注册到全局图表卡片列表，用于联动
    var chartInfo = {
      xMin: xMin, xMax: xMax, pl: pl, cw: cw,
      xData: xData, yData: yData,
      xLabel: xLabel, yLabel: yLabel,
      color: color,
      sy: syFn,
      vline: vline,
      tooltip: tooltip,
      highlightCanvas: highlightCanvas
    };
    _chartCards.push(chartInfo);

    // 悬停交互 —— 使用全局联动
    wrapper.addEventListener('mousemove', function(e) {
      var rect = wrapper.getBoundingClientRect();
      var mouseX = e.clientX - rect.left;

      // 从鼠标位置反推 x 值
      var xVal = chartInfo.xMin + ((mouseX - chartInfo.pl) / chartInfo.cw) * (chartInfo.xMax - chartInfo.xMin);

      // 找最近数据点（基于 records 索引）
      var bestIdx = 0, bestDist = Infinity;
      for (var i = 0; i < chartInfo.xData.length; i++) {
        var d = Math.abs(chartInfo.xData[i] - xVal);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
      }

      _notifyChartHover(bestIdx);
    });

    wrapper.addEventListener('mouseleave', function() {
      _notifyChartLeave();
    });

    card.style.visibility = '';
  });

  return card;
}

function formatChartVal(v) {
  if (Math.abs(v) >= 1000) return (v / 1000).toFixed(1) + 'k';
  if (Math.abs(v) >= 100) return Math.round(v).toString();
  if (Math.abs(v) >= 10) return v.toFixed(1);
  return v.toFixed(2);
}

function formatXVal(v, xLabel) {
  if (xLabel.indexOf('公里') >= 0) return (v / 1000).toFixed(1);
  return (v / 60).toFixed(0) + "'";
}

// ============ 主题切换 ============

function onThemeChange() {
  redrawMapOnThemeChange(activityMap, function() {
    // 重新加载活动数据（坐标可能需要 GCJ-02 转换）
    var params = new URLSearchParams(window.location.search);
    var runId = params.get('id');
    if (runId) {
      var act = activities.find(function(a) { return String(a.run_id) === String(runId); });
      if (act) {
        var coords = pathForActivity(act);
        if (coords && coords.length > 0) {
          activityMap.addSource('route-bg', {
            type: 'geojson',
            data: { type: 'Feature', geometry: { type: 'LineString', coordinates: coords } }
          });
          activityMap.addLayer({
            id: 'route-bg',
            type: 'line',
            source: 'route-bg',
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: {
              'line-color': getThemeColors().brand,
              'line-width': 4,
              'line-opacity': 0.9
            }
          });
          addActivityMarkers(coords);
        }
      }
    }
    addTileVendorControl(activityMap, 'activityMap', onActivityTileSwitch);
  });
}
