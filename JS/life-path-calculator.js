document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('calculate').addEventListener('click', calculate);
    document.getElementById('clearAll').addEventListener('click', clearAll);

    document.getElementById('birthdayInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') calculate();
    });

    document.getElementById('birthdayInput').addEventListener('input', (e) => {
        e.target.value = e.target.value.replace(/[^0-9]/g, '');
    });
});

const MASTER_NUMBERS = [11, 22, 33, 44];

const NUMBER_MEANINGS = {
    1: {
        title: '灵数 1 —— 领导者',
        text: '独立、开创、自信。1号人具有天生的领导力和创造力，喜欢走在前面，勇于开拓新道路。'
    },
    2: {
        title: '灵数 2 —— 和平者',
        text: '合作、敏感、平衡。2号人善于倾听和协调，注重和谐关系，是优秀的合作伙伴和调解者。'
    },
    3: {
        title: '灵数 3 —— 创意者',
        text: '表达、创意、乐观。3号人充满创造力和表现欲，善于沟通，具有艺术天赋和感染力。'
    },
    4: {
        title: '灵数 4 —— 建设者',
        text: '稳定、务实、勤奋。4号人注重秩序和规则，脚踏实地，是可靠的执行者和组织者。'
    },
    5: {
        title: '灵数 5 —— 自由者',
        text: '自由、变化、冒险。5号人热爱自由和新鲜体验，适应力强，渴望多样性和变化。'
    },
    6: {
        title: '灵数 6 —— 关怀者',
        text: '责任、关怀、和谐。6号人重视家庭和责任，富有同情心，是天生的照顾者和教育者。'
    },
    7: {
        title: '灵数 7 —— 探索者',
        text: '思考、分析、灵性。7号人追求真理和深层理解，善于分析和研究，具有哲学思维。'
    },
    8: {
        title: '灵数 8 —— 权威者',
        text: '权力、成就、物质。8号人具有商业头脑和管理能力，追求成就和物质上的成功。'
    },
    9: {
        title: '灵数 9 —— 智者',
        text: '智慧、博爱、理想。9号人具有人道主义精神，胸怀宽广，关注更大的整体和更高的理想。'
    },
    11: {
        title: '灵数 11 —— 直觉者（大师数）',
        text: '直觉、灵感、启迪。11号人拥有强大的直觉和灵性感知力，是灵感的传递者和启发者。'
    },
    22: {
        title: '灵数 22 —— 建造大师（大师数）',
        text: '远见、建造、实践。22号人能将宏大愿景转化为现实，是最具建设力的灵数。'
    },
    33: {
        title: '灵数 33 —— 慈悲大师（大师数）',
        text: '慈悲、教导、奉献。33号人拥有深切的慈悲心和教导能力，是天生的精神导师。'
    },
    44: {
        title: '灵数 44 —— 大师建造者（大师数）',
        text: '稳定、秩序、宏大。44号人兼具远见和执行力，能在物质世界中建立持久的价值。'
    }
};

function calculate() {
    const input = document.getElementById('birthdayInput').value.trim();

    if (!input) {
        showError('请输入生日');
        return;
    }

    if (!/^\d{8}$/.test(input)) {
        showError('请输入8位数字，格式为YYYYMMDD');
        return;
    }

    const year = parseInt(input.substring(0, 4));
    const month = parseInt(input.substring(4, 6));
    const day = parseInt(input.substring(6, 8));

    if (month < 1 || month > 12) {
        showError('月份应在01-12之间');
        return;
    }

    if (day < 1 || day > 31) {
        showError('日期应在01-31之间');
        return;
    }

    const maxDay = new Date(year, month, 0).getDate();
    if (day > maxDay) {
        showError(`${month}月没有${day}日`);
        return;
    }

    hideError();

    const digits = input.split('').map(Number);
    const steps = [];
    let currentDigits = [...digits];
    let stepIndex = 1;

    steps.push({
        label: `第${stepIndex}步`,
        expression: digits.join(' + '),
        result: digits.reduce((a, b) => a + b, 0),
        isMaster: false,
        isFinal: false
    });

    let currentSum = digits.reduce((a, b) => a + b, 0);

    while (currentSum > 9 && !MASTER_NUMBERS.includes(currentSum)) {
        stepIndex++;
        const newDigits = String(currentSum).split('').map(Number);
        const newSum = newDigits.reduce((a, b) => a + b, 0);

        steps.push({
            label: `第${stepIndex}步`,
            expression: newDigits.join(' + '),
            result: newSum,
            isMaster: false,
            isFinal: false
        });

        currentSum = newSum;
    }

    let finalNumber = currentSum;
    let isMasterNumber = MASTER_NUMBERS.includes(currentSum);

    if (isMasterNumber) {
        stepIndex++;
        const masterDigits = String(currentSum).split('').map(Number);
        const continuedSum = masterDigits.reduce((a, b) => a + b, 0);

        steps.push({
            label: `第${stepIndex}步`,
            expression: masterDigits.join(' + ') + ` = ${continuedSum}`,
            result: continuedSum,
            isMaster: true,
            isFinal: false,
            note: `大师数 ${currentSum} 继续相加`
        });
    }

    steps[steps.length - 1].isFinal = true;

    renderResult(finalNumber, isMasterNumber, steps);
}

function renderResult(finalNumber, isMasterNumber, steps) {
    document.getElementById('finalResult').textContent = finalNumber;

    const typeEl = document.getElementById('resultType');
    if (isMasterNumber) {
        typeEl.textContent = `大师数（Master Number ${finalNumber}）`;
    } else {
        typeEl.textContent = `生命灵数 ${finalNumber}`;
    }

    const stepsContainer = document.getElementById('calculationSteps');
    stepsContainer.innerHTML = steps.map((step, index) => {
        let classes = 'step-item';
        if (step.isFinal) classes += ' step-final';
        if (step.isMaster) classes += ' step-master';

        const delay = index * 0.15;

        let expressionHTML = `<span class="step-expression">${step.expression}</span>`;
        let resultHTML = `<span class="step-result">= ${step.result}</span>`;

        if (step.isMaster) {
            expressionHTML = `<span class="step-expression">${step.note}</span>`;
        }

        return `<div class="${classes}" style="animation-delay: ${delay}s">
            <span class="step-label">${step.label}</span>
            ${expressionHTML}
            ${resultHTML}
        </div>`;
    }).join('');

    const meaning = NUMBER_MEANINGS[finalNumber];
    const meaningEl = document.getElementById('numberMeaning');
    if (meaning) {
        meaningEl.innerHTML = `<div class="meaning-title">${meaning.title}</div><div class="meaning-text">${meaning.text}</div>`;
    } else {
        meaningEl.innerHTML = '';
    }

    document.getElementById('resultSection').style.display = 'block';
    document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearAll() {
    document.getElementById('birthdayInput').value = '';
    document.getElementById('resultSection').style.display = 'none';
    document.getElementById('errorMessage').style.display = 'none';
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
