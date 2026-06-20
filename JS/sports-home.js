// ============ 首页专用代码 ============

let currentFilter = 'Total';
let selectedActivity = null;
let map = null;
let routeAnimator = null; // 路线动画器
let mapGeoData = null; // 中国省份/国家 GeoJSON 数据
let isLoadingGeoData = false;

const PROVINCE_FILL_COLOR = '#47b8e0';
const COUNTRY_FILL_COLOR = 'rgb(228,212,220)';

// 获取活动颜色
function getActivityColor(activity) {
  const isDark = isDarkTheme();
  const colors = getThemeColors();
  
  const nikeColor = colors.brand;
  const runColorLight = '#47b8e0';
  const cyclingColor = 'rgb(51,255,87)';
  const hikingColor = 'rgb(151,51,255)';
  const indoorColor = '#8899aa';
  const trailColor = 'rgb(255,153,51)';
  const walkingColor = hikingColor;
  const swimmingColor = colors.special2;

  switch (activity.type) {
    case '跑步':
      if (activity.subtype === 'treadmill' || activity.subtype === 'indoor_running') {
        return indoorColor;
      }
      if (activity.subtype === 'trail') {
        return trailColor;
      }
      return isDark ? nikeColor : runColorLight;
    case '骑行':
    case '公路骑行':
    case '山地骑行':
    case '室内骑行':
    case '通勤骑行':
      return cyclingColor;
    case '徒步':
      return hikingColor;
    case '步行':
    case '休闲走':
    case '健走':
    case '室内步行':
      return walkingColor;
    case '游泳':
    case '泳池游泳':
    case '公开水域游泳':
      return swimmingColor;
    default:
      return isDark ? nikeColor : runColorLight;
  }
}

function formatDistanceWithUnit(meters) {
  return formatDistance(meters) + ' 公里';
}

function formatMovingTime(timeStr) {
  if (!timeStr) return '-';
  // Truncate microseconds: "1:01:35.877000" -> "1:01:35"
  const dotIdx = timeStr.indexOf('.');
  return dotIdx >= 0 ? timeStr.substring(0, dotIdx) : timeStr;
}

function initMap() {
  if (typeof mapboxgl === 'undefined') {
    showMapUnavailable();
    return;
  }
  
  mapboxgl.accessToken = MAPBOX_TOKEN;
  
  try {
    map = new mapboxgl.Map({
      container: 'map',
      style: getCurrentMapStyle(),
      center: [116.4074, 39.9042],
      zoom: 3
    });

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    map.on('load', function() {
      console.log('Map loaded, updating activities...');
      updateMapActivities();
      // 加载省份填充数据
      loadGeoData();
      // 添加瓦片供应商切换按钮
      addTileVendorControl(map, 'map', onHomeTileSwitch);
    });

    // 缩放变化时更新省份填充
    map.on('zoom', function() {
      updateProvinceFill();
    });

    map.on('error', function(e) {
      console.error('Map error:', e.error ? e.error.message : e);
    });
  } catch (error) {
    console.error('Error creating map:', error);
    showMapUnavailable();
  }
}

function showMapUnavailable() {
  var mapEl = document.getElementById('map');
  if (mapEl) {
    mapEl.innerHTML = '<div class="map-placeholder" style="display:flex;align-items:center;justify-content:center;height:100%;">地图服务不可用（需要网络连接）</div>';
  }
}

function updateMapActivities() {
  console.log('updateMapActivities called, activities count:', activities.length);
  
  if (!map || !map.loaded()) {
    console.log('Map not loaded yet');
    return;
  }

  const filteredActivities = activities.filter(function(a) {
    if (!filterYearRuns(a, currentFilter)) return false;
    if (currentCity) {
      var loc = a.location_country || '';
      if (loc.indexOf(currentCity) === -1) return false;
    }
    if (currentSport) {
      if (getSportType(a) !== currentSport) return false;
    }
    return true;
  });
  console.log('Filtered activities count:', filteredActivities.length);
  
  // 移除旧的图层和源
  removeLayer('activity-lines');
  removeLayer('activity-lines-highlight');
  removeLayer('animated-run');
  removeSource('all-activities');
  removeSource('highlight-activity');
  removeSource('animated-run-source');

  // 将选中活动从普通图层中排除
  const bgActivities = filteredActivities.filter(a => 
    !selectedActivity || a.run_id !== selectedActivity.run_id
  );

  // 创建背景 GeoJSON（所有活动，排除选中项）
  const bgData = {
    type: 'FeatureCollection',
    features: bgActivities.map(activity => {
      const coordinates = pathForActivity(activity);
      if (coordinates.length < 2) return null;
      return {
        type: 'Feature',
        properties: {
          color: getActivityColor(activity),
          run_id: activity.run_id
        },
        geometry: {
          type: 'LineString',
          coordinates: coordinates
        }
      };
    }).filter(Boolean)
  };

  if (bgData.features.length > 0) {
    map.addSource('all-activities', { type: 'geojson', data: bgData });
    map.addLayer({
      id: 'activity-lines',
      type: 'line',
      source: 'all-activities',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': ['get', 'color'],
        'line-width': 1.5,
        'line-opacity': 0.35
      }
    });
  }

  // 如果有选中活动，高亮显示
  if (selectedActivity) {
    highlightSelectedActivity();
    fitMapToActivity(selectedActivity);
  } else if (bgData.features.length > 0) {
    fitMapToActivities(bgActivities);
  }
}

function highlightSelectedActivity() {
  if (!selectedActivity || !map || !map.loaded()) return;

  removeLayer('activity-lines-highlight');
  removeSource('highlight-activity');
  removeLayer('animated-run');
  removeSource('animated-run-source');

  var coordinates = pathForActivity(selectedActivity);
  if (coordinates.length < 2) return;

  var highlightColor = getActivityColor(selectedActivity);

  map.addSource('highlight-activity', {
    type: 'geojson',
    data: {
      type: 'Feature',
      properties: { color: highlightColor },
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      }
    }
  });

  // 外层发光效果
  map.addLayer({
    id: 'activity-lines-highlight',
    type: 'line',
    source: 'highlight-activity',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': highlightColor,
      'line-width': 6,
      'line-opacity': 0.9,
      'line-blur': 2
    }
  });

  // 启动路线动画
  startRouteAnimation(coordinates);
}

// ============ 路线动画 ============

function haversine(a, b) {
  var toRad = function(x) { return x * Math.PI / 180; };
  var R = 6371000;
  var dLat = toRad(b[1] - a[1]);
  var dLon = toRad(b[0] - a[0]);
  var lat1 = toRad(a[1]);
  var lat2 = toRad(b[1]);
  var sinDLat = Math.sin(dLat / 2);
  var sinDLon = Math.sin(dLon / 2);
  var v = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  var c = 2 * Math.atan2(Math.sqrt(v), Math.sqrt(1 - v));
  return R * c;
}

function simplifyRoute(points, minDistance) {
  minDistance = minDistance || 5;
  if (points.length <= 100) return points;
  var simplified = [points[0]];
  var lastIncluded = 0;
  for (var i = 1; i < points.length - 1; i++) {
    var d = haversine(points[lastIncluded], points[i]);
    if (d > minDistance) {
      simplified.push(points[i]);
      lastIncluded = i;
    }
  }
  simplified.push(points[points.length - 1]);
  return simplified;
}

function calculateSegmentLengths(points) {
  var segLens = [];
  var total = 0;
  var cum = [0];
  for (var i = 1; i < points.length; i++) {
    var d = haversine(points[i - 1], points[i]);
    segLens.push(d);
    total += d;
    cum.push(total);
  }
  return { segLens: segLens, total: total, cum: cum };
}

function findSegmentIdx(cum, targetDist) {
  var left = 0, right = cum.length - 2;
  while (left <= right) {
    var mid = Math.floor((left + right) / 2);
    if (cum[mid] <= targetDist && targetDist < cum[mid + 1]) return mid;
    else if (cum[mid] > targetDist) right = mid - 1;
    else left = mid + 1;
  }
  return Math.max(0, Math.min(cum.length - 2, left));
}

function calculateVisiblePoints(points, segLens, cum, targetDist) {
  var upTo = findSegmentIdx(cum, targetDist);
  var segStart = points[upTo];
  var segEnd = points[Math.min(upTo + 1, points.length - 1)];
  var segTotal = segLens[upTo] || 1;
  var segT = Math.max(0, Math.min(1, (targetDist - cum[upTo]) / segTotal));

  var visiblePoints = [];
  for (var i = 0; i <= upTo; i++) {
    visiblePoints.push(points[i]);
  }
  if (segT > 0 && segT < 1) {
    var lon = segStart[0] + (segEnd[0] - segStart[0]) * segT;
    var lat = segStart[1] + (segEnd[1] - segStart[1]) * segT;
    visiblePoints.push([lon, lat]);
  }
  return visiblePoints;
}

function startRouteAnimation(coordinates) {
  // 停止之前的动画
  if (routeAnimator) {
    routeAnimator.stop();
    routeAnimator = null;
  }

  var simplified = simplifyRoute(coordinates);
  var segments = calculateSegmentLengths(simplified);
  if (segments.total <= 0) return;

  var speedMps = 4000;
  var minDuration = 2500;
  var maxDuration = 8000;
  var duration = Math.max(minDuration, Math.min(maxDuration, (segments.total / speedMps) * 1000));
  var startTime = performance.now();
  var animFrameId = null;
  var lastUpTo = -1;
  var lastT = 0;
  var frameCount = 0;
  var lastFrameTime = 0;
  var targetFps = 60;
  var updateThreshold = 0.01;

  // 获取动画颜色（暗色主题红色，亮色主题绿色）
  var isDark = isDarkTheme();
  var animColor = isDark ? getThemeColors().special2 : getThemeColors().track;

  // 创建动画图层源
  removeLayer('animated-run');
  removeSource('animated-run-source');
  map.addSource('animated-run-source', {
    type: 'geojson',
    data: {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: { color: animColor },
        geometry: { type: 'LineString', coordinates: [simplified[0]] }
      }]
    }
  });
  map.addLayer({
    id: 'animated-run',
    type: 'line',
    source: 'animated-run-source',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 3,
      'line-opacity': 1
    }
  });

  function step(t) {
    var frameInterval = 1000 / targetFps;
    if (t - lastFrameTime < frameInterval && frameCount > 0) {
      animFrameId = requestAnimationFrame(step);
      return;
    }
    lastFrameTime = t;
    frameCount++;

    var elapsed = t - startTime;
    var p = Math.min(1, elapsed / duration);

    if (p >= 1) {
      // 动画完成，显示完整路线
      var source = map.getSource('animated-run-source');
      if (source) {
        source.setData({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            properties: { color: animColor },
            geometry: { type: 'LineString', coordinates: simplified }
          }]
        });
      }
      routeAnimator = null;
      return;
    }

    var targetDist = p * segments.total;
    var upTo = findSegmentIdx(segments.cum, targetDist);

    // 跳过微小更新
    if (upTo === lastUpTo && Math.abs(p - lastT) < updateThreshold && p < 0.98) {
      animFrameId = requestAnimationFrame(step);
      return;
    }
    lastUpTo = upTo;
    lastT = p;

    var visiblePoints = calculateVisiblePoints(simplified, segments.segLens, segments.cum, targetDist);
    var source = map.getSource('animated-run-source');
    if (source) {
      source.setData({
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: { color: animColor },
          geometry: { type: 'LineString', coordinates: visiblePoints }
        }]
      });
    }

    animFrameId = requestAnimationFrame(step);
  }

  routeAnimator = {
    stop: function() {
      if (animFrameId) {
        cancelAnimationFrame(animFrameId);
        animFrameId = null;
      }
    }
  };

  animFrameId = requestAnimationFrame(step);
}

// ============ 中国省份填充 ============

function loadGeoData() {
  if (mapGeoData || isLoadingGeoData) return;
  isLoadingGeoData = true;

  // 并行加载世界和中国省份 GeoJSON
  var worldPromise = fetch('./JSON/sports-world.zh.json').then(function(r) { return r.json(); }).catch(function() { return null; });
  var chinaPromise = fetch('./JSON/sports-china_provinces.json').then(function(r) { return r.json(); }).catch(function() { return null; });

  Promise.all([worldPromise, chinaPromise]).then(function(results) {
    var worldData = results[0];
    var chinaData = results[1];
    var features = [];

    if (worldData && worldData.features) {
      features = features.concat(worldData.features);
    }
    if (chinaData && chinaData.features) {
      features = features.concat(chinaData.features);
    }

    if (features.length > 0) {
      mapGeoData = {
        type: 'FeatureCollection',
        features: features
      };
    }
    isLoadingGeoData = false;
    updateProvinceFill();
  });
}

function updateProvinceFill() {
  if (!map || !map.loaded() || !mapGeoData) return;

  var zoom = map.getZoom();
  var isBigMap = zoom <= 3;

  // 只在大缩放时显示省份填充
  if (!isBigMap) {
    removeLayer('province-fill');
    removeLayer('country-fill');
    removeSource('geo-data');
    return;
  }

  // 从活动数据提取跑过的省份和国家
  var provinces = [];
  var countries = [];
  activities.forEach(function(a) {
    var loc = a.location_country;
    if (!loc) return;
    // 提取省份
    var provinceMatch = loc.match(/[\u4e00-\u9fa5]{2,}(省|自治区)/);
    if (provinceMatch) {
      var pName = provinceMatch[0];
      if (provinces.indexOf(pName) === -1) provinces.push(pName);
    }
    // 直辖市
    MUNICIPALITIES.forEach(function(city) {
      if (loc.indexOf(city) !== -1 && provinces.indexOf(city) === -1) {
        provinces.push(city);
      }
    });
    // 提取国家
    var parts = loc.split(',');
    var countryMatch = parts[parts.length - 1].match(/[\u4e00-\u9fa5].*[\u4e00-\u9fa5]/);
    if (countryMatch) {
      var cName = countryMatch[0];
      if (countries.indexOf(cName) === -1) countries.push(cName);
    }
  });

  // 添加或更新 GeoJSON 源
  removeLayer('province-fill');
  removeLayer('country-fill');
  removeSource('geo-data');

  map.addSource('geo-data', { type: 'geojson', data: mapGeoData });

  // 省份填充层
  var provinceFilter = ['in', 'name'];
  provinces.forEach(function(p) { provinceFilter.push(p); });

  map.addLayer({
    id: 'province-fill',
    type: 'fill',
    source: 'geo-data',
    paint: {
      'fill-color': PROVINCE_FILL_COLOR,
      'fill-opacity': 0.6
    },
    filter: provinceFilter
  }, 'activity-lines'); // 放在路线图层下面

  // 国家填充层
  var countryFilter = ['in', 'name'];
  countries.forEach(function(c) { countryFilter.push(c); });

  map.addLayer({
    id: 'country-fill',
    type: 'fill',
    source: 'geo-data',
    paint: {
      'fill-color': COUNTRY_FILL_COLOR,
      'fill-opacity': ['case', ['==', ['get', 'name'], '中国'], 0.1, 0.5]
    },
    filter: countryFilter
  }, 'province-fill'); // 放在省份图层下面
}

// ============ 瓦片供应商切换 ============

// 首页瓦片切换后的回调：重绘路线和省份填充
function onHomeTileSwitch() {
  updateMapActivities();
  updateProvinceFill();
}

function removeLayer(id) {
  if (map.getLayer(id)) { map.removeLayer(id); }
}

function removeSource(id) {
  if (map.getSource(id)) { map.removeSource(id); }
}

function fitMapToActivities(filteredActivities) {
  const allCoordinates = [];
  
  filteredActivities.forEach(activity => {
    const coords = pathForActivity(activity);
    if (coords.length > 1) {
      allCoordinates.push(...coords);
    }
  });

  if (allCoordinates.length > 0) {
    const bounds = allCoordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(allCoordinates[0], allCoordinates[0]));
    
    map.fitBounds(bounds, {
      padding: 50
    });
  }
}

function fitMapToActivity(activity) {
  const coordinates = pathForActivity(activity);
  if (coordinates.length > 1) {
    const bounds = coordinates.reduce((bounds, coord) => {
      return bounds.extend(coord);
    }, new mapboxgl.LngLatBounds(coordinates[0], coordinates[0]));
    
    map.fitBounds(bounds, {
      padding: 50
    });
  }
}

// ============ URL 参数工具 ============

function getUrlParams() {
  var params = {};
  var search = window.location.search.substring(1);
  if (search) {
    search.split('&').forEach(function(pair) {
      var kv = pair.split('=');
      if (kv.length === 2) {
        params[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1]);
      }
    });
  }
  return params;
}

function buildUrl(params) {
  var parts = [];
  Object.keys(params).forEach(function(key) {
    if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
      parts.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
    }
  });
  return parts.length > 0 ? '?' + parts.join('&') : window.location.pathname;
}

function updateUrl(params, replace) {
  var url = buildUrl(params);
  if (replace) {
    window.history.replaceState(null, '', url);
  } else {
    window.history.pushState(null, '', url);
  }
}

function getCurrentUrlParams() {
  var params = {};
  if (currentFilter && currentFilter !== 'Total') params.year = currentFilter;
  if (currentCity) params.city = currentCity;
  if (currentSport) params.sport = currentSport;
  return params;
}

var currentCity = null;
var currentSport = null;

// UI 渲染函数
function renderYearFilters() {
  const filtersContainer = document.getElementById('yearFilters');
  if (!filtersContainer) return;

  const years = new Set();
  activities.forEach(activity => {
    years.add(extractYear(activity.start_date_local));
  });
  const sortedYears = Array.from(years).sort((a, b) => b - a);
  
  filtersContainer.innerHTML = '';
  
  // "全部"按钮 — 切换年份时清空城市和类型筛选
  const totalLink = document.createElement('a');
  totalLink.href = buildUrl({});
  totalLink.className = 'filter-btn' + (currentFilter === 'Total' ? ' active' : '');
  totalLink.textContent = '全部';
  filtersContainer.appendChild(totalLink);
  
  sortedYears.forEach(year => {
    const link = document.createElement('a');
    link.href = buildUrl({ year: year });
    link.className = 'filter-btn' + (currentFilter === year ? ' active' : '');
    link.textContent = year;
    filtersContainer.appendChild(link);
  });
}

function renderStats() {
  var container = document.getElementById('sidebarContent');
  container.innerHTML = '';

  var filteredActivities = activities.filter(function(a) { return filterYearRuns(a, currentFilter); });
  var isTotal = currentFilter === 'Total';

  var html = '<div class="location-stat">';

  // 统计卡片
  if (isTotal) {
    html += '<div class="year-stat-card">';
    html += '<div class="ys-header">总计</div>';
    html += buildYearStatGrid(filteredActivities);
    html += '</div>';
  } else {
    html += '<div class="year-stat-card">';
    html += '<div class="ys-header">' + currentFilter + ' 年度</div>';
    html += buildYearStatGrid(filteredActivities);
    html += '</div>';
  }
  html += '<hr class="stat-divider"/>';

  // 5. 位置摘要
  var years = new Set();
  var countries = new Set();
  var provinces = new Set();
  var cities = {};
  var sportTypes = {};

  filteredActivities.forEach(function(a) {
    years.add(extractYear(a.start_date_local));
    var loc = extractLocation(a);
    if (loc.country) countries.add(loc.country);
    if (loc.province) provinces.add(loc.province);
    if (loc.city && loc.city.length > 1) {
      cities[loc.city] = (cities[loc.city] || 0) + (a.distance || 0);
    }
    var sport = getSportType(a);
    sportTypes[sport] = (sportTypes[sport] || 0) + 1;
  });

  html += '<div class="location-summary">';
  if (isTotal) {
    html += '<div class="loc-stat"><span class="loc-val">' + years.size + '</span><span class="loc-label">年</span></div>';
  }
  html += '<div class="loc-stat"><span class="loc-val">' + countries.size + '</span><span class="loc-label">国家</span></div>';
  html += '<div class="loc-stat"><span class="loc-val">' + provinces.size + '</span><span class="loc-label">省份</span></div>';
  html += '<div class="loc-stat"><span class="loc-val">' + Object.keys(cities).length + '</span><span class="loc-label">城市</span></div>';
  html += '</div><hr class="stat-divider"/>';

  // 6. 城市统计
  var citiesArr = Object.entries(cities).sort(function(a, b) { return b[1] - a[1]; });
  html += '<div class="cities-stat">';
  citiesArr.forEach(function(item) {
    var cityParams = { city: item[0] };
    if (currentFilter !== 'Total') cityParams.year = currentFilter;
    if (currentSport) cityParams.sport = currentSport;
    html += '<a href="' + buildUrl(cityParams) + '" class="city-item" data-city="' + item[0] + '">';
    html += '<span class="city-name">' + item[0] + '</span>';
    html += '<span class="city-dist">' + formatDistance(item[1]) + ' 公里</span>';
    html += '</a>';
  });
  html += '</div><hr class="stat-divider"/>';

  // 7. 运动类型统计
  var sportArr = Object.entries(sportTypes).sort(function(a, b) { return b[1] - a[1]; });
  html += '<div class="period-stat">';
  sportArr.forEach(function(item) {
    var sportParams = { sport: item[0] };
    if (currentFilter !== 'Total') sportParams.year = currentFilter;
    if (currentCity) sportParams.city = currentCity;
    html += '<a href="' + buildUrl(sportParams) + '" class="period-item" data-sport="' + item[0] + '">';
    html += '<span class="period-name">' + item[0] + '</span>';
    html += '<span class="period-count">' + item[1] + ' 次</span>';
    html += '</a>';
  });
  html += '</div>';

  html += '</div>';
  container.innerHTML = html;

  // 渲染年份筛选按钮（HTML中已有的yearFilters容器）
  renderYearFilters();
}

// ============ 位置统计 ============

function extractLocation(activity) {
  var loc = activity.location_country || '';
  var city = '', province = '', country = '';
  if (loc) {
    // Nominatim 格式: "街道, 区, 市, 省, 邮编, 中国"
    // 如: "剑桥正荣幼儿园, 后塘路, 镇海街道, 荔城区, 莆田市, 福建省, 351100, 中国"
    // 如: "掖县西街, 永安路街道, 莱州市, 烟台市, 山东省, 261400, 中国"
    // 如: "Grid Coffee, 健身步道, 洼边, 奥运村街道, 朝阳区, 北京市, 100012, 中国"
    // 旧格式: "福建省, 中国" / "北京市, 中国" / "中国 (18.39, 109.86)"

    // 提取省份
    var provinceMatch = loc.match(/[\u4e00-\u9fa5]{2,}(省|自治区)/);
    if (provinceMatch) province = provinceMatch[0];

    // 直辖市特殊处理
    MUNICIPALITIES.forEach(function(m) {
      if (loc.indexOf(m) !== -1) {
        province = m;
        city = m; // 直辖市直接用市名作为城市，不再按区拆分
      }
    });

    // 非直辖市：提取地级市作为城市
    // Nominatim 格式中县级市在前、地级市在后，如 "莱州市, 烟台市"
    // 需要找最后一个"市"级匹配（即地级市），而非第一个（可能是县级市）
    if (!city) {
      var cityMatches = [];
      var cityRegex = /[\u4e00-\u9fa5]{2,}(市|自治州|特别行政区|盟|地区)/g;
      var m;
      while ((m = cityRegex.exec(loc)) !== null) {
        cityMatches.push(m[0]);
      }
      if (cityMatches.length > 0) {
        city = cityMatches[cityMatches.length - 1]; // 取最后一个（地级市）
      }
    }

    // 如果没有地级市，尝试提取县级：自治县/县/县级市
    if (!city) {
      var countyMatch = loc.match(/[\u4e00-\u9fa5]{2,}(自治县|县|市)/);
      if (countyMatch) city = countyMatch[0];
    }

    // 提取国家
    var parts = loc.split(',').map(function(p) { return p.trim(); });
    var lastPart = parts[parts.length - 1];
    var cMatch = lastPart.match(/^([\u4e00-\u9fa5]{2,})/);
    if (cMatch) {
      country = cMatch[1];
    } else {
      var firstMatch = loc.match(/^([\u4e00-\u9fa5]{2,})[\s,(]/);
      if (firstMatch) country = firstMatch[1];
    }
  }
  return { city: city, province: province, country: country };
}

function getSportType(activity) {
  return activity.type || '其他';
}

// 统一应用筛选（城市+运动类型可同时生效）
function applyFilters() {
  selectedActivity = null;
  if (routeAnimator) { routeAnimator.stop(); routeAnimator = null; }
  updateUrl(getCurrentUrlParams());
  renderYearFilters();
  renderStats();

  var filtered = activities.filter(function(a) {
    if (!filterYearRuns(a, currentFilter)) return false;
    if (currentCity) {
      var loc = a.location_country || '';
      if (loc.indexOf(currentCity) === -1) return false;
    }
    if (currentSport) {
      if (getSportType(a) !== currentSport) return false;
    }
    return true;
  });

  // 在位置摘要下方显示筛选提示
  var locationSummary = document.querySelector('.location-summary');
  if (currentCity || currentSport) {
    var insertRef = locationSummary ? locationSummary.nextSibling : null;
    // 在位置摘要和筛选提示之间插入分隔线
    if (locationSummary) {
      var divider = document.createElement('hr');
      divider.className = 'stat-divider';
      locationSummary.parentNode.insertBefore(divider, insertRef);
      insertRef = divider.nextSibling;
    }
    if (currentCity) {
      var cityHint = document.createElement('div');
      cityHint.className = 'filter-hint';
      var cityClearParams = {};
      if (currentFilter !== 'Total') cityClearParams.year = currentFilter;
      if (currentSport) cityClearParams.sport = currentSport;
      cityHint.innerHTML = '<span>城市: ' + currentCity + '</span><a href="' + buildUrl(cityClearParams) + '" class="filter-hint-close">&times;</a>';
      if (locationSummary) {
        locationSummary.parentNode.insertBefore(cityHint, insertRef);
      } else {
        sidebarContent.insertBefore(cityHint, sidebarContent.firstChild);
      }
      insertRef = cityHint.nextSibling;
    }
    if (currentSport) {
      var sportHint = document.createElement('div');
      sportHint.className = 'filter-hint';
      var sportClearParams = {};
      if (currentFilter !== 'Total') sportClearParams.year = currentFilter;
      if (currentCity) sportClearParams.city = currentCity;
      sportHint.innerHTML = '<span>类型: ' + currentSport + '</span><a href="' + buildUrl(sportClearParams) + '" class="filter-hint-close">&times;</a>';
      if (locationSummary) {
        locationSummary.parentNode.insertBefore(sportHint, insertRef);
      } else {
        sidebarContent.insertBefore(sportHint, sidebarContent.firstChild);
      }
    }
  }

  renderActivitiesTable(filtered);
  if (map && map.loaded()) {
    updateMapActivitiesWithList(filtered);
  }
}

// 按城市筛选
function filterByCity(city) {
  currentCity = city;
  applyFilters();
}

// 按运动类型筛选
function filterBySport(sport) {
  currentSport = sport;
  applyFilters();
}

// 清除筛选
function clearFilter() {
  currentFilter = 'Total';
  currentCity = null;
  currentSport = null;
  selectedActivity = null;
  if (routeAnimator) { routeAnimator.stop(); routeAnimator = null; }
  updateUrl(getCurrentUrlParams());
  renderYearFilters();
  renderStats();
  renderActivitiesTable();
  if (map && map.loaded()) {
    updateMapActivities();
  }
}

// ============ 年度统计卡片 ============

function buildYearStatGrid(filteredActivities) {
  var totalDistance = filteredActivities.reduce(function(s, a) { return s + (a.distance || 0); }, 0);
  var totalElevation = filteredActivities.reduce(function(s, a) {
    var g = a.elevation_gain || 0;
    return s + (g > 20000 ? 0 : g);
  }, 0);
  var runCount = filteredActivities.length;
  var totalTime = filteredActivities.reduce(function(s, a) { return s + convertTimeToSeconds(a.moving_time || '0:0:0'); }, 0);

  // 平均配速
  var avgPace = '--';
  var totalMeters = 0, totalSeconds = 0;
  filteredActivities.forEach(function(a) {
    if (a.average_speed && a.average_speed > 0) {
      totalMeters += (a.distance || 0);
      totalSeconds += convertTimeToSeconds(a.moving_time || '0:0:0');
    }
  });
  if (totalMeters > 0 && totalSeconds > 0) {
    var paceMin = (totalSeconds / 60) / (totalMeters / 1000);
    var pm = Math.floor(paceMin);
    var ps = Math.round((paceMin - pm) * 60);
    avgPace = pm + "'" + (ps < 10 ? '0' : '') + ps + '"';
  }

  // 连续跑步天数
  var streak = calcStreak(filteredActivities);

  // 平均心率
  var hrSum = 0, hrCount = 0;
  filteredActivities.forEach(function(a) {
    if (a.average_heartrate && a.average_heartrate > 0) {
      hrSum += a.average_heartrate;
      hrCount++;
    }
  });
  var avgHR = hrCount > 0 ? Math.round(hrSum / hrCount) : null;

  var html = '<div class="ys-stats-grid">';
  html += '<div class="ys-stat-cell"><span class="ys-val">' + runCount + '</span><span class="ys-unit">次</span></div>';
  html += '<div class="ys-stat-cell"><span class="ys-val">' + formatDistance(totalDistance) + '</span><span class="ys-unit">公里</span></div>';
  html += '<div class="ys-stat-cell"><span class="ys-val">' + avgPace + '</span><span class="ys-unit">配速</span></div>';
  html += '<div class="ys-stat-cell"><span class="ys-val">' + streak + '</span><span class="ys-unit">天连续</span></div>';
  html += '<div class="ys-stat-cell"><span class="ys-val">' + formatDuration(totalTime) + '</span><span class="ys-unit">时长</span></div>';
  html += '<div class="ys-stat-cell"><span class="ys-val">' + totalElevation.toFixed(0) + '</span><span class="ys-unit">米 爬升</span></div>';
  if (avgHR) {
    html += '<div class="ys-stat-cell"><span class="ys-val">' + avgHR + '</span><span class="ys-unit">次/分</span></div>';
  }
  html += '</div>';
  return html;
}

// 用指定活动列表更新地图
function updateMapActivitiesWithList(filteredActivities) {
  if (!map || !map.loaded()) return;

  removeLayer('activity-lines');
  removeLayer('activity-lines-highlight');
  removeLayer('animated-run');
  removeSource('all-activities');
  removeSource('highlight-activity');
  removeSource('animated-run-source');

  var features = [];
  filteredActivities.forEach(function(activity) {
    var coordinates = pathForActivity(activity);
    if (coordinates.length >= 2) {
      features.push({
        type: 'Feature',
        properties: {
          color: getActivityColor(activity),
          id: activity.run_id,
          indoor: !activity.map || activity.map.summary_polyline === ''
        },
        geometry: { type: 'LineString', coordinates: coordinates }
      });
    }
  });

  if (features.length === 0) return;

  map.addSource('all-activities', {
    type: 'geojson',
    data: { type: 'FeatureCollection', features: features }
  });

  map.addLayer({
    id: 'activity-lines',
    type: 'line',
    source: 'all-activities',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: {
      'line-color': ['get', 'color'],
      'line-width': 1.5,
      'line-opacity': 0.35
    }
  });

  fitMapToActivities(filteredActivities);
}

function renderActivitiesTable(optActivities) {
  var filteredActivities = optActivities || activities.filter(function(a) { return filterYearRuns(a, currentFilter); });
  filteredActivities.sort(sortDateFunc);
  
  const tableContainer = document.getElementById('activitiesTable');
  tableContainer.innerHTML = '';
  
  if (filteredActivities.length === 0) {
    tableContainer.innerHTML = '<p>该时段暂无运动记录。</p>';
    return;
  }
  
  const table = document.createElement('table');
  table.className = 'activities-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>日期</th>
        <th>时间</th>
        <th>类型</th>
        <th>距离</th>
        <th>配速</th>
        <th>时长</th>
        <th>心率</th>
      </tr>
    </thead>
    <tbody>
      ${filteredActivities.map(activity => `
        <tr class="run-row">
          <td class="run-date"><a href="sports-activity.html?id=${activity.run_id}">${activity.start_date_local.substring(0, 10)}</a></td>
          <td class="run-time"><a href="sports-activity.html?id=${activity.run_id}">${activity.start_date_local.substring(11, 19)}</a></td>
          <td><a href="sports-activity.html?id=${activity.run_id}">${typeDisplay(activity.type)}</a></td>
          <td><a href="sports-activity.html?id=${activity.run_id}">${formatDistanceWithUnit(activity.distance)}</a></td>
          <td><a href="sports-activity.html?id=${activity.run_id}">${formatPace(activity.distance, activity.moving_time)}/公里</a></td>
          <td><a href="sports-activity.html?id=${activity.run_id}">${formatMovingTime(activity.moving_time)}</a></td>
          <td><a href="sports-activity.html?id=${activity.run_id}">${activity.average_heartrate ? Math.round(activity.average_heartrate) : '-'}</a></td>
        </tr>
      `).join('')}
    </tbody>
  `;
  
  tableContainer.appendChild(table);
}

// 事件处理函数
function changeFilter(year) {
  currentFilter = year;
  currentCity = null;
  currentSport = null;
  selectedActivity = null;
  if (routeAnimator) { routeAnimator.stop(); routeAnimator = null; }
  updateUrl(getCurrentUrlParams());
  renderYearFilters();
  renderStats();
  renderActivitiesTable();
  if (map && map.loaded()) {
    updateMapActivities();
  }
}

function onThemeChange() {
  redrawMapOnThemeChange(map, function() {
    updateMapActivities();
    updateProvinceFill();
    addTileVendorControl(map, 'map', onHomeTileSwitch);
  });
}

function initHomePage() {
  // 从 URL 参数恢复筛选状态
  var params = getUrlParams();
  if (params.year) currentFilter = params.year;
  if (params.city) currentCity = params.city;
  if (params.sport) currentSport = params.sport;

  // 初始化 UI
  renderYearFilters();
  renderStats();

  // 如果有城市或运动类型筛选，应用筛选
  if (currentCity || currentSport) {
    applyFilters();
  } else {
    renderActivitiesTable();
  }
  
  // 初始化地图
  if (typeof mapboxgl !== 'undefined') {
    try {
      console.log('Initializing map...');
      initMap();
    } catch (error) {
      console.error('Error initializing map:', error);
      document.getElementById('map').innerHTML = 
        '<div class="map-placeholder" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--color-hr);">地图加载失败，请刷新重试</div>';
    }
  } else {
    console.warn('mapboxgl 未加载，地图功能不可用');
    document.getElementById('map').innerHTML = 
      '<div class="map-placeholder" style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--color-hr);">地图服务不可用（需要网络连接）</div>';
  }
  
  // 监听主题变化事件
  document.addEventListener('themeChanged', onThemeChange);
}

window.clearFilter = clearFilter;

// 浏览器前进/后退时恢复筛选状态
window.addEventListener('popstate', function() {
  var params = getUrlParams();
  currentFilter = params.year || 'Total';
  currentCity = params.city || null;
  currentSport = params.sport || null;
  selectedActivity = null;
  if (routeAnimator) { routeAnimator.stop(); routeAnimator = null; }
  if (currentCity || currentSport) {
    applyFilters();
  } else {
    renderYearFilters();
    renderStats();
    renderActivitiesTable();
    if (map && map.loaded()) {
      updateMapActivities();
    }
  }
});
