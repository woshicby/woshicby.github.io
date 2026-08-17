/**
 * 运动页面共享代码(域公共)
 *
 * 职责: 所有运动页面(sports-home/sports-active/sports-volume/sports-activity)
 *       共用的数据加载、格式化、地图绘制、坐标转换逻辑。
 *
 * 依赖: sports-config.js(配置常量)先于本文件加载。
 */

// ============ 共享代码（所有页面使用） ============

// 全局活动数据(由 init() 从 sports-activities.json 加载,供各页面共享)
let activities = [];

/**
 * 页面类型检测(根据 URL 路径判断当前是哪个运动子页面)
 * @returns {'home'|'active'|'volume'|'activity'} 页面类型
 */
var PAGE_TYPE = (function() {
  var path = window.location.pathname;
  if (path.indexOf('sports-active') !== -1) return 'active';
  if (path.indexOf('sports-volume') !== -1) return 'volume';
  if (path.indexOf('sports-activity') !== -1 && path.indexOf('sports-active') === -1) return 'activity';
  return 'home';
})();

// ============ 工具函数 ============

/**
 * 距离格式化: 米 → 公里(保留2位小数)
 * @param {number} meters - 距离(米)
 * @returns {string} 如 "10.53"
 */
function formatDistance(meters) {
  return (meters / 1000).toFixed(2);
}

/**
 * 配速格式化: 距离+用时 → "分:秒" 每公里配速
 * @param {number} distance - 距离(米)
 * @param {number|string} movingTime - 运动时间(秒或 "时:分:秒" 字符串)
 * @returns {string} 如 "5:30"
 */
function formatPace(distance, movingTime) {
  if (!distance || distance === 0) return '0:00';
  var totalSeconds = (typeof movingTime === 'number') ? movingTime : convertTimeToSeconds(movingTime);
  if (!totalSeconds || totalSeconds === 0) return '0:00';
  var pace = totalSeconds / (distance / 1000);
  var minutes = Math.floor(pace / 60);
  var seconds = Math.floor(pace % 60);
  return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
}

/**
 * 时间字符串 → 总秒数
 * 支持 "时:分:秒"、"分:秒"、"秒" 三种格式
 * @param {string} timeStr - 时间字符串
 * @returns {number} 总秒数
 */
function convertTimeToSeconds(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return parts[0] || 0;
}

/**
 * 时长格式化: 总秒数 → "时:分:秒" 或 "分:秒"
 * @param {number} totalSeconds - 总秒数
 * @returns {string} 如 "1:05:30" 或 "5:30"
 */
function formatDuration(totalSeconds) {
  if (!totalSeconds) return '0:00';
  var h = Math.floor(totalSeconds / 3600);
  var m = Math.floor((totalSeconds % 3600) / 60);
  var s = Math.floor(totalSeconds % 60);
  if (h > 0) return h + ':' + ('0'+m).slice(-2) + ':' + ('0'+s).slice(-2);
  return m + ':' + ('0'+s).slice(-2);
}

/**
 * 提取日期字符串的年份
 * @param {string} dateStr - 日期字符串(如 "2026-08-17T10:00:00")
 * @returns {string} 年份(如 "2026")
 */
function extractYear(dateStr) {
  return dateStr ? dateStr.substring(0, 4) : '';
}

/**
 * 年份筛选: 判断活动是否属于指定年份
 * @param {Object} activity - 活动对象
 * @param {string} year - 年份或 'Total'(全部)
 * @returns {boolean} 是否匹配
 */
function filterYearRuns(activity, year) {
  if (year === 'Total') return true;
  return extractYear(activity.start_date_local) === year;
}

/**
 * 日期排序比较器(新→旧)
 * 将 "YYYY-MM-DD HH:mm:ss" 转换为可比较的时间戳
 * @param {Object} a - 活动A
 * @param {Object} b - 活动B
 * @returns {number} 排序结果
 */
function sortDateFunc(a, b) {
  return new Date(b.start_date_local.replace(' ', 'T')) -
         new Date(a.start_date_local.replace(' ', 'T'));
}

// ============ 连续运动天数 ============

/**
 * 计算连续运动天数(最长连续打卡天数)
 * 按日期去重排序后,统计最长连续日期间隔为1天的序列长度
 * @param {Array} filteredActivities - 已筛选的活动数组
 * @returns {number} 最长连续天数
 */
function calcStreak(filteredActivities) {
  if (filteredActivities.length === 0) return 0;
  // 收集所有运动日期(去重)
  var dates = [];
  filteredActivities.forEach(function(a) {
    var d = a.start_date_local ? a.start_date_local.substring(0, 10) : '';
    if (d && dates.indexOf(d) === -1) dates.push(d);
  });
  dates.sort();
  // 遍历日期,统计连续序列长度
  var maxStreak = 1, streak = 1;
  for (var i = 1; i < dates.length; i++) {
    var prev = new Date(dates[i - 1]);
    var curr = new Date(dates[i]);
    var diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      streak++;
      if (streak > maxStreak) maxStreak = streak;
    } else {
      streak = 1;
    }
  }
  return maxStreak;
}

// ============ 主题 ============

/**
 * 判断当前是否为深色主题
 * 优先读取 data-theme 属性,其次 localStorage 偏好,最后默认深色
 * @returns {boolean} 是否深色主题
 */
function isDarkTheme() {
  var dataTheme = document.documentElement.getAttribute('data-theme');
  var savedTheme = localStorage.getItem('theme');
  return dataTheme === 'dark' || (!dataTheme && savedTheme === 'dark') || (!dataTheme && !savedTheme);
}

/**
 * 主题切换时重绘地图的通用逻辑
 * 保存地图状态 → 设置新样式 → styledata 后恢复状态并执行回调
 * @param {Object} mapInstance - mapboxgl.Map 实例
 * @param {Function} onRedraw - 样式加载完成后的重绘回调
 */
function redrawMapOnThemeChange(mapInstance, onRedraw) {
  if (!mapInstance) return;
  var center = mapInstance.getCenter();
  var zoom = mapInstance.getZoom();
  var bearing = mapInstance.getBearing();
  var pitch = mapInstance.getPitch();
  mapInstance.setStyle(getCurrentMapStyle());
  mapInstance.once('styledata', function() {
    mapInstance.setCenter(center);
    mapInstance.setZoom(zoom);
    if (bearing) mapInstance.setBearing(bearing);
    if (pitch) mapInstance.setPitch(pitch);
    if (typeof onRedraw === 'function') onRedraw();
  });
}

/**
 * 获取当前主题的图表/地图颜色(从 CSS 变量读取)
 * 返回各颜色供图表渲染使用,带默认值兜底
 * @returns {Object} 颜色集合 {bg, brand, track, special, text, dim, ...}
 */
function getThemeColors() {
  var style = getComputedStyle(document.documentElement);
  return {
    bg: style.getPropertyValue('--background-color').trim() || '#1a252f',
    brand: style.getPropertyValue('--primary-color').trim() || '#3498db',
    track: style.getPropertyValue('--sports-active-cell').trim() || '#4dd2ff',
    special: style.getPropertyValue('--sports-special-color').trim() || '#f7d02c',
    special2: style.getPropertyValue('--sports-special-color2').trim() || '#f56c6c',
    text: style.getPropertyValue('--text-color').trim() || '#ecf0f1',
    chartText: style.getPropertyValue('--sports-run-date').trim() || '#d4d4d4',
    dim: style.getPropertyValue('--sports-dim').trim() || '#888888',
    empty: style.getPropertyValue('--sports-empty').trim() || '#333333',
    onBrand: '#ffffff',
  };
}

/**
 * 获取所有运动类型(去重排序)
 * @returns {string[]} 运动类型数组(如 ['跑步','骑行','攀岩'])
 */
function getSportTypes() {
  var types = new Set();
  activities.forEach(function(a) {
    if (a.type) types.add(a.type);
  });
  return Array.from(types).sort();
}

/**
 * 运动类型显示名(英文类型 → 中文显示)
 * 新数据 type 已是中文直接返回;兼容旧英文 type
 * @param {string} type - 运动类型标识
 * @returns {string} 中文显示名
 */
function typeDisplay(type) {
  // 新数据 type 已是中文，直接返回
  // 兼容旧英文 type
  var map = {
    'Run': '跑步', 'running': '跑步',
    'hiking': '徒步', 'walking': '步行',
    'cycling': '骑行', 'boating': '划船',
    'Ride': '骑行', 'Hike': '徒步', 'Walk': '步行',
    'Swim': '游泳', 'Swimming': '游泳',
    'treadmill_running': '跑步机', 'elliptical': '椭圆机',
    'strength_training': '力量训练', 'yoga': '瑜伽',
    'generic': '其他', 'fitness_equipment': '健身',
    'training': '训练', 'cross_training': '交叉训练',
    'stand_up_paddleboarding': '桨板', 'rowing': '划船',
    'mountaineering': '登山', 'snowshoeing': '雪鞋',
    'snowboarding': '单板滑雪', 'alpine_skiing': '高山滑雪',
    'cross_country_skiing': '越野滑雪',
    'treadmill': '跑步机', 'trail': '越野跑',
    'road': '公路骑行', 'mountain': '山地骑行',
    'indoor_cycling': '室内骑行', 'spin': '动感单车',
    'commuting': '通勤骑行', 'cardio_training': '有氧训练',
    'pilates': '普拉提', 'stair_climbing': '爬楼梯',
    'indoor_rowing': '室内划船', 'indoor_rower': '室内划船',
    'indoor_skiing': '室内滑雪', 'lap_swimming': '泳池游泳',
    'open_water': '公开水域游泳', 'indoor_running': '室内跑步',
    'indoor_walking': '室内步行', 'casual_walking': '休闲走',
    'speed_walking': '健走', 'bouldering': '抱石',
    'indoor_climbing': '室内攀岩', 'rock_climbing': '攀岩',
    'breathing': '呼吸训练', 'flexibility_training': '柔韧训练',
  };
  return map[type] || type;
}

// ============ 悬停提示框 ============

// 全局悬停提示框元素(懒创建,单例)
var hoverTooltip = null;

/**
 * 获取或创建悬停提示框元素
 * 首次调用时创建 .hover-tooltip 元素并挂到 body
 * @returns {HTMLElement} 提示框元素
 */
function getOrCreateTooltip() {
  if (!hoverTooltip) {
    hoverTooltip = document.createElement('div');
    hoverTooltip.className = 'hover-tooltip';
    document.body.appendChild(hoverTooltip);
  }
  return hoverTooltip;
}

/**
 * 显示某天的运动悬停提示
 * 汇总当天所有活动: 次数/总距离/总时长,并逐条列出
 * @param {HTMLElement} el - 触发悬停的元素(热力图格子等)
 * @param {string} dateStr - 日期字符串(YYYY-MM-DD)
 */
function showTooltip(el, dateStr) {
  var tip = getOrCreateTooltip();
  // 筛选出当天的所有活动
  var dayActivities = activities.filter(function(a) { return a.start_date_local.substring(0,10) === dateStr; });

  // 提示框头部: 日期
  var html = '<div class="ht-date">' + dateStr + '</div>';
  if (dayActivities.length === 0) {
    // 当天无运动
    html += '<div class="ht-empty">无运动记录</div>';
  } else {
    // 汇总: 次数 / 总距离 / 总时长
    var totalDist = dayActivities.reduce(function(s,a){ return s + (a.distance||0); }, 0);
    var totalTime = dayActivities.reduce(function(s,a){ return s + convertTimeToSeconds(a.moving_time); }, 0);
    html += '<div class="ht-summary">' + dayActivities.length + ' 次运动 · ' + (totalDist/1000).toFixed(1) + ' 公里 · ' + formatDuration(totalTime) + '</div>';
    dayActivities.forEach(function(a) {
      html += '<div class="ht-activity">';
      html += '<span class="ht-type">' + typeDisplay(a.type || 'Run') + '</span>';
      html += '<span class="ht-dist">' + (a.distance/1000).toFixed(2) + ' 公里</span>';
      if (a.moving_time) html += '<span class="ht-time">' + a.moving_time + '</span>';
      html += '</div>';
    });
  }

  tip.innerHTML = html;
  tip.style.display = 'block';
  positionTooltip(el, tip);
}

/**
 * 隐藏悬停提示框
 */
function hideTooltip() {
  var tip = getOrCreateTooltip();
  tip.style.display = 'none';
}

/**
 * 定位提示框位置(悬停元素上方居中,自动防越界翻转)
 * @param {HTMLElement} el - 触发元素
 * @param {HTMLElement} tip - 提示框元素
 */
function positionTooltip(el, tip) {
  var rect = el.getBoundingClientRect();
  var tipRect = tip.getBoundingClientRect();
  // 默认: 元素上方水平居中
  var x = rect.left + rect.width / 2 - tipRect.width / 2;
  var y = rect.top - tipRect.height - 8;

  // 防越界: 左右超出视口时收拢
  if (x < 4) x = 4;
  if (x + tipRect.width > window.innerWidth - 4) x = window.innerWidth - tipRect.width - 4;
  // 上方空间不足时翻转到元素下方
  if (y < 4) y = rect.bottom + 8;

  tip.style.left = x + 'px';
  tip.style.top = y + 'px';
}

// ============ 地图共享函数 ============

/**
 * GCJ-02 坐标转换对象(WGS-84 → GCJ-02)
 * 中国地图坐标偏移修正: 高德等瓦片用 GCJ-02,而运动轨迹是 WGS-84,需要转换
 */
var GCJ_TRANSFORM = {
  // 地球长半轴(米)
  _a: 6378245.0,
  // 地球偏心率平方
  _ee: 0.00669342162296594323,
  // 粗略判断坐标是否在中国境内(经纬度范围)
  _inChina: function(lat, lon) {
    return lat > 0.8293 && lat < 55.8271 && lon > 72.004 && lon < 137.8347;
  },
  // 纬度偏移量计算(基于 GCJ-02 官方算法)
  _transformLat: function(x, y) {
    var ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0;
    return ret;
  },
  // 经度偏移量计算
  _transformLon: function(x, y) {
    var ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x));
    ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0;
    ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0;
    ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0;
    return ret;
  },
  /**
   * WGS-84 → GCJ-02 坐标转换
   * @param {number} lat - 纬度
   * @param {number} lon - 经度
   * @returns {[number, number]} 转换后的 [纬度, 经度]; 中国境外坐标原样返回
   */
  wgs84ToGcj02: function(lat, lon) {
    // 境外坐标无需偏移
    if (!this._inChina(lat, lon)) return [lat, lon];
    // 计算纬度/经度偏移量
    var dLat = this._transformLat(lon - 105.0, lat - 35.0);
    var dLon = this._transformLon(lon - 105.0, lat - 35.0);
    // 弧度转换与偏移修正
    var radLat = lat / 180.0 * Math.PI;
    var magic = Math.sin(radLat);
    magic = 1 - this._ee * magic * magic;
    var sqrtMagic = Math.sqrt(magic);
    dLat = (dLat * 180.0) / ((this._a * (1 - this._ee)) / (magic * sqrtMagic) * Math.PI);
    dLon = (dLon * 180.0) / (this._a / sqrtMagic * Math.cos(radLat) * Math.PI);
    return [lat + dLat, lon + dLon];
  }
};

/**
 * Google Polyline 编码解码器
 * 将编码字符串解码为坐标数组(用于地图轨迹绘制)
 * @param {string} encoded - polyline 编码字符串
 * @returns {Array<[number, number]>} 坐标数组 [纬度, 经度]
 */
function decodePolyline(encoded) {
  var index = 0,
      lat = 0,
      lng = 0,
      coordinates = [],
      shift = 0,
      result = 0,
      byte = null,
      latitude_change,
      longitude_change,
      factor = 1e5;

  while (index < encoded.length) {
    byte = null;
    shift = 0;
    result = 0;

    // 解码第一个数值(纬度差值, 5位一组可变长编码)
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    // 符号还原(奇数取反)
    latitude_change = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));
    shift = result = 0;

    // 解码第二个数值(经度差值)
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    longitude_change = ((result & 1) !== 0 ? ~(result >> 1) : (result >> 1));

    // 累加差值得到绝对坐标
    lat += latitude_change;
    lng += longitude_change;

    // 除以精度因子还原真实坐标
    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
}

/**
 * 获取当前主题对应的地图样式
 * 根据当前瓦片供应商 + 日/夜主题返回样式 URL 或样式对象
 * @returns {string|Object} 地图样式
 */
function getCurrentMapStyle() {
  var isDark = isDarkTheme();
  var vendor = MAP_TILE_STYLES[currentTileVendor];
  if (!vendor) vendor = MAP_TILE_STYLES.carto;
  return isDark ? vendor.dark : vendor.light;
}

/**
 * 根据活动数据生成地图路径坐标(含 GCJ-02 转换)
 * 需要偏移的活动(高德瓦片/特定历史活动)做坐标转换
 * @param {Object} activity - 活动对象(含 summary_polyline)
 * @returns {Array<[number, number]>} 地图坐标数组 [经度, 纬度]
 */
function pathForActivity(activity) {
  if (!activity.summary_polyline) return [];
  try {
    var decoded = decodePolyline(activity.summary_polyline);
    // 判断是否需要 GCJ-02 转换: 高德瓦片 或 列表中的历史活动
    var needGcj02 = GCJ02_VENDORS.has(currentTileVendor) ||
                    GCJ02_ACTIVITIES.has(Number(activity.run_id));
    return decoded.map(function(coord) {
      var lat = coord[0], lon = coord[1];
      if (needGcj02) {
        var converted = GCJ_TRANSFORM.wgs84ToGcj02(lat, lon);
        lat = converted[0]; lon = converted[1];
      }
      return [lon, lat];
    });
  } catch (e) {
    console.error('Error decoding polyline:', e);
    return [];
  }
}

/**
 * 添加瓦片供应商切换控件(地图右上角按钮组)
 * @param {Object} mapInstance - mapboxgl.Map 实例
 * @param {string} containerId - 地图容器的 DOM id
 * @param {Function} onSwitch - 切换瓦片后的回调(重绘页面特定图层)
 */
function addTileVendorControl(mapInstance, containerId, onSwitch) {
  var mapContainer = document.getElementById(containerId);
  if (!mapContainer) return;

  // 移除旧控件(避免重复添加)
  var old = document.getElementById('tile-vendor-control');
  if (old) old.remove();

  // 创建控件容器
  var control = document.createElement('div');
  control.id = 'tile-vendor-control';
  control.className = 'tile-vendor-control';

  // 为每个供应商生成切换按钮
  var vendorKeys = Object.keys(MAP_TILE_STYLES);
  vendorKeys.forEach(function(key) {
    var btn = document.createElement('button');
    btn.className = 'tile-vendor-btn' + (key === currentTileVendor ? ' active' : '');
    btn.textContent = MAP_TILE_STYLES[key].name;
    btn.setAttribute('data-vendor', key);
    btn.addEventListener('click', function() {
      switchTileVendor(key, mapInstance, containerId, onSwitch);
    });
    control.appendChild(btn);
  });

  mapContainer.appendChild(control);
}

/**
 * 切换瓦片供应商
 * 保存地图视口状态 → 更换样式 → styledata 后恢复视口并执行回调
 * @param {string} vendor - 目标供应商 key
 * @param {Object} mapInstance - mapboxgl.Map 实例
 * @param {string} containerId - 地图容器 id
 * @param {Function} onSwitch - 切换完成回调
 */
function switchTileVendor(vendor, mapInstance, containerId, onSwitch) {
  // 已在该供应商则跳过
  if (vendor === currentTileVendor) return;
  currentTileVendor = vendor;

  // 更新按钮高亮状态
  document.querySelectorAll('.tile-vendor-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-vendor') === vendor);
  });

  if (mapInstance) {
    // 保存当前视口状态
    var center = mapInstance.getCenter();
    var zoom = mapInstance.getZoom();
    var bearing = mapInstance.getBearing();
    var pitch = mapInstance.getPitch();

    // 更换地图样式
    mapInstance.setStyle(getCurrentMapStyle());
    // 样式加载完成后恢复视口并重绘
    mapInstance.once('styledata', function() {
      mapInstance.setCenter(center);
      mapInstance.setZoom(zoom);
      if (bearing) mapInstance.setBearing(bearing);
      if (pitch) mapInstance.setPitch(pitch);
      if (typeof onSwitch === 'function') onSwitch();
      // 重建控件(样式重置后 DOM 可能被清除)
      addTileVendorControl(mapInstance, containerId, onSwitch);
    });
  }
}

// ============ 初始化入口 ============

/**
 * 初始化运动应用
 * 加载活动数据 → 根据页面类型调用对应的页面初始化函数
 */
async function init() {
  console.log('Initializing sports app...');

  // 加载活动数据
  try {
    const response = await fetch('./JSON/sports-activities.json');
    activities = await response.json();
    console.log('Activities loaded:', activities.length);
  } catch (error) {
    console.error('Error loading activities:', error);
    activities = [];
  }

  // 根据页面类型调用对应的初始化函数(各页面脚本定义)
  if (PAGE_TYPE === 'home' && typeof initHomePage === 'function') {
    initHomePage();
  } else if (PAGE_TYPE === 'active' && typeof initActivePage === 'function') {
    initActivePage();
  } else if (PAGE_TYPE === 'volume' && typeof initVolumePage === 'function') {
    initVolumePage();
  } else if (PAGE_TYPE === 'activity' && typeof initActivityPage === 'function') {
    initActivityPage();
  }
}

// DOM 就绪后初始化
document.addEventListener('DOMContentLoaded', init);
