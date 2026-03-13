let diceHistory = JSON.parse(localStorage.getItem('diceHistory')) || [];
let animationType = localStorage.getItem('animationType') || 'scroll';
let customPresets = JSON.parse(localStorage.getItem('customPresets')) || {};

const builtInPresets = {
    'dnd-attack': {
        name: 'D&D 攻击',
        dice: [{ count: 1, sides: 20 }, { count: 1, sides: 6 }]
    },
    'dnd-damage': {
        name: 'D&D 伤害',
        dice: [{ count: 2, sides: 6 }, { count: 1, sides: 4 }]
    },
    'ability-scores': {
        name: '属性检定',
        dice: [{ count: 4, sides: 6, dropLowest: true }]
    },
    'advantage': {
        name: '优势',
        dice: [{ count: 2, sides: 20, keepHighest: true }]
    },
    'disadvantage': {
        name: '劣势',
        dice: [{ count: 2, sides: 20, keepLowest: true }]
    }
};

function changeAnimationType() {
    animationType = document.getElementById('animationType').value;
    localStorage.setItem('animationType', animationType);
}

function rollDice(sides) {
    const result = Math.floor(Math.random() * sides) + 1;
    displayDiceResult(`D${sides}`, [result], result, sides, [], 'sum', 1);
}

function validateNumberInput(value, min = 0, max = null) {
    let num = parseFloat(value);
    
    if (isNaN(num)) {
        return min;
    }
    
    if (num < 0) {
        num = Math.abs(num);
    }
    
    num = Math.floor(num);
    
    if (num < min) {
        num = min;
    }
    
    if (max !== null && num > max) {
        num = max;
    }
    
    return num;
}

function rollCustomDice() {
    const countInput = document.getElementById('dice-count');
    const ruleAmountInput = document.getElementById('dice-rule-amount');
    const rule = document.getElementById('dice-rule').value;
    
    const count = validateNumberInput(countInput.value, 1);
    countInput.value = count;
    
    const sides = parseInt(document.getElementById('dice-type').value);
    
    let ruleAmount = 1;
    if (rule !== 'sum') {
        ruleAmount = validateNumberInput(ruleAmountInput.value, 0, count);
        ruleAmountInput.value = ruleAmount;
    }
    
    const itemName = document.getElementById('preset-name-input').value.trim();
    
    const results = [];
    for (let i = 0; i < count; i++) {
        results.push(Math.floor(Math.random() * sides) + 1);
    }
    
    const { results: finalResults, total, dropped } = applyDiceRule(results, rule, ruleAmount);
    
    let diceType = `${count}×D${sides}`;
    if (rule !== 'sum') {
        const ruleText = {
            'keep-highest': `取最大${ruleAmount}个`,
            'keep-lowest': `取最小${ruleAmount}个`,
            'drop-highest': `去除最大${ruleAmount}个`,
            'drop-lowest': `去除最小${ruleAmount}个`
        };
        diceType += ` (${ruleText[rule]})`;
    }
    
    displayDiceResult(diceType, finalResults, total, sides, dropped, rule, ruleAmount, count, itemName);
}

function toggleCustomRuleAmount() {
    const rule = document.getElementById('dice-rule').value;
    const amountInput = document.getElementById('dice-rule-amount');
    
    if (rule === 'sum') {
        amountInput.style.display = 'none';
    } else {
        amountInput.style.display = 'inline-block';
    }
}

function displayDiceResult(diceType, results, total, sides, dropped = [], rule = 'sum', ruleAmount = 1, originalCount = null, itemName = '') {
    const resultBox = document.getElementById('dice-result');
    
    let droppedText = '';
    if (dropped.length > 0) {
        droppedText = `<div class="total-dropped animation-${animationType}">舍去: ${dropped.join(', ')}</div>`;
    }
    
    if (animationType === 'none') {
        resultBox.innerHTML = `
            ${results.join(' + ')} = ${total}${droppedText}
        `;
        addToDiceHistory(diceType, results, total, itemName);
    } else {
        const count = originalCount || results.length;
        let counter = 0;
        const duration = 1500;
        const interval = 80;
        
        const animation = setInterval(() => {
            const tempResults = [];
            for (let i = 0; i < count; i++) {
                tempResults.push(Math.floor(Math.random() * sides) + 1);
            }
            const { results: tempFinalResults, total: tempTotal, dropped: tempDropped } = applyDiceRule(tempResults, rule, ruleAmount);
            
            let tempDroppedText = '';
            if (tempDropped.length > 0) {
                tempDroppedText = `<div class="total-dropped animation-${animationType}">舍去: ${tempDropped.join(', ')}</div>`;
            }
            
            resultBox.innerHTML = `
                <div class="animation-${animationType}">${tempFinalResults.join(' + ')} = ${tempTotal}</div>${tempDroppedText}
            `;
            
            counter += interval;
            
            if (counter >= duration) {
                clearInterval(animation);
                
                resultBox.innerHTML = `
                    <div class="animation-${animationType}">${results.join(' + ')} = ${total}</div>${droppedText}
                `;
                
                addToDiceHistory(diceType, results, total, itemName);
            }
        }, interval);
    }
}

function addMixedDice() {
    const list = document.getElementById('mixed-dice-list');
    const cardCount = list.querySelectorAll('.dice-card').length;
    const newItem = document.createElement('div');
    newItem.className = 'dice-card';
    newItem.innerHTML = `
        <div class="dice-card-header">
            <span class="dice-card-label">骰子 #${cardCount + 1}</span>
            <button class="dice-card-remove" onclick="removeMixedDice(this)">✕</button>
        </div>
        <div class="dice-card-body">
            <div class="dice-card-row">
                <label>数量:</label>
                <input type="number" class="dice-count-input" min="1" value="1">
            </div>
            <div class="dice-card-row">
                <label>类型:</label>
                <select class="dice-type-select">
                    <option value="4">D4</option>
                    <option value="6" selected>D6</option>
                    <option value="8">D8</option>
                    <option value="10">D10</option>
                    <option value="12">D12</option>
                    <option value="20">D20</option>
                    <option value="100">D100</option>
                </select>
            </div>
            <div class="dice-card-row">
                <label>规则:</label>
                <select class="dice-rule-select" onchange="toggleRuleAmount(this)">
                    <option value="sum" selected>直接求和</option>
                    <option value="keep-highest">取最大X个</option>
                    <option value="keep-lowest">取最小X个</option>
                    <option value="drop-highest">去除最大X个</option>
                    <option value="drop-lowest">去除最小X个</option>
                </select>
            </div>
            <div class="dice-card-row dice-rule-amount-row" style="display: none;">
                <label>X值:</label>
                <input type="number" class="dice-rule-amount" min="0" step="1" value="1">
            </div>
            <div class="dice-card-result">
                <div class="dice-result-label">结果:</div>
                <div class="dice-result-value">-</div>
            </div>
        </div>
    `;
    list.appendChild(newItem);
    updateDiceCardLabels();
}

function toggleRuleAmount(selectElement) {
    const card = selectElement.closest('.dice-card');
    const amountRow = card.querySelector('.dice-rule-amount-row');
    const value = selectElement.value;
    
    if (value === 'sum') {
        amountRow.style.display = 'none';
    } else {
        amountRow.style.display = 'flex';
    }
}

function toggleTotalRuleAmount() {
    const ruleSelect = document.getElementById('total-rule-select');
    const amountInput = document.getElementById('total-rule-amount');
    const value = ruleSelect.value;
    
    if (value === 'sum') {
        amountInput.style.display = 'none';
    } else {
        amountInput.style.display = 'inline-block';
    }
}

function removeMixedDice(button) {
    const card = button.closest('.dice-card');
    const list = document.getElementById('mixed-dice-list');
    const cards = list.querySelectorAll('.dice-card');
    
    if (cards.length > 1) {
        card.remove();
        updateDiceCardLabels();
    } else {
        alert('至少需要保留一个骰子！');
    }
}

function updateDiceCardLabels() {
    const cards = document.querySelectorAll('.dice-card');
    cards.forEach((card, index) => {
        const label = card.querySelector('.dice-card-label');
        label.textContent = `骰子 #${index + 1}`;
    });
}

function getMixedDiceConfig() {
    const cards = document.querySelectorAll('.dice-card');
    const config = [];
    
    cards.forEach(card => {
        const countInput = card.querySelector('.dice-count-input');
        const count = validateNumberInput(countInput.value, 1);
        countInput.value = count;
        
        const sides = parseInt(card.querySelector('.dice-type-select').value);
        const rule = card.querySelector('.dice-rule-select').value;
        
        const ruleAmountInput = card.querySelector('.dice-rule-amount');
        let ruleAmount = 1;
        if (rule !== 'sum' && ruleAmountInput) {
            ruleAmount = validateNumberInput(ruleAmountInput.value, 0, count);
            ruleAmountInput.value = ruleAmount;
        }
        
        config.push({ count, sides, rule, ruleAmount });
    });
    
    return config;
}

function applyDiceRule(results, rule, amount) {
    if (rule === 'sum' || results.length === 0) {
        return { results: results, total: results.reduce((a, b) => a + b, 0), dropped: [] };
    }
    
    const sortedResults = [...results].sort((a, b) => a - b);
    let finalResults = [];
    let droppedResults = [];
    
    switch (rule) {
        case 'keep-highest':
            if (amount === 0) {
                finalResults = [];
                droppedResults = results;
            } else {
                finalResults = sortedResults.slice(-amount);
                droppedResults = sortedResults.slice(0, -amount);
            }
            break;
        case 'keep-lowest':
            if (amount === 0) {
                finalResults = [];
                droppedResults = results;
            } else {
                finalResults = sortedResults.slice(0, amount);
                droppedResults = sortedResults.slice(amount);
            }
            break;
        case 'drop-highest':
            if (amount === 0) {
                finalResults = results;
                droppedResults = [];
            } else {
                finalResults = sortedResults.slice(0, -amount);
                droppedResults = sortedResults.slice(-amount);
            }
            break;
        case 'drop-lowest':
            if (amount === 0) {
                finalResults = results;
                droppedResults = [];
            } else {
                finalResults = sortedResults.slice(amount);
                droppedResults = sortedResults.slice(0, amount);
            }
            break;
        default:
            finalResults = results;
            droppedResults = [];
    }
    
    if (finalResults.length === 0) {
        return { results: [0], total: 0, dropped: droppedResults };
    }
    
    return { results: finalResults, total: finalResults.reduce((a, b) => a + b, 0), dropped: droppedResults };
}

function rollMixedDice() {
    const config = getMixedDiceConfig();
    const cards = document.querySelectorAll('.dice-card');
    const cardResults = [];
    const cardTotals = [];
    const cardDroppeds = [];
    const diceDescriptions = [];
    const itemName = document.getElementById('preset-name-input').value.trim();
    
    config.forEach((die, index) => {
        const results = [];
        for (let i = 0; i < die.count; i++) {
            results.push(Math.floor(Math.random() * die.sides) + 1);
        }
        
        const { results: finalResults, total, dropped } = applyDiceRule(results, die.rule, die.ruleAmount);
        cardResults.push(finalResults);
        cardTotals.push(total);
        cardDroppeds.push(dropped);
        
        let desc = `${die.count}×D${die.sides}`;
        if (die.rule !== 'sum') {
            const ruleText = {
                'keep-highest': `取最大${die.ruleAmount}个`,
                'keep-lowest': `取最小${die.ruleAmount}个`,
                'drop-highest': `去除最大${die.ruleAmount}个`,
                'drop-lowest': `去除最小${die.ruleAmount}个`
            };
            desc += ` (${ruleText[die.rule]})`;
        }
        diceDescriptions.push(desc);
        
        if (cards[index]) {
            const resultValue = cards[index].querySelector('.dice-result-value');
            if (resultValue) {
                let droppedText = '';
                if (dropped.length > 0) {
                    droppedText = `<small class="animation-${animationType}" style="color: var(--text-muted);">舍去: ${dropped.join(', ')}</small>`;
                }
                
                if (animationType === 'none') {
                    resultValue.innerHTML = `${finalResults.join(' + ')} = ${total}${droppedText}`;
                } else {
                    resultValue.innerHTML = `<div class="animation-${animationType}">${finalResults.join(' + ')} = ${total}</div>${droppedText}`;
                }
            }
        }
    });
    
    const totalRuleSelect = document.getElementById('total-rule-select');
    const totalRuleAmountInput = document.getElementById('total-rule-amount');
    const totalRule = totalRuleSelect ? totalRuleSelect.value : 'sum';
    
    let totalRuleAmount = 1;
    if (totalRule !== 'sum' && totalRuleAmountInput) {
        totalRuleAmount = validateNumberInput(totalRuleAmountInput.value, 0, cardTotals.length);
        totalRuleAmountInput.value = totalRuleAmount;
    }
    
    const { results: finalCardTotals, total, dropped: totalDropped } = applyDiceRule(cardTotals, totalRule, totalRuleAmount);
    
    displayMixedDiceResult(diceDescriptions.join(' + '), cardResults, cardTotals, cardDroppeds, finalCardTotals, total, totalRule, totalRuleAmount, totalDropped, itemName);
}

function displayMixedDiceResult(diceType, cardResults, cardTotals, cardDroppeds, finalCardTotals, total, totalRule, totalRuleAmount, totalDropped, itemName = '') {
    const resultBox = document.getElementById('dice-result');
    
    let droppedText = '';
    if (totalRule !== 'sum' && totalDropped.length > 0) {
        droppedText = `<div class="total-dropped animation-${animationType}">舍去: ${totalDropped.join(', ')}</div>`;
    }
    
    if (animationType === 'none') {
        resultBox.innerHTML = `
            ${finalCardTotals.join(' + ')} = ${total}${droppedText}
        `;
        addToDiceHistory(diceType, finalCardTotals, total, itemName);
    } else {
        let counter = 0;
        const duration = 1500;
        const interval = 80;
        const config = getMixedDiceConfig();
        const cards = document.querySelectorAll('.dice-card');
        
        const animation = setInterval(() => {
            const tempCardTotals = [];
            config.forEach((die, index) => {
                const results = [];
                for (let i = 0; i < die.count; i++) {
                    results.push(Math.floor(Math.random() * die.sides) + 1);
                }
                const { results: finalResults, total: cardTotal, dropped } = applyDiceRule(results, die.rule, die.ruleAmount);
                tempCardTotals.push(cardTotal);
                
                if (cards[index]) {
                    const resultValue = cards[index].querySelector('.dice-result-value');
                    if (resultValue) {
                        let cardDroppedText = '';
                        if (dropped.length > 0) {
                            cardDroppedText = `<small class="animation-${animationType}" style="color: var(--text-muted);">舍去: ${dropped.join(', ')}</small>`;
                        }
                        resultValue.innerHTML = `<div class="animation-${animationType}">${finalResults.join(' + ')} = ${cardTotal}</div>${cardDroppedText}`;
                    }
                }
            });
            const { results: tempFinalCardTotals, total: tempTotal, dropped: tempDropped } = applyDiceRule(tempCardTotals, totalRule, totalRuleAmount);
            
            let tempDroppedText = '';
            if (totalRule !== 'sum' && tempDropped.length > 0) {
                tempDroppedText = `<div class="total-dropped animation-${animationType}">舍去: ${tempDropped.join(', ')}</div>`;
            }
            
            resultBox.innerHTML = `
                <div class="animation-${animationType}">${tempFinalCardTotals.join(' + ')} = ${tempTotal}</div>${tempDroppedText}
            `;
            
            counter += interval;
            
            if (counter >= duration) {
                clearInterval(animation);
                
                config.forEach((die, index) => {
                    if (cards[index]) {
                        const resultValue = cards[index].querySelector('.dice-result-value');
                        if (resultValue) {
                            let cardDroppedText = '';
                            if (cardDroppeds[index].length > 0) {
                                cardDroppedText = `<small class="animation-${animationType}" style="color: var(--text-muted);">舍去: ${cardDroppeds[index].join(', ')}</small>`;
                            }
                            resultValue.innerHTML = `<div class="animation-${animationType}">${cardResults[index].join(' + ')} = ${cardTotals[index]}</div>${cardDroppedText}`;
                        }
                    }
                });
                
                resultBox.innerHTML = `
                    <div class="animation-${animationType}">${finalCardTotals.join(' + ')} = ${total}</div>${droppedText}
                `;
                
                addToDiceHistory(diceType, finalCardTotals, total, itemName);
            }
        }, interval);
    }
}

function loadPreset(presetId) {
    const preset = builtInPresets[presetId];
    if (!preset) return;
    
    document.getElementById('preset-name-input').value = preset.name;
    
    const list = document.getElementById('mixed-dice-list');
    list.innerHTML = '';
    
    preset.dice.forEach((die, index) => {
        const item = document.createElement('div');
        item.className = 'dice-card';
        item.innerHTML = `
            <div class="dice-card-header">
                <span class="dice-card-label">骰子 #${index + 1}</span>
                <button class="dice-card-remove" onclick="removeMixedDice(this)">✕</button>
            </div>
            <div class="dice-card-body">
                <div class="dice-card-row">
                    <label>数量:</label>
                    <input type="number" class="dice-count-input" min="1" value="${die.count}">
                </div>
                <div class="dice-card-row">
                    <label>类型:</label>
                    <select class="dice-type-select">
                        <option value="4" ${die.sides === 4 ? 'selected' : ''}>D4</option>
                        <option value="6" ${die.sides === 6 ? 'selected' : ''}>D6</option>
                        <option value="8" ${die.sides === 8 ? 'selected' : ''}>D8</option>
                        <option value="10" ${die.sides === 10 ? 'selected' : ''}>D10</option>
                        <option value="12" ${die.sides === 12 ? 'selected' : ''}>D12</option>
                        <option value="20" ${die.sides === 20 ? 'selected' : ''}>D20</option>
                        <option value="100" ${die.sides === 100 ? 'selected' : ''}>D100</option>
                    </select>
                </div>
                <div class="dice-card-row">
                    <label>规则:</label>
                    <select class="dice-rule-select" onchange="toggleRuleAmount(this)">
                        <option value="sum" selected>直接求和</option>
                        <option value="keep-highest">取最大X个</option>
                        <option value="keep-lowest">取最小X个</option>
                        <option value="drop-highest">去除最大X个</option>
                        <option value="drop-lowest">去除最小X个</option>
                    </select>
                </div>
                <div class="dice-card-row dice-rule-amount-row" style="display: none;">
                    <label>X值:</label>
                    <input type="number" class="dice-rule-amount" min="0" step="1" value="1">
                </div>
                <div class="dice-card-result">
                    <div class="dice-result-label">结果:</div>
                    <div class="dice-result-value">-</div>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
    
    if (preset.dice[0].dropLowest) {
        const card = document.querySelector('.dice-card');
        if (card) {
            const ruleSelect = card.querySelector('.dice-rule-select');
            const ruleAmount = card.querySelector('.dice-rule-amount');
            const ruleAmountRow = card.querySelector('.dice-rule-amount-row');
            if (ruleSelect) ruleSelect.value = 'drop-lowest';
            if (ruleAmount) ruleAmount.value = '1';
            if (ruleAmountRow) ruleAmountRow.style.display = 'flex';
        }
    } else if (preset.dice[0].keepHighest) {
        const cards = document.querySelectorAll('.dice-card');
        cards.forEach(card => {
            const ruleSelect = card.querySelector('.dice-rule-select');
            const ruleAmount = card.querySelector('.dice-rule-amount');
            const ruleAmountRow = card.querySelector('.dice-rule-amount-row');
            if (ruleSelect) ruleSelect.value = 'keep-highest';
            if (ruleAmount) ruleAmount.value = '1';
            if (ruleAmountRow) ruleAmountRow.style.display = 'flex';
        });
    } else if (preset.dice[0].keepLowest) {
        const cards = document.querySelectorAll('.dice-card');
        cards.forEach(card => {
            const ruleSelect = card.querySelector('.dice-rule-select');
            const ruleAmount = card.querySelector('.dice-rule-amount');
            const ruleAmountRow = card.querySelector('.dice-rule-amount-row');
            if (ruleSelect) ruleSelect.value = 'keep-lowest';
            if (ruleAmount) ruleAmount.value = '1';
            if (ruleAmountRow) ruleAmountRow.style.display = 'flex';
        });
    }
    
    rollMixedDice();
}

function saveCurrentPreset() {
    const name = document.getElementById('preset-name-input').value.trim();
    if (!name) {
        alert('请输入组合名称！');
        return;
    }
    
    const config = getMixedDiceConfig();
    if (config.length === 0) {
        alert('请至少添加一个骰子！');
        return;
    }
    
    const totalRuleSelect = document.getElementById('total-rule-select');
    const totalRuleAmountInput = document.getElementById('total-rule-amount');
    const totalRule = totalRuleSelect ? totalRuleSelect.value : 'sum';
    
    let totalRuleAmount = 1;
    if (totalRule !== 'sum' && totalRuleAmountInput) {
        totalRuleAmount = validateNumberInput(totalRuleAmountInput.value, 0, config.length);
        totalRuleAmountInput.value = totalRuleAmount;
    }
    
    const presetId = 'custom-' + Date.now();
    customPresets[presetId] = {
        name: name,
        dice: config,
        totalRule: totalRule,
        totalRuleAmount: totalRuleAmount
    };
    
    localStorage.setItem('customPresets', JSON.stringify(customPresets));
    document.getElementById('preset-name-input').value = '';
    
    renderCustomPresets();
    alert('组合已保存！');
}

function loadCustomPreset(presetId) {
    const preset = customPresets[presetId];
    if (!preset) return;
    
    document.getElementById('preset-name-input').value = preset.name;
    
    const list = document.getElementById('mixed-dice-list');
    list.innerHTML = '';
    
    preset.dice.forEach((die, index) => {
        const item = document.createElement('div');
        item.className = 'dice-card';
        item.innerHTML = `
            <div class="dice-card-header">
                <span class="dice-card-label">骰子 #${index + 1}</span>
                <button class="dice-card-remove" onclick="removeMixedDice(this)">✕</button>
            </div>
            <div class="dice-card-body">
                <div class="dice-card-row">
                    <label>数量:</label>
                    <input type="number" class="dice-count-input" min="1" value="${die.count}">
                </div>
                <div class="dice-card-row">
                    <label>类型:</label>
                    <select class="dice-type-select">
                        <option value="4" ${die.sides === 4 ? 'selected' : ''}>D4</option>
                        <option value="6" ${die.sides === 6 ? 'selected' : ''}>D6</option>
                        <option value="8" ${die.sides === 8 ? 'selected' : ''}>D8</option>
                        <option value="10" ${die.sides === 10 ? 'selected' : ''}>D10</option>
                        <option value="12" ${die.sides === 12 ? 'selected' : ''}>D12</option>
                        <option value="20" ${die.sides === 20 ? 'selected' : ''}>D20</option>
                        <option value="100" ${die.sides === 100 ? 'selected' : ''}>D100</option>
                    </select>
                </div>
                <div class="dice-card-row">
                    <label>规则:</label>
                    <select class="dice-rule-select" onchange="toggleRuleAmount(this)">
                        <option value="sum" ${!die.rule || die.rule === 'sum' ? 'selected' : ''}>直接求和</option>
                        <option value="keep-highest" ${die.rule === 'keep-highest' ? 'selected' : ''}>取最大X个</option>
                        <option value="keep-lowest" ${die.rule === 'keep-lowest' ? 'selected' : ''}>取最小X个</option>
                        <option value="drop-highest" ${die.rule === 'drop-highest' ? 'selected' : ''}>去除最大X个</option>
                        <option value="drop-lowest" ${die.rule === 'drop-lowest' ? 'selected' : ''}>去除最小X个</option>
                    </select>
                </div>
                <div class="dice-card-row dice-rule-amount-row" style="display: ${die.rule && die.rule !== 'sum' ? 'flex' : 'none'};">
                    <label>X值:</label>
                    <input type="number" class="dice-rule-amount" min="0" step="1" value="${die.ruleAmount || 1}">
                </div>
                <div class="dice-card-result">
                    <div class="dice-result-label">结果:</div>
                    <div class="dice-result-value">-</div>
                </div>
            </div>
        `;
        list.appendChild(item);
    });
    
    if (preset.totalRule) {
        const totalRuleSelect = document.getElementById('total-rule-select');
        const totalRuleAmountInput = document.getElementById('total-rule-amount');
        
        if (totalRuleSelect) {
            totalRuleSelect.value = preset.totalRule;
        }
        
        if (totalRuleAmountInput && preset.totalRuleAmount) {
            totalRuleAmountInput.value = preset.totalRuleAmount;
        }
        
        toggleTotalRuleAmount();
    }
}

function deleteCustomPreset(presetId) {
    if (confirm('确定要删除这个组合吗？')) {
        delete customPresets[presetId];
        localStorage.setItem('customPresets', JSON.stringify(customPresets));
        renderCustomPresets();
    }
}

function renderCustomPresets() {
    const list = document.getElementById('custom-presets-list');
    
    if (Object.keys(customPresets).length === 0) {
        list.innerHTML = '<div class="empty-history">暂无自定义组合</div>';
        return;
    }
    
    list.innerHTML = Object.entries(customPresets).map(([id, preset]) => {
        const diceDesc = preset.dice.map(d => {
            let desc = `${d.count}×D${d.sides}`;
            if (d.rule && d.rule !== 'sum') {
                const ruleText = {
                    'keep-highest': `取最大${d.ruleAmount}个`,
                    'keep-lowest': `取最小${d.ruleAmount}个`,
                    'drop-highest': `去除最大${d.ruleAmount}个`,
                    'drop-lowest': `去除最小${d.ruleAmount}个`
                };
                desc += ` (${ruleText[d.rule]})`;
            }
            return desc;
        }).join(' + ');
        
        let totalRuleDesc = '';
        if (preset.totalRule && preset.totalRule !== 'sum') {
            const ruleText = {
                'keep-highest': `取最大${preset.totalRuleAmount}个`,
                'keep-lowest': `取最小${preset.totalRuleAmount}个`,
                'drop-highest': `去除最大${preset.totalRuleAmount}个`,
                'drop-lowest': `去除最小${preset.totalRuleAmount}个`
            };
            totalRuleDesc = `<div class="custom-preset-total-rule">总规则: ${ruleText[preset.totalRule]}</div>`;
        }
        
        return `
            <div class="custom-preset-card">
                <div class="custom-preset-header">
                    <div class="custom-preset-name">${preset.name}</div>
                    <div class="custom-preset-actions">
                        <button class="roll-preset-btn" onclick="rollPresetDirectly('${id}')">🎲 投掷</button>
                        <button class="load-preset-btn" onclick="loadCustomPreset('${id}')">加载</button>
                        <button class="delete-preset-btn" onclick="deleteCustomPreset('${id}')">删除</button>
                    </div>
                </div>
                <div class="custom-preset-body">
                    <div class="custom-preset-dice">${diceDesc}</div>
                    ${totalRuleDesc}
                </div>
            </div>
        `;
    }).join('');
}

function rollPresetDirectly(presetId) {
    const preset = customPresets[presetId];
    if (!preset) return;
    
    loadCustomPreset(presetId);
    
    setTimeout(() => {
        rollMixedDice();
    }, 100);
}

function addToDiceHistory(diceType, results, total, itemName = '') {
    const now = new Date();
    const timeStr = now.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    }).replace(/\//g, '-');
    
    diceHistory.unshift({
        type: diceType,
        results: results,
        total: total,
        time: timeStr,
        itemName: itemName
    });
    
    if (diceHistory.length > 30) {
        diceHistory = diceHistory.slice(0, 30);
    }
    
    localStorage.setItem('diceHistory', JSON.stringify(diceHistory));
    renderDiceHistory();
}

function renderDiceHistory() {
    const historyDiv = document.getElementById('dice-history');
    
    if (diceHistory.length === 0) {
        historyDiv.innerHTML = '<div class="empty-history">暂无历史记录</div>';
        return;
    }
    
    historyDiv.innerHTML = diceHistory.map(item => {
        const itemNameText = item.itemName ? `${item.itemName}：` : '';
        return `<div class="history-item">[${item.time}] ${itemNameText}${item.type}: ${item.results.join(' + ')}${item.results.length > 1 ? ' = ' + item.total : ''}</div>`;
    }).join('');
}

function clearDiceHistory() {
    if (confirm('确定要清空所有投掷历史吗？')) {
        diceHistory = [];
        localStorage.removeItem('diceHistory');
        renderDiceHistory();
    }
}

function clearCustomPresets() {
    if (confirm('确定要清空所有自定义组合吗？')) {
        customPresets = {};
        localStorage.removeItem('customPresets');
        renderCustomPresets();
    }
}

function exportDiceHistory() {
    if (diceHistory.length === 0) {
        alert('没有可导出的投掷历史！');
        return;
    }
    
    const data = {
        history: diceHistory,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `dice-history_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

function importDiceHistory() {
    document.getElementById('importDiceHistoryFile').click();
}

function handleDiceHistoryImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (!data.history || !Array.isArray(data.history)) {
                alert('无效的投掷历史文件格式！');
                return;
            }
            
            if (!confirm('确定要导入投掷历史吗？当前投掷历史将被覆盖！')) return;
            
            diceHistory = data.history;
            localStorage.setItem('diceHistory', JSON.stringify(diceHistory));
            renderDiceHistory();
            alert('投掷历史导入成功！');
        } catch (error) {
            alert('投掷历史导入失败！请确保上传的是有效的JSON文件。');
            console.error('导入错误:', error);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function exportPresets() {
    if (Object.keys(customPresets).length === 0) {
        alert('没有可导出的自定义组合！');
        return;
    }
    
    const data = {
        presets: customPresets,
        exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `dice-presets_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    
    URL.revokeObjectURL(url);
}

function importPresets() {
    document.getElementById('importPresetsFile').click();
}

function handlePresetsImport(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const data = JSON.parse(event.target.result);
            if (!data.presets || typeof data.presets !== 'object') {
                alert('无效的自定义组合文件格式！');
                return;
            }
            
            if (!confirm('确定要导入自定义组合吗？当前自定义组合将被覆盖！')) return;
            
            customPresets = data.presets;
            localStorage.setItem('customPresets', JSON.stringify(customPresets));
            renderCustomPresets();
            alert('自定义组合导入成功！');
        } catch (error) {
            alert('自定义组合导入失败！请确保上传的是有效的JSON文件。');
            console.error('导入错误:', error);
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function resetAllData() {
    if (confirm('确定要重置所有骰子工具数据吗？此操作不可恢复！')) {
        const diceKeys = ['diceHistory', 'animationType', 'customPresets'];
        Object.keys(localStorage).forEach(key => {
            if (diceKeys.includes(key)) {
                localStorage.removeItem(key);
            }
        });
        location.reload();
    }
}

function exportAllData() {
    const data = {};
    const diceKeys = ['diceHistory', 'animationType', 'customPresets'];
    
    diceKeys.forEach(key => {
        const value = localStorage.getItem(key);
        if (value !== null) {
            data[key] = value;
        }
    });
    
    data['exportDate'] = new Date().toISOString();
    
    const blob = new Blob([JSON.stringify(data)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `dice-tool-all-data_${new Date().toISOString().slice(0,10)}.json`;
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
            if (!confirm('确定要导入所有数据吗？当前骰子工具数据将被覆盖！')) return;
            
            const diceKeys = ['diceHistory', 'animationType', 'customPresets'];
            for (const key in data) {
                if (diceKeys.includes(key)) {
                    localStorage.setItem(key, data[key]);
                }
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
    renderDiceHistory();
    renderCustomPresets();
    
    document.getElementById('importDiceHistoryFile')?.addEventListener('change', handleDiceHistoryImport);
    document.getElementById('importPresetsFile')?.addEventListener('change', handlePresetsImport);
    document.getElementById('importAllFile')?.addEventListener('change', handleAllImport);
});