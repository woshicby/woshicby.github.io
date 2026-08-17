/**
 * 随机决策器页面脚本
 * 对应页面: random-decision.html
 * 功能: 输入多个选项(每行一个),随机决策并显示动画结果;
 *       支持模板、历史记录、选项/历史/全部数据导出导入。
 */

// ============ 预设模板 ============
// 常用决策场景的选项模板(点击加载到输入框)
const templates = {
    food: ['火锅', '烧烤', '日料', '川菜', '西餐', '快餐', '自助餐', '小吃'],
    exercise: ['间歇跑', '节奏跑', '长距离跑', '力量训练', '游泳', '骑行', '瑜伽', '休息'],
    study: ['前端开发', '后端开发', '算法练习', '英语学习', '阅读书籍', '看教程视频', '做项目'],
    movie: ['科幻片', '动作片', '喜剧片', '悬疑片', '爱情片', '纪录片', '动画片', '恐怖片']
};

// ============ 全局状态 ============
// 决策历史(localStorage 持久化,最多保留 20 条)
let decisionHistory = JSON.parse(localStorage.getItem('decisionHistory')) || [];
// 动画类型: scroll(滚动)/bounce(弹跳)/none(无动画),持久化
let animationType = localStorage.getItem('animationType') || 'scroll';

/**
 * 切换动画类型
 * 读取下拉框值并保存到 localStorage
 */
function changeAnimationType() {
    animationType = document.getElementById('animationType').value;
    localStorage.setItem('animationType', animationType);
}

/**
 * 加载模板选项到输入框
 * @param {string} templateName - 模板键名(food/exercise/study/movie)
 */
function loadTemplate(templateName) {
    const template = templates[templateName];
    // 模板数组以换行写入输入框
    document.getElementById('options-input').value = template.join('\n');
}

/**
 * 添加新选项(在输入框末尾追加"新选项"并聚焦)
 */
function addOption() {
    const input = document.getElementById('options-input');
    const currentValue = input.value.trim();
    // 追加换行 + 新选项(已有内容时)
    input.value = currentValue + (currentValue ? '\n' : '') + '新选项';
    input.focus();
    // 光标移到末尾
    input.setSelectionRange(input.value.length, input.value.length);
}

/**
 * 清空所有选项
 */
function clearOptions() {
    document.getElementById('options-input').value = '';
}

/**
 * 执行随机决策(核心逻辑)
 * 校验选项 → 禁用按钮 → 无动画直接出结果 / 有动画滚动 2 秒后出结果 → 记录历史
 */
function makeDecision() {
    // 读取并拆分选项(每行一个,过滤空行)
    const input = document.getElementById('options-input').value.trim();
    const options = input.split('\n').filter(opt => opt.trim() !== '');
    
    // 至少需要 2 个选项
    if (options.length < 2) {
        alert('请至少输入2个选项！');
        return;
    }
    
    const button = document.getElementById('decision-button');
    const resultBox = document.getElementById('decision-result');
    
    // 决策中禁用按钮,防止重复点击
    button.disabled = true;
    button.textContent = '🎲 决策中...';
    
    if (animationType === 'none') {
        // 无动画模式: 直接随机出结果
        setTimeout(() => {
            const finalIndex = Math.floor(Math.random() * options.length);
            const result = options[finalIndex];
            resultBox.innerHTML = `★ ${result} ★`;
            button.disabled = false;
            button.textContent = '🎲 开始随机选择';
            addToHistory(result);
        }, 100);
    } else {
        // 动画模式: 快速轮换显示选项,持续 2 秒后停在下注结果
        let counter = 0;
        const duration = 2000;   // 动画总时长(ms)
        const interval = 100;    // 轮换间隔(ms)
        let lastIndex = -1;      // 上一个显示的选项(避免连续重复)
        
        const animation = setInterval(() => {
            // 随机选一个与上次不同的选项
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * options.length);
            } while (randomIndex === lastIndex && options.length > 1);
            lastIndex = randomIndex;
            
            // 显示带动画效果的当前选项
            resultBox.innerHTML = `<div class="animation-${animationType}">${options[randomIndex]}</div>`;
            counter += interval;
            
            // 动画结束: 确定最终结果
            if (counter >= duration) {
                clearInterval(animation);
                
                const finalIndex = Math.floor(Math.random() * options.length);
                const result = options[finalIndex];
                
                resultBox.innerHTML = `<div class="animation-${animationType}">★ ${result} ★</div>`;
                
                button.disabled = false;
                button.textContent = '🎲 开始随机选择';
                
                addToHistory(result);
            }
        }, interval);
    }
}

/**
 * 添加决策结果到历史记录(最多 20 条,localStorage 持久化)
 * @param {string} result - 决策结果文本
 */
function addToHistory(result) {
    // 格式化当前时间(zh-CN,斜杠转横杠)
    const now = new Date();
    const timeStr = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(/\//g, '-');
    
    // 新记录插入头部
    decisionHistory.unshift({ result, time: timeStr });
    
    // 只保留最近 20 条
    if (decisionHistory.length > 20) {
        decisionHistory = decisionHistory.slice(0, 20);
    }
    
    // 持久化并重新渲染
    localStorage.setItem('decisionHistory', JSON.stringify(decisionHistory));
    renderDecisionHistory();
}

/**
 * 渲染决策历史列表
 */
function renderDecisionHistory() {
    const historyDiv = document.getElementById('decision-history');
    
    // 空历史提示
    if (decisionHistory.length === 0) {
        historyDiv.innerHTML = '<div class="empty-history">暂无历史记录</div>';
        return;
    }
    
    // 逐条渲染
    historyDiv.innerHTML = decisionHistory.map(item => `
        <div class="history-item">[${item.time}] 决策结果: ${item.result}</div>
    `).join('');
}

/**
 * 清空历史记录(需确认)
 */
function clearHistory() {
    if (confirm('确定要清空所有历史记录吗？')) {
        decisionHistory = [];
        localStorage.removeItem('decisionHistory');
        renderDecisionHistory();
    }
}

/**
 * 导出当前选项为 JSON 文件
 */
function exportOptions() {
    const options = document.getElementById('options-input').value.trim();
    if (!options) {
        alert('没有可导出的选项！');
        return;
    }
    
    // 打包数据(选项 + 导出时间)
    const data = {
        options: options,
        exportDate: new Date().toISOString()
    };
    
    // 生成下载链接
    const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    // 触发下载(文件名带时间戳)
    const a = document.createElement('a');
    a.href = url;
    const now = new Date();
    const timestamp = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}${String(now.getSeconds()).padStart(2,'0')}`;
    a.download = `随机决策-选项列表_${timestamp}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

/**
 * 触发选项文件选择
 */
function importOptions() {
    document.getElementById('importOptionsFile').click();
}

/**
 * 处理选项文件导入
 * @param {Event} e - change 事件
 */
function handleOptionsImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            // 校验文件格式
            if (!data.options) {
                alert('无效的选项文件格式！');
                return;
            }
            
            document.getElementById('options-input').value = data.options;
            alert('选项导入成功！');
        } catch (error) {
            alert('选项导入失败！请确保上传的是有效的JSON文件。');
            console.error('导入错误:', error);
        }
    };
    reader.readAsText(file);
    // 重置 input 值,允许重复选择同一文件
    e.target.value = '';
}

/**
 * 导出历史记录为 JSON 文件
 */
function exportHistory() {
    if (decisionHistory.length === 0) {
        alert('没有可导出的历史记录！');
        return;
    }
    
    const data = {
        history: decisionHistory,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    const now1 = new Date();
    const timestamp1 = `${now1.getFullYear()}${String(now1.getMonth()+1).padStart(2,'0')}${String(now1.getDate()).padStart(2,'0')}.${String(now1.getHours()).padStart(2,'0')}${String(now1.getMinutes()).padStart(2,'0')}${String(now1.getSeconds()).padStart(2,'0')}`;
    a.download = `随机决策-历史记录_${timestamp1}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

/**
 * 触发历史文件选择
 */
function importHistory() {
    document.getElementById('importHistoryFile').click();
}

/**
 * 处理历史记录文件导入
 * @param {Event} e - change 事件
 */
function handleHistoryImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            // 校验格式
            if (!data.history || !Array.isArray(data.history)) {
                alert('无效的历史记录文件格式！');
                return;
            }
            
            // 覆盖导入需确认
            if (!confirm('确定要导入历史记录吗？当前历史记录将被覆盖！')) return;
            
            decisionHistory = data.history;
            localStorage.setItem('decisionHistory', JSON.stringify(decisionHistory));
            renderDecisionHistory();
            alert('历史记录导入成功！');
        } catch (error) {
            alert('历史记录导入失败！请确保上传的是有效的JSON文件。');
            console.error('导入错误:', error);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

/**
 * 重置所有随机决策器数据(需确认,不可恢复)
 */
function resetAllData() {
    if (confirm('确定要重置所有随机决策器数据吗？此操作不可恢复！')) {
        const decisionKeys = ['decisionHistory', 'animationType'];
        Object.keys(localStorage).forEach(key => {
            if (decisionKeys.includes(key)) {
                localStorage.removeItem(key);
            }
        });
        location.reload();
    }
}

/**
 * 导出全部数据(历史 + 动画类型 + 当前选项)
 */
function exportAllData() {
    const data = {};
    const decisionKeys = ['decisionHistory', 'animationType'];
    
    // 导出 localStorage 中的持久化数据
    decisionKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) {
            data[key] = value;
        }
    });
    
    // 添加当前选项
    const options = document.getElementById('options-input').value.trim();
    if (options) {
        data['currentOptions'] = options;
    }
    
    data['exportDate'] = new Date().toISOString();
    
    const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    const now2 = new Date();
    const timestamp2 = `${now2.getFullYear()}${String(now2.getMonth()+1).padStart(2,'0')}${String(now2.getDate()).padStart(2,'0')}.${String(now2.getHours()).padStart(2,'0')}${String(now2.getMinutes()).padStart(2,'0')}${String(now2.getSeconds()).padStart(2,'0')}`;
    a.download = `随机决策-全部数据_${timestamp2}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

/**
 * 触发全部数据文件选择
 */
function importAllData() {
    document.getElementById('importAllFile').click();
}

/**
 * 处理全部数据导入
 * @param {Event} e - change 事件
 */
function handleAllImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            // 覆盖导入需确认
            if (!confirm('确定要导入所有数据吗？当前随机决策器数据将被覆盖！')) return;
            
            // 恢复 localStorage 数据
            const decisionKeys = ['decisionHistory', 'animationType'];
            for (const key in data) {
                if (decisionKeys.includes(key)) {
                    localStorage.setItem(key, data[key]);
                }
            }
            
            // 恢复当前选项
            if (data['currentOptions']) {
                document.getElementById('options-input').value = data['currentOptions'];
            }
            
            alert('数据导入成功！');
            location.reload();
        } catch (error) {
            alert('数据导入失败！请确保上传的是有效的JSON文件。');
            console.error('导入错误:', error);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

// DOM 就绪后: 恢复动画类型选择 + 渲染历史 + 绑定导入事件
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('animationType').value = animationType;
    renderDecisionHistory();
    
    document.getElementById('importOptionsFile')?.addEventListener('change', handleOptionsImport);
    document.getElementById('importHistoryFile')?.addEventListener('change', handleHistoryImport);
    document.getElementById('importAllFile')?.addEventListener('change', handleAllImport);
});
