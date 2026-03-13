const templates = {
    food: ['火锅', '烧烤', '日料', '川菜', '西餐', '快餐', '自助餐', '小吃'],
    exercise: ['间歇跑', '节奏跑', '长距离跑', '力量训练', '游泳', '骑行', '瑜伽', '休息'],
    study: ['前端开发', '后端开发', '算法练习', '英语学习', '阅读书籍', '看教程视频', '做项目'],
    movie: ['科幻片', '动作片', '喜剧片', '悬疑片', '爱情片', '纪录片', '动画片', '恐怖片']
};

let decisionHistory = JSON.parse(localStorage.getItem('decisionHistory')) || [];
let animationType = localStorage.getItem('animationType') || 'scroll';

function changeAnimationType() {
    animationType = document.getElementById('animationType').value;
    localStorage.setItem('animationType', animationType);
}

function loadTemplate(templateName) {
    const template = templates[templateName];
    document.getElementById('options-input').value = template.join('\n');
}

function addOption() {
    const input = document.getElementById('options-input');
    const currentValue = input.value.trim();
    input.value = currentValue + (currentValue ? '\n' : '') + '新选项';
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
}

function clearOptions() {
    document.getElementById('options-input').value = '';
}

function makeDecision() {
    const input = document.getElementById('options-input').value.trim();
    const options = input.split('\n').filter(opt => opt.trim() !== '');
    
    if (options.length < 2) {
        alert('请至少输入2个选项！');
        return;
    }
    
    const button = document.getElementById('decision-button');
    const resultBox = document.getElementById('decision-result');
    
    button.disabled = true;
    button.textContent = '🎲 决策中...';
    
    if (animationType === 'none') {
        setTimeout(() => {
            const finalIndex = Math.floor(Math.random() * options.length);
            const result = options[finalIndex];
            resultBox.innerHTML = `★ ${result} ★`;
            button.disabled = false;
            button.textContent = '🎲 开始随机选择';
            addToHistory(result);
        }, 100);
    } else {
        let counter = 0;
        const duration = 2000;
        const interval = 100;
        let lastIndex = -1;
        
        const animation = setInterval(() => {
            let randomIndex;
            do {
                randomIndex = Math.floor(Math.random() * options.length);
            } while (randomIndex === lastIndex && options.length > 1);
            lastIndex = randomIndex;
            
            resultBox.innerHTML = `<div class="animation-${animationType}">${options[randomIndex]}</div>`;
            counter += interval;
            
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

function addToHistory(result) {
    const now = new Date();
    const timeStr = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(/\//g, '-');
    
    decisionHistory.unshift({ result, time: timeStr });
    
    if (decisionHistory.length > 20) {
        decisionHistory = decisionHistory.slice(0, 20);
    }
    
    localStorage.setItem('decisionHistory', JSON.stringify(decisionHistory));
    renderDecisionHistory();
}

function renderDecisionHistory() {
    const historyDiv = document.getElementById('decision-history');
    
    if (decisionHistory.length === 0) {
        historyDiv.innerHTML = '<div class="empty-history">暂无历史记录</div>';
        return;
    }
    
    historyDiv.innerHTML = decisionHistory.map(item => `
        <div class="history-item">[${item.time}] 决策结果: ${item.result}</div>
    `).join('');
}

function clearHistory() {
    if (confirm('确定要清空所有历史记录吗？')) {
        decisionHistory = [];
        localStorage.removeItem('decisionHistory');
        renderDecisionHistory();
    }
}

function exportOptions() {
    const options = document.getElementById('options-input').value.trim();
    if (!options) {
        alert('没有可导出的选项！');
        return;
    }
    
    const data = {
        options: options,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `decision-options_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

function importOptions() {
    document.getElementById('importOptionsFile').click();
}

function handleOptionsImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
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
    e.target.value = '';
}

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
    a.download = `decision-history_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

function importHistory() {
    document.getElementById('importHistoryFile').click();
}

function handleHistoryImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (!data.history || !Array.isArray(data.history)) {
                alert('无效的历史记录文件格式！');
                return;
            }
            
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

function exportAllData() {
    const data = {};
    const decisionKeys = ['decisionHistory', 'animationType'];
    
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
    a.download = `random-decision-all-data_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

function importAllData() {
    document.getElementById('importAllFile').click();
}

function handleAllImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (!confirm('确定要导入所有数据吗？当前随机决策器数据将被覆盖！')) return;
            
            const decisionKeys = ['decisionHistory', 'animationType'];
            for (const key in data) {
                if (decisionKeys.includes(key)) {
                    localStorage.setItem(key, data[key]);
                }
            }
            
            // 导入当前选项
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

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('animationType').value = animationType;
    renderDecisionHistory();
    
    document.getElementById('importOptionsFile')?.addEventListener('change', handleOptionsImport);
    document.getElementById('importHistoryFile')?.addEventListener('change', handleHistoryImport);
    document.getElementById('importAllFile')?.addEventListener('change', handleAllImport);
});