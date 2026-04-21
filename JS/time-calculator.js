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

function setInputValues(prefix, values) {
    document.getElementById(`${prefix}Year`).value = values.year || '';
    document.getElementById(`${prefix}Month`).value = values.month || '';
    document.getElementById(`${prefix}Day`).value = values.day || '';
    document.getElementById(`${prefix}Hour`).value = values.hour || '';
    document.getElementById(`${prefix}Minute`).value = values.minute || '';
    document.getElementById(`${prefix}Second`).value = values.second || '';
}

function swapTimes() {
    const start = getRawInputValues('start');
    const end = getRawInputValues('end');
    setInputValues('start', end);
    setInputValues('end', start);
}

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

function clearAll() {
    setInputValues('start', {});
    setInputValues('end', {});
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
}

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
            <div class="unit-value">${formatNumber(unit.value)}</div>
        </div>
    `).join('');

    document.getElementById('resultSection').style.display = 'block';
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function formatNumber(num) {
    if (Number.isInteger(num)) return num.toLocaleString();
    if (num >= 1000) return num.toLocaleString(undefined, { maximumFractionDigits: 2 });
    if (num >= 1) return num.toFixed(4);
    return num.toFixed(6);
}

function isValidDate(year, month, day) {
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year &&
           date.getMonth() === month - 1 &&
           date.getDate() === day;
}

function showError(message) {
    const errorEl = document.getElementById('errorMessage');
    errorEl.textContent = message;
    errorEl.style.display = 'block';
    document.getElementById('resultSection').style.display = 'none';
}

function hideError() {
    document.getElementById('errorMessage').style.display = 'none';
}
