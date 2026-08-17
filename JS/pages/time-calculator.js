/**
 * 时间计算器页面脚本
 * 对应页面: time-calculator.html
 * 功能: 计算两个时间点之间的间隔(年/月/日/时/分/秒),支持交换/当前时间/清空。
 */

/**
 * 显示错误提示并隐藏结果区
 * @param {string} message - 错误信息
 */
function showError(message) {
   const errorEl = document.getElementById('errorMessage');
   errorEl.textContent = message;
   errorEl.style.display = 'block';
   document.getElementById('resultSection').style.display = 'none';
}

/**
 * 隐藏错误提示
 */
function hideError() {
   document.getElementById('errorMessage').style.display = 'none';
}

document.addEventListener('DOMContentLoaded', () => {
   document.getElementById('calculate').addEventListener('click', calculate);
   document.getElementById('swapTimes').addEventListener('click', swapTimes);
   document.getElementById('setNow').addEventListener('click', setNow);
   document.getElementById('clearAll').addEventListener('click', clearAll);

   document.querySelectorAll('.input-field input').forEach(input => {
       input.addEventListener('keypress', (e) => {
           if (e.key === 'Enter') calculate();
       });
   });
});

/**
 * 读取一组时间输入框的值
 * @param {string} prefix - 输入组前缀(start/end)
 * @returns {Object} 各字段值 {year, month, day, hour, minute, second}
 */
function getRawInputValues(prefix) {
   return {
       year: document.getElementById(`${prefix}Year`).value.trim(),
       month: document.getElementById(`${prefix}Month`).value.trim(),
       day: document.getElementById(`${prefix}Day`).value.trim(),
       hour: document.getElementById(`${prefix}Hour`).value.trim(),
       minute: document.getElementById(`${prefix}Minute`).value.trim(),
       second: document.getElementById(`${prefix}Second`).value.trim()
   };
}

/**
 * 设置一组时间输入框的值
 * @param {string} prefix - 输入组前缀(start/end)
 * @param {Object} values - 各字段值
 */
function setInputValues(prefix, values) {
   document.getElementById(`${prefix}Year`).value = values.year || '';
   document.getElementById(`${prefix}Month`).value = values.month || '';
   document.getElementById(`${prefix}Day`).value = values.day || '';
   document.getElementById(`${prefix}Hour`).value = values.hour || '';
   document.getElementById(`${prefix}Minute`).value = values.minute || '';
   document.getElementById(`${prefix}Second`).value = values.second || '';
}

/**
 * 交换开始和结束时间
 */
function swapTimes() {
   const start = getRawInputValues('start');
   const end = getRawInputValues('end');
   setInputValues('start', end);
   setInputValues('end', start);
}

/**
 * 设置开始/结束时间为当前时间
 * 根据焦点所在输入组决定设置哪一组
 */
function setNow() {
   const now = new Date();
   const values = {
       year: String(now.getFullYear()),
       month: String(now.getMonth() + 1),
       day: String(now.getDate()),
       hour: String(now.getHours()),
       minute: String(now.getMinutes()),
       second: String(now.getSeconds())
   };

   const activeElement = document.activeElement;
   const startInputs = document.querySelectorAll('.time-input-group:first-of-type input');
   const endInputs = document.querySelectorAll('.time-input-group:last-of-type input');
   const isEndFocused = Array.from(endInputs).includes(activeElement);

   if (isEndFocused) {
       setInputValues('end', values);
   } else {
       setInputValues('start', values);
   }
}

/**
 * 清空所有输入和结果
 */
function clearAll() {
   setInputValues('start', {});
   setInputValues('end', {});
   document.getElementById('resultSection').style.display = 'none';
   document.getElementById('errorMessage').style.display = 'none';
}

/**
 * 计算时间间隔
 * 读取开始/结束时间,校验后计算差值并显示结果
 */
function calculate() {
   const startRaw = getRawInputValues('start');
   const endRaw = getRawInputValues('end');

   const startHasInput = Object.values(startRaw).some(v => v !== '');
   const endHasInput = Object.values(endRaw).some(v => v !== '');

   if (!startHasInput && !endHasInput) {
       showError('请输入至少一个时间点的日期');
       return;
   }

   const defaults = { year: 0, month: 1, day: 1, hour: 0, minute: 0, second: 0 };
   const start = {};
   const end = {};

   for (const key of ['year', 'month', 'day', 'hour', 'minute', 'second']) {
       const startVal = startRaw[key];
       const endVal = endRaw[key];

       if (startVal !== '' && endVal !== '') {
           start[key] = parseInt(startVal);
           end[key] = parseInt(endVal);
       } else if (startVal !== '') {
           start[key] = parseInt(startVal);
           end[key] = parseInt(startVal);
       } else if (endVal !== '') {
           start[key] = parseInt(endVal);
           end[key] = parseInt(endVal);
       } else {
           start[key] = defaults[key];
           end[key] = defaults[key];
       }
   }

   if (isNaN(start.year) || isNaN(end.year)) {
       showError('年份输入无效');
       return;
   }
   if (start.month < 1 || start.month > 12 || end.month < 1 || end.month > 12) {
       showError('月份应在1-12之间');
       return;
   }
   if (start.day < 1 || end.day < 1) {
       showError('日期应大于0');
       return;
   }
   if (!isValidDate(start.year, start.month, start.day)) {
       showError(`${start.month}月没有${start.day}日，请检查开始时间日期`);
       return;
   }
   if (!isValidDate(end.year, end.month, end.day)) {
       showError(`${end.month}月没有${end.day}日，请检查结束时间日期`);
       return;
   }

   const startDate = new Date(start.year, start.month - 1, start.day, start.hour, start.minute, start.second);
   const endDate = new Date(end.year, end.month - 1, end.day, end.hour, end.minute, end.second);

   if (isNaN(startDate.getTime())) {
       showError('开始时间无效，请检查输入');
       return;
   }
   if (isNaN(endDate.getTime())) {
       showError('结束时间无效，请检查输入');
       return;
   }

   hideError();

   const diffMs = endDate.getTime() - startDate.getTime();
   const absDiffMs = Math.abs(diffMs);
   const isNegative = diffMs < 0;

   const totalSeconds = absDiffMs / 1000;
   const totalMinutes = totalSeconds / 60;
   const totalHours = totalMinutes / 60;
   const totalDays = totalHours / 24;
   const totalWeeks = totalDays / 7;

   const earlier = isNegative ? end : start;
   const later = isNegative ? start : end;

   let years = later.year - earlier.year;
   let months = later.month - earlier.month;
   let days = later.day - earlier.day;
   let hours = later.hour - earlier.hour;
   let minutes = later.minute - earlier.minute;
   let seconds = later.second - earlier.second;

   if (seconds < 0) {
       seconds += 60;
       minutes--;
   }
   if (minutes < 0) {
       minutes += 60;
       hours--;
   }
   if (hours < 0) {
       hours += 24;
       days--;
   }
   if (days < 0) {
       const prevMonth = new Date(later.year, later.month - 1, 0);
       days += prevMonth.getDate();
       months--;
   }
   if (months < 0) {
       months += 12;
       years--;
   }

   const combinedParts = [];
   if (years > 0) combinedParts.push(`${years}年`);
   if (months > 0) combinedParts.push(`${months}个月`);
   if (days > 0) combinedParts.push(`${days}天`);
   if (hours > 0) combinedParts.push(`${hours}小时`);
   if (minutes > 0) combinedParts.push(`${minutes}分钟`);
   if (seconds > 0 || combinedParts.length === 0) combinedParts.push(`${seconds}秒`);

   const combinedText = (isNegative ? '（结束时间早于开始时间）' : '') + combinedParts.join('');

   document.getElementById('combinedResult').textContent = combinedText;

   const avgDaysPerMonth = 365.2425 / 12;
   const avgDaysPerYear = 365.2425;
   const totalMonthsDecimal = totalDays / avgDaysPerMonth;
   const totalYearsDecimal = totalDays / avgDaysPerYear;

   const units = [
       { label: '年', value: totalYearsDecimal },
       { label: '月', value: totalMonthsDecimal },
       { label: '周', value: totalWeeks },
       { label: '天', value: totalDays },
       { label: '小时', value: totalHours },
       { label: '分钟', value: totalMinutes },
       { label: '秒', value: totalSeconds }
   ];

   const unitResults = document.getElementById('unitResults');
   unitResults.innerHTML = units.map(unit => `
       <div class="unit-item">
           <div class="unit-label">${unit.label}</div>
           <div class="unit-value">${formatLargeNumber(unit.value)}</div>
       </div>
   `).join('');

   document.getElementById('resultSection').style.display = 'block';
   document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * 格式化大数字(千分位/小数位数智能处理)
 * @param {number} num - 数字
 * @returns {string}
 */
function formatLargeNumber(num) {
   if (Number.isInteger(num)) return num.toLocaleString();
   if (num >= 1000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
   if (num >= 1) return num.toFixed(4);
   return num.toFixed(6);
}

/**
 * 校验日期是否有效
 * @param {Object} date - 日期对象 {year, month, day}
 * @returns {boolean}
 */
function isValidDate(year, month, day) {
   const date = new Date(year, month - 1, day);
   return date.getFullYear() === year &&
          date.getMonth() === month - 1 &&
          date.getDate() === day;
}

// ============ 对轨计算 ============

var syncItemId = 0;

/**
 * 解析时间字符串
 * @param {string} str - 时间字符串
 * @returns {Object} 解析结果
 */
function parseTimeStr(str) {
   str = str.trim();
   // 支持 H:MM:SS, HH:MM:SS, MM:SS, M:SS 等格式
   var parts = str.split(':').map(Number);
   if (parts.some(isNaN)) return null;
   if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
   if (parts.length === 2) return parts[0] * 60 + parts[1];
   if (parts.length === 1) return parts[0];
   return null;
}

/**
 * 秒数格式化为时间文本
 * @param {number} sec - 总秒数
 * @returns {string}
 */
function formatTimeFromSec(totalSec) {
   var isNeg = totalSec < 0;
   var abs = Math.abs(Math.round(totalSec));
   var h = Math.floor(abs / 3600);
   var m = Math.floor((abs % 3600) / 60);
   var s = abs % 60;
   var str = (h < 10 ? '0' : '') + h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
   return isNeg ? '-' + str : str;
}

/**
 * 添加同步条目(批量时间换算)
 */
function addSyncItem() {
   syncItemId++;
   var id = syncItemId;
   var list = document.getElementById('syncList');
   var item = document.createElement('div');
   item.className = 'sync-item';
   item.setAttribute('data-id', id);
   item.innerHTML =
       '<input type="text" class="sync-real-input" placeholder="实际时间 如 07:21:06" autocomplete="off">' +
       '<span class="sync-arrow">→</span>' +
       '<span class="sync-timeline-result">--:--:--</span>' +
       '<button class="sync-remove-btn" title="删除">✕</button>';

   item.querySelector('.sync-real-input').addEventListener('input', function() { calcSyncItem(item); });
   item.querySelector('.sync-remove-btn').addEventListener('click', function() { item.remove(); });

   list.appendChild(item);
   item.querySelector('.sync-real-input').focus();
}

/**
 * 计算单个同步条目
 * @param {Object} item - 条目
 */
function calcSyncItem(item) {
   var refReal = parseTimeStr(document.getElementById('syncRefReal').value);
   var refTimeline = parseTimeStr(document.getElementById('syncRefTimeline').value);
   var realInput = item.querySelector('.sync-real-input');
   var resultSpan = item.querySelector('.sync-timeline-result');
   var videoReal = parseTimeStr(realInput.value);

   if (refReal === null || refTimeline === null || videoReal === null) {
       resultSpan.textContent = '--:--:--';
       resultSpan.classList.remove('sync-neg');
       return;
   }

   var offset = videoReal - refReal;
   var timelinePos = refTimeline + offset;
   resultSpan.textContent = formatTimeFromSec(timelinePos);
   resultSpan.classList.toggle('sync-neg', timelinePos < 0);
}

/**
 * 计算所有同步条目
 */
function calcAllSync() {
   document.querySelectorAll('.sync-item').forEach(calcSyncItem);
}

// 从文件名解析日期时间
// 支持: VID_20260627_074624_00_014.mp4, DJI_20260621060958_0001_D.MP4 等
function parseFilenameDateTime(filename) {
   // 匹配 YYYYMMDD_HHMMSS 或 YYYYMMDDHHMMSS
   var m = filename.match(/(\d{4})(\d{2})(\d{2})_?(\d{2})(\d{2})(\d{2})/);
   if (!m) return null;
   var h = parseInt(m[4], 10);
   var mi = parseInt(m[5], 10);
   var s = parseInt(m[6], 10);
   if (h > 23 || mi > 59 || s > 59) return null;
   return m[4] + ':' + m[5] + ':' + m[6];
}

/**
 * 批量导入同步条目
 */
function batchImport() {
   var text = document.getElementById('syncBatchInput').value;
   var lines = text.split('\n').map(function(l) { return l.trim(); }).filter(function(l) { return l.length > 0; });
   var imported = 0;
   var failed = [];

   for (var i = 0; i < lines.length; i++) {
       var time = parseFilenameDateTime(lines[i]);
       if (time) {
           addSyncItem();
           var items = document.querySelectorAll('.sync-item');
           var lastItem = items[items.length - 1];
           lastItem.querySelector('.sync-real-input').value = time;
           calcSyncItem(lastItem);
           imported++;
       } else {
           failed.push(lines[i]);
       }
   }

   // 显示解析失败的文件名
   var errorDiv = document.getElementById('syncError');
   if (failed.length > 0) {
       errorDiv.textContent = '未能解析的文件名(' + failed.length + '个)：' + failed.join('、');
       errorDiv.style.display = 'block';
   } else {
       errorDiv.style.display = 'none';
   }

   if (imported > 0) {
       document.getElementById('syncBatchInput').value = '';
       document.getElementById('syncBatchArea').style.display = 'none';
   }
}

document.addEventListener('DOMContentLoaded', function() {
   document.getElementById('syncAddBtn').addEventListener('click', addSyncItem);
   document.getElementById('syncRefReal').addEventListener('input', calcAllSync);
   document.getElementById('syncRefTimeline').addEventListener('input', calcAllSync);
   document.getElementById('syncBatchBtn').addEventListener('click', function() {
       var area = document.getElementById('syncBatchArea');
       area.style.display = area.style.display === 'none' ? 'block' : 'none';
       if (area.style.display === 'block') document.getElementById('syncBatchInput').focus();
   });
   document.getElementById('syncBatchParse').addEventListener('click', batchImport);
   // 默认添加一条
   addSyncItem();
});
