/**
 * 生命灵数计算器页面脚本
 * 对应页面: life-path-calculator.html
 * 功能: 输入生日(YYYYMMDD)计算生命灵数,展示分步计算过程和灵数含义,
 *       支持大师数(11/22/33/44)特殊处理。
 */

/**
 * 显示错误提示并隐藏结果区
 * @param {string} message - 错误信息文本
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

// DOM 就绪后绑定事件
document.addEventListener('DOMContentLoaded', () => {
   // 计算按钮
   document.getElementById('calculate').addEventListener('click', calculate);
   // 清空按钮
   document.getElementById('clearAll').addEventListener('click', clearAll);

   // 回车触发计算
   document.getElementById('birthdayInput').addEventListener('keypress', (e) => {
       if (e.key === 'Enter') calculate();
   });

   // 输入框只允许数字(过滤非数字字符)
   document.getElementById('birthdayInput').addEventListener('input', (e) => {
       e.target.value = e.target.value.replace(/[^0-9]/g, '');
   });
});

// 大师数列表(计算到这些数时不再继续相加,作为特殊结果)
const MASTER_NUMBERS = [11, 22, 33, 44];

// 各灵数的含义文本(1-9 + 大师数)
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

/**
 * 计算生命灵数
 * 流程: 校验输入 → 逐年逐月逐日相加 → 循环数位相加直到个位数或大师数
 */
function calculate() {
   const input = document.getElementById('birthdayInput').value.trim();

   // 输入校验: 非空
   if (!input) {
       showError('请输入生日');
       return;
   }
   // 输入校验: 8位数字
   if (!/^\d{8}$/.test(input)) {
       showError('请输入8位数字，格式为YYYYMMDD');
       return;
   }

   // 拆分年月日
   const year = parseInt(input.substring(0, 4));
   const month = parseInt(input.substring(4, 6));
   const day = parseInt(input.substring(6, 8));

   // 校验月份范围
   if (month < 1 || month > 12) {
       showError('月份应在01-12之间');
       return;
   }
   // 校验日期范围(基础)
   if (day < 1 || day > 31) {
       showError('日期应在01-31之间');
       return;
   }
   // 校验日期是否真实存在(如 2月30日)
   const maxDay = new Date(year, month, 0).getDate();
   if (day > maxDay) {
       showError(`${month}月没有${day}日`);
       return;
   }

   // 校验通过,隐藏错误
   hideError();

   // ============ 灵数计算 ============
   // 将 8 位数字拆成单个数字
   const digits = input.split('').map(Number);
   const steps = [];          // 计算步骤记录
   let currentDigits = [...digits];
   let stepIndex = 1;

   // 第1步: 所有数字相加
   steps.push({
       label: `第${stepIndex}步`,
       expression: digits.join(' + '),
       result: digits.reduce((a, b) => a + b, 0),
       isMaster: false,
       isFinal: false
   });

   let currentSum = digits.reduce((a, b) => a + b, 0);

   // 循环: 结果>9 且不是大师数时,继续数位相加
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

   // 最终结果(可能是大师数)
   let finalNumber = currentSum;
   let isMasterNumber = MASTER_NUMBERS.includes(currentSum);

   // 大师数: 额外展示"继续相加"步骤(展示其可进一步化简,但保留大师数身份)
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

   // 标记最后一步为最终结果
   steps[steps.length - 1].isFinal = true;

   // 渲染结果
   renderResult(finalNumber, isMasterNumber, steps);
}

/**
 * 渲染计算结果(最终数字/类型/计算步骤/含义)
 * @param {number} finalNumber - 最终灵数
 * @param {boolean} isMasterNumber - 是否为大师数
 * @param {Array} steps - 计算步骤数组
 */
function renderResult(finalNumber, isMasterNumber, steps) {
   // 最终数字
   document.getElementById('finalResult').textContent = finalNumber;

   // 结果类型(大师数 or 普通灵数)
   const typeEl = document.getElementById('resultType');
   if (isMasterNumber) {
       typeEl.textContent = `大师数（Master Number ${finalNumber}）`;
   } else {
       typeEl.textContent = `生命灵数 ${finalNumber}`;
   }

   // 渲染分步计算过程(带渐入动画)
   const stepsContainer = document.getElementById('calculationSteps');
   stepsContainer.innerHTML = steps.map((step, index) => {
       let classes = 'step-item';
       if (step.isFinal) classes += ' step-final';    // 最终步高亮
       if (step.isMaster) classes += ' step-master';  // 大师数步特殊样式

       // 每步延迟 0.15s 渐入
       const delay = index * 0.15;

       let expressionHTML = `<span class="step-expression">${step.expression}</span>`;
       let resultHTML = `<span class="step-result">= ${step.result}</span>`;

       // 大师数步骤显示说明文字而非算式
       if (step.isMaster) {
           expressionHTML = `<span class="step-expression">${step.note}</span>`;
       }

       return `<div class="${classes}" style="animation-delay: ${delay}s">
           <span class="step-label">${step.label}</span>
           ${expressionHTML}
           ${resultHTML}
       </div>`;
   }).join('');

   // 渲染灵数含义
   const meaning = NUMBER_MEANINGS[finalNumber];
   const meaningEl = document.getElementById('numberMeaning');
   if (meaning) {
       meaningEl.innerHTML = `<div class="meaning-title">${meaning.title}</div><div class="meaning-text">${meaning.text}</div>`;
   } else {
       meaningEl.innerHTML = '';
   }

   // 显示结果区并滚动到可见位置
   document.getElementById('resultSection').style.display = 'block';
   document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * 清空输入和结果
 */
function clearAll() {
   document.getElementById('birthdayInput').value = '';
   document.getElementById('resultSection').style.display = 'none';
   document.getElementById('errorMessage').style.display = 'none';
}
