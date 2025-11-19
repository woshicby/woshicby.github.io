/**
 * 配速计算器核心功能模块
 * 提供运动配速、距离、时间和速度的相互计算功能
 * 支持公制和英制单位转换，并包含分段时间计算等高级功能
 * @module PaceCalculator
 */

/**
 * 单位换算常量对象
 * 包含所有必要的单位转换系数
 * @namespace UNIT_CONVERSIONS
 */
const UNIT_CONVERSIONS = {
    // 长度单位转换
    m_to_km: 0.001,          // 米到公里
    km_to_m: 1000,           // 公里到米
    mile_to_m: 1609.34,      // 英里到米
    m_to_mile: 0.000621371,  // 米到英里
    mile_to_km: 1.60934,     // 英里到公里
    km_to_mile: 0.621371,    // 公里到英里
    
    // 速度单位转换
    kmh_to_ms: 1000 / 3600,  // 公里/小时到米/秒
    ms_to_kmh: 3600 / 1000,  // 米/秒到公里/小时
    mph_to_kmh: 1.60934,     // 英里/小时到公里/小时
    kmh_to_mph: 0.621371,    // 公里/小时到英里/小时
    
    // 配速单位转换
    min_per_km_to_min_per_mile: 1.60934,  // 分钟/公里到分钟/英里
    min_per_mile_to_min_per_km: 0.621371, // 分钟/英里到分钟/公里
    min_per_km_to_min_per_m: 0.001,       // 分钟/公里到分钟/米
    min_per_m_to_min_per_km: 1000,        // 分钟/米到分钟/公里
    min_per_mile_to_min_per_m: 0.000621371, // 分钟/英里到分钟/米
    min_per_m_to_min_per_mile: 1609.34     // 分钟/米到分钟/英里
};

/**
 * DOM元素引用变量
 * 将在DOM加载完成后初始化
 */
let modeBtns;              // 模式切换按钮组
let distanceInput;         // 距离输入框
let hoursInput;            // 小时输入框
let minutesInput;          // 分钟输入框
let secondsInput;          // 秒输入框
let paceMinutesInput;      // 配速分钟输入框
let paceSecondsInput;      // 配速秒输入框
let speedInput;            // 速度输入框
let speedUnitSelect;       // 速度单位选择器
let calculateBtn;          // 计算按钮
let resultArea;            // 结果显示区域
let resultContent;         // 结果内容容器
let distanceUnitSelect;    // 距离单位选择器
let paceUnitSelect;        // 配速单位选择器
let distanceDropdown;      // 距离下拉选择菜单

/**
 * 当前计算器模式
 * 默认为'pace'模式（配速计算）
 * @type {string}
 */
let currentMode = 'pace';

/**
 * 常用距离选项配置
 * 按单位分类存储常用运动距离，方便用户快速选择
 * @type {Object}
 */
const COMMON_DISTANCES = {
    // 米单位距离列表
    m: [
        // 原始米单位距离
        { label: '100米', value: 100, sourceUnit: 'm' },
        { label: '200米', value: 200, sourceUnit: 'm' },
        { label: '400米', value: 400, sourceUnit: 'm' },
        { label: '800米', value: 800, sourceUnit: 'm' },
        { label: '1000米', value: 1000, sourceUnit: 'm' },
        { label: '1.5公里 (1500米)', value: 1500, sourceUnit: 'km' },
        { label: '3公里 (3000米)', value: 3000, sourceUnit: 'km' },
        { label: '5000米', value: 5000, sourceUnit: 'm' },
        { label: '10000米', value: 10000, sourceUnit: 'm' },
        { label: '1英里 (1609.344米)', value: 1609.344, sourceUnit: 'mile' },
        { label: '1.5英里 (2414.016米)', value: 2414.016, sourceUnit: 'mile' },
        { label: '20公里 (20000米)', value: 20000, sourceUnit: 'km' },
        { label: '3英里 (4828.032米)', value: 4828.032, sourceUnit: 'mile' },
        { label: '30公里 (30000米)', value: 30000, sourceUnit: 'km' },
        { label: '5英里 (8046.72米)', value: 8046.72, sourceUnit: 'mile' },
        { label: '半程马拉松 (21097.5米)', value: 21097.5, sourceUnit: 'special' },
        { label: '10英里 (16093.44米)', value: 16093.44, sourceUnit: 'mile' },
        { label: '全程马拉松 (42195米)', value: 42.195 * 1000, sourceUnit: 'special' },
        { label: '20英里 (32186.88米)', value: 32186.88, sourceUnit: 'mile' },
        { label: '30英里 (48280.32米)', value: 48280.32, sourceUnit: 'mile' },
        { label: '50公里 (50000米)', value: 50000, sourceUnit: 'km' },
        { label: '50英里 (80467.2米)', value: 80467.2, sourceUnit: 'mile' },
        { label: '100公里 (100000米)', value: 100000, sourceUnit: 'km' },
        { label: '100英里 (160934.4米)', value: 160934.4, sourceUnit: 'mile' }
    ],
    
    // 公里单位距离列表
    km: [
        // 原始公里单位距离
        { label: '1公里', value: 1, sourceUnit: 'km' },
        { label: '3公里', value: 3, sourceUnit: 'km' },
        { label: '5公里', value: 5, sourceUnit: 'km' },
        { label: '10公里', value: 10, sourceUnit: 'km' },
        { label: '20公里', value: 20, sourceUnit: 'km' },
        { label: '半程马拉松 (21.0975公里)', value: 21.0975, sourceUnit: 'special' },
        { label: '30公里', value: 30, sourceUnit: 'km' },
        { label: '全程马拉松 (42.195公里)', value: 42.195, sourceUnit: 'special' },
        { label: '50公里', value: 50, sourceUnit: 'km' },
        { label: '100公里', value: 100, sourceUnit: 'km' },
        // 对应米单位的距离
        { label: '100米 (0.1公里)', value: 0.1, sourceUnit: 'm' },
        { label: '200米 (0.2公里)', value: 0.2, sourceUnit: 'm' },
        { label: '400米 (0.4公里)', value: 0.4, sourceUnit: 'm' },
        { label: '800米 (0.8公里)', value: 0.8, sourceUnit: 'm' },
        { label: '1500米 (1.5公里)', value: 1.5, sourceUnit: 'm' },
        // 对应英里单位的距离
        { label: '1英里 (1.609344公里)', value: 1.609344, sourceUnit: 'mile' },
        { label: '1.5英里 (2.414016公里)', value: 2.414016, sourceUnit: 'mile' },
        { label: '3英里 (4.828032公里)', value: 4.828032, sourceUnit: 'mile' },
        { label: '5英里 (8.04672公里)', value: 8.04672, sourceUnit: 'mile' },
        { label: '10英里 (16.09344公里)', value: 16.09344, sourceUnit: 'mile' },
        { label: '20英里 (32.18688公里)', value: 32.18688, sourceUnit: 'mile' },
        { label: '30英里 (48.28032公里)', value: 48.28032, sourceUnit: 'mile' },
        { label: '50英里 (80.4672公里)', value: 80.4672, sourceUnit: 'mile' },
        { label: '100英里 (160.9344公里)', value: 160.9344, sourceUnit: 'mile' }
    ],
    
    // 英里单位距离列表
    mile: [
        // 原始英里单位距离
        { label: '1英里', value: 1, sourceUnit: 'mile' },
        { label: '1.5英里', value: 1.5, sourceUnit: 'mile' },
        { label: '3英里', value: 3, sourceUnit: 'mile' },
        { label: '5英里', value: 5, sourceUnit: 'mile' },
        { label: '10英里', value: 10, sourceUnit: 'mile' },
        { label: '半程马拉松 (13.1英里)', value: 13.1, sourceUnit: 'special' },
        { label: '20英里', value: 20, sourceUnit: 'mile' },
        { label: '全程马拉松 (26.2英里)', value: 26.2, sourceUnit: 'special' },
        { label: '30英里', value: 30, sourceUnit: 'mile' },
        { label: '50英里', value: 50, sourceUnit: 'mile' },
        { label: '100英里', value: 100, sourceUnit: 'mile' },
        // 对应米单位的距离
        { label: '100米 (0.0621371英里)', value: 0.0621371, sourceUnit: 'm' },
        { label: '200米 (0.124274英里)', value: 0.124274, sourceUnit: 'm' },
        { label: '400米 (0.248548英里)', value: 0.248548, sourceUnit: 'm' },
        { label: '800米 (0.497097英里)', value: 0.497097, sourceUnit: 'm' },
        { label: '1000米 (0.621371英里)', value: 0.621371, sourceUnit: 'm' },
        { label: '5000米 (3.10686英里)', value: 3.10686, sourceUnit: 'm' },
        { label: '10000米 (6.21371英里)', value: 6.21371, sourceUnit: 'm' },
        // 对应公里单位的距离
        { label: '1公里 (0.621371英里)', value: 0.621371, sourceUnit: 'km' },
        { label: '3公里 (1.86411英里)', value: 1.86411, sourceUnit: 'km' },
        { label: '5公里 (3.10686英里)', value: 3.10686, sourceUnit: 'km' },
        { label: '10公里 (6.21371英里)', value: 6.21371, sourceUnit: 'km' },
        { label: '20公里 (12.4274英里)', value: 12.4274, sourceUnit: 'km' },
        { label: '30公里 (18.6411英里)', value: 18.6411, sourceUnit: 'km' },
        { label: '50公里 (31.0686英里)', value: 31.0686, sourceUnit: 'km' },
        { label: '100公里 (62.1371英里)', value: 62.1371, sourceUnit: 'km' }
    ]
};

// 初始化函数
/**
 * 配速计算器初始化函数
 * 初始化DOM元素引用、设置事件监听器和表单状态
 * 这是计算器的入口函数，应该在DOM加载完成后调用
 * @function initPaceCalculator
 * @returns {void}
 */
function initPaceCalculator() {
    // 获取所有必要的DOM元素引用
    modeBtns = document.querySelectorAll('.mode-btn');
    distanceInput = document.getElementById('distance');
    hoursInput = document.getElementById('hours');
    minutesInput = document.getElementById('minutes');
    secondsInput = document.getElementById('seconds');
    paceMinutesInput = document.getElementById('pace-minutes');
    paceSecondsInput = document.getElementById('pace-seconds');
    speedInput = document.getElementById('speed');
    
    // 获取单位选择器元素（必须在设置事件监听器前获取）
    distanceUnitSelect = document.getElementById('distance-unit');
    paceUnitSelect = document.getElementById('pace-unit');
    speedUnitSelect = document.getElementById('speed-unit');
    
    // 获取结果显示区域和计算按钮元素
    calculateBtn = document.getElementById('calculate-btn');
    resultArea = document.getElementById('result-area');
    resultContent = document.getElementById('result-content');
    
    // 设置所有必要的事件监听器
    setupEventListeners();
    
    // 根据当前模式初始化表单元素的可见性
    updateFormVisibility();
    
    // 错误处理：验证关键DOM元素是否存在
    if (!distanceUnitSelect) {
        console.warn('距离单位选择器未找到');
    }
    if (!distanceInput) {
        console.warn('距离输入框未找到');
    }
}

// 设置事件监听器
/**
 * 设置所有必要的事件监听器
 * 为计算器的各个交互元素配置事件处理逻辑
 * @function setupEventListeners
 * @returns {void}
 */
function setupEventListeners() {
    // 模式切换按钮点击事件处理
    modeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            // 移除所有按钮的active类
            modeBtns.forEach(b => b.classList.remove('active'));
            // 为当前点击的按钮添加active类
            btn.classList.add('active');
            // 更新当前模式
            currentMode = btn.dataset.mode;
            // 根据新模式更新表单元素可见性
            updateFormVisibility();
        });
    });
    
    // 计算按钮点击事件 - 触发计算函数
    calculateBtn.addEventListener('click', calculate);
    
    // 为所有输入框添加键盘事件监听 - 支持回车触发计算
    document.querySelectorAll('input').forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                calculate();
            }
        });
    });
    
    // 常用距离下拉选项事件设置
    distanceDropdown = document.getElementById('distance-dropdown');
    if (distanceDropdown) {
        // 初始化下拉框选项
        populateDistanceDropdown();
        
        distanceDropdown.addEventListener('change', function() {
                    const selectedDistance = this.value;
                    if (selectedDistance) {
                        // 获取当前距离单位
                        const currentUnitVal = distanceUnitSelect.value;
                        
                        // 首先尝试在当前单位数组中查找
                        let selectedItem = null;
                        const currentUnitDistances = COMMON_DISTANCES[currentUnitVal] || [];
                        
                        // 遍历所有可能的距离数组，查找匹配的项目
                        // 这确保了无论选中的距离属于哪个单位组，我们都能找到正确的sourceUnit信息
                        const allUnits = ['m', 'km', 'mile'];
                        for (const unit of allUnits) {
                            const distances = COMMON_DISTANCES[unit] || [];
                            const foundItem = distances.find(item => 
                                item.value.toString() === selectedDistance || 
                                Math.abs(item.value - parseFloat(selectedDistance)) < 0.001
                            );
                            if (foundItem) {
                                selectedItem = foundItem;
                                break;
                            }
                        }
                        
                        if (selectedItem) {
                                // 直接使用selectedItem.value，因为COMMON_DISTANCES中的值已经是对应单位组的正确值
                                // 根据目标单位确定小数位数
                                let decimalPlaces;
                                if (currentUnitVal === 'm') {
                                    decimalPlaces = 0; // 米单位使用整数
                                } else if (currentUnitVal === 'km') {
                                    decimalPlaces = 4; // 公里单位保留4位小数，提高精度
                                } else if (currentUnitVal === 'mile') {
                                    decimalPlaces = 3; // 英里单位保留3位小数
                                } else {
                                    decimalPlaces = 2; // 其他单位默认保留2位小数
                                }
                                distanceInput.value = parseFloat(selectedItem.value).toFixed(decimalPlaces);
                                // 移除末尾多余的0和小数点，使显示更简洁
                                distanceInput.value = parseFloat(distanceInput.value).toString();
                            } else {
                                // 如果找不到对应的对象，直接使用选中的值
                                distanceInput.value = selectedDistance;
                        }
                        
                        // 选择完成后重置下拉框，方便再次选择
                        setTimeout(() => {
                            this.value = '';
                        }, 50);
                    }
                });
    }
    
    // 注意：单位选择器已经在initPaceCalculator中初始化
    // 这里不再重复获取，只进行验证
    
    // 单位切换事件监听器
    if (distanceUnitSelect) {
        // 确保在添加事件监听器之前设置初始previousUnit属性
        distanceUnitSelect.dataset.previousUnit = distanceUnitSelect.value;
        
        // 直接绑定函数而不是使用匿名函数包装，确保this引用正确
        distanceUnitSelect.addEventListener('change', function() {
            handleDistanceUnitChange.call(this); // 确保this指向distanceUnitSelect元素
            // 重新排序距离下拉框选项
            populateDistanceDropdown();
        });
    }
    
    // 米单位已在HTML中硬编码，无需JS动态添加
    
    if (paceUnitSelect) {
        paceUnitSelect.addEventListener('change', handlePaceUnitChange);
    }
    
    if (speedUnitSelect) {
        speedUnitSelect.addEventListener('change', handleSpeedUnitChange);
    }
}

// 更新表单可见性
/**
 * 更新表单元素的可见性和编辑状态
 * 根据当前计算模式动态设置各输入框的只读状态
 * 确保在不同计算模式下只有输入框可编辑，结果框只读
 * @function updateFormVisibility
 * @returns {void}
 */
function updateFormVisibility() {
    // 初始化：将所有输入框设置为可编辑状态
    distanceInput.readOnly = false;
    hoursInput.readOnly = false;
    minutesInput.readOnly = false;
    secondsInput.readOnly = false;
    paceMinutesInput.readOnly = false;
    paceSecondsInput.readOnly = false;
    speedInput.readOnly = false;
    
    // 根据当前计算模式设置相应输入框为只读
    if (currentMode === 'pace') {
        // 配速计算模式：配速为计算结果，应设为只读
        paceMinutesInput.readOnly = true;
        paceSecondsInput.readOnly = true;
    } else if (currentMode === 'distance') {
        // 距离计算模式：距离为计算结果，应设为只读
        distanceInput.readOnly = true;
    } else if (currentMode === 'time') {
        // 时间计算模式：时间为计算结果，应设为只读
        hoursInput.readOnly = true;
        minutesInput.readOnly = true;
        secondsInput.readOnly = true;
    } else if (currentMode === 'speed') {
        // 速度计算模式：速度为计算结果，应设为只读
        speedInput.readOnly = true;
    }
}

// 处理距离单位变化
function handleDistanceUnitChange() {
    // 确保在任何计算模式下都能进行单位转换，不仅限于特定模式
    if (distanceInput.value) {
        const currentDistance = parseFloat(distanceInput.value);
        
        // 检查输入是否有效
        if (!isNaN(currentDistance) && currentDistance > 0) {
            // 获取之前的单位，如果不存在则使用默认值'km'
            const fromUnit = this.dataset.previousUnit || 'km';
            const toUnit = this.value;
            
            // 只有当单位发生变化时才进行转换
            if (fromUnit !== toUnit) {
                // 直接进行单位转换
                const convertedDistance = convertDistance(currentDistance, fromUnit, toUnit);
                
                // 根据目标单位选择合适的精度处理方式
                if (toUnit === 'm') {
                    // 米单位使用整数形式，避免小数误差
                    distanceInput.value = Math.round(convertedDistance).toString();
                } else if (toUnit === 'km') {
                    // 公里单位保留4位小数，平衡精度和可读性
                    distanceInput.value = convertedDistance.toFixed(4);
                } else if (toUnit === 'mile') {
                    // 英里单位保留3位小数
                    distanceInput.value = convertedDistance.toFixed(3);
                } else {
                    // 其他单位使用2位小数
                    distanceInput.value = convertedDistance.toFixed(2);
                }
                
                // 移除末尾多余的0和小数点（如果需要）
                distanceInput.value = parseFloat(distanceInput.value).toString();
            }
        }
    }
    
    // 保存当前单位作为下一次转换的参考
    this.dataset.previousUnit = this.value;
    
    // 只有当存在足够的计算条件时才重新计算结果
    // 检查是否有距离值
    const hasDistance = distanceInput.value && !isNaN(parseFloat(distanceInput.value)) && parseFloat(distanceInput.value) > 0;
    // 检查是否有时间值（小时、分钟或秒中的至少一个）
    const hasHours = hoursInput.value && !isNaN(parseInt(hoursInput.value)) && parseInt(hoursInput.value) > 0;
    const hasMinutes = minutesInput.value && !isNaN(parseInt(minutesInput.value)) && parseInt(minutesInput.value) > 0;
    const hasSeconds = secondsInput.value && !isNaN(parseInt(secondsInput.value)) && parseInt(secondsInput.value) > 0;
    const hasTime = hasHours || hasMinutes || hasSeconds;
    // 检查是否有配速值
    const hasPace = paceMinutesInput.value && !isNaN(parseInt(paceMinutesInput.value)) && parseInt(paceMinutesInput.value) >= 0 &&
                   paceSecondsInput.value && !isNaN(parseInt(paceSecondsInput.value)) && parseInt(paceSecondsInput.value) >= 0;
    // 检查是否有速度值
    const hasSpeed = speedInput.value && !isNaN(parseFloat(speedInput.value)) && parseFloat(speedInput.value) > 0;
    
    // 根据当前模式决定是否需要重新计算
    const shouldRecalculate = 
        (currentMode === 'pace' && (hasDistance && hasTime || hasSpeed)) ||
        (currentMode === 'speed' && (hasDistance && hasTime || hasPace)) ||
        (currentMode === 'distance' && (hasTime && (hasPace || hasSpeed)));
    
    if (shouldRecalculate) {
        calculate();
    } else {
        // 显示初始提示信息
        resultContent.innerHTML = '<p>请输入数据并点击计算按钮。</p>';
        resultContent.classList.remove('error-message');
    }
}

// 填充距离下拉框
function populateDistanceDropdown() {
    if (!distanceDropdown || !distanceUnitSelect) return;
    
    // 清空现有选项
    distanceDropdown.innerHTML = '';
    
    // 添加空选项作为默认
    const emptyOption = document.createElement('option');
    emptyOption.value = '';
    emptyOption.textContent = '选择常用距离...';
    distanceDropdown.appendChild(emptyOption);
    
    const currentUnit = distanceUnitSelect.value;
    
    // 获取当前单位对应的距离列表
    const distances = COMMON_DISTANCES[currentUnit] || [];
    
    // 按原始单位分组距离列表
    const groupedDistances = {};
    distances.forEach(distance => {
        const sourceUnit = distance.sourceUnit || currentUnit;
        if (!groupedDistances[sourceUnit]) {
            groupedDistances[sourceUnit] = [];
        }
        groupedDistances[sourceUnit].push(distance);
    });
    
    // 定义分组的显示顺序和标题
    // 创建不包含重复单位的显示顺序数组
    const unitOrder = ['special', currentUnit];
    const allUnits = ['m', 'km', 'mile'];
    // 添加当前单位之外的其他单位
    allUnits.forEach(unit => {
        if (unit !== currentUnit && !unitOrder.includes(unit)) {
            unitOrder.push(unit);
        }
    });
    
    const unitLabels = {
        'special': '特殊距离',
        'm': '米制距离',
        'km': '公里制距离',
        'mile': '英里制距离'
    };
    
    // 按顺序创建分组和选项
    unitOrder.forEach(unit => {
        if (groupedDistances[unit] && groupedDistances[unit].length > 0) {
            // 创建分组标签
            const optgroup = document.createElement('optgroup');
            optgroup.label = unitLabels[unit] || unit;
            distanceDropdown.appendChild(optgroup);
            
            // 为每个分组添加距离选项
            groupedDistances[unit].forEach(distance => {
                const option = document.createElement('option');
                option.value = distance.value;
                option.textContent = distance.label;
                optgroup.appendChild(option);
            });
        }
    });
}

// 处理速度单位变化
function handleSpeedUnitChange() {
    const speedValue = parseFloat(speedInput.value);
    if (!isNaN(speedValue)) {
        let convertedSpeed;
        if (speedUnitSelect.value === 'kmh') {
            // 从英里/小时转换为公里/小时
            convertedSpeed = speedValue * UNIT_CONVERSIONS.mph_to_kmh;
        } else {
            // 从公里/小时转换为英里/小时
            convertedSpeed = speedValue * UNIT_CONVERSIONS.kmh_to_mph;
        }
        speedInput.value = convertedSpeed.toFixed(2);
        calculate();
    }
}

// 距离单位转换函数
function convertDistance(distance, fromUnit, toUnit) {
    if (fromUnit === toUnit) {
        return distance;
    }
    
    // 先转换为米作为中间单位
    let mValue;
    if (fromUnit === 'm') {
        mValue = distance;
    } else if (fromUnit === 'km') {
        mValue = distance * UNIT_CONVERSIONS.km_to_m;
    } else if (fromUnit === 'mile') {
        mValue = distance * UNIT_CONVERSIONS.mile_to_m;
    } else {
        return distance; // 未知单位
    }
    
    // 再转换为目标单位
    if (toUnit === 'm') {
        return mValue;
    } else if (toUnit === 'km') {
        return mValue * UNIT_CONVERSIONS.m_to_km;
    } else if (toUnit === 'mile') {
        return mValue * UNIT_CONVERSIONS.m_to_mile;
    }
    
    return distance; // 未知单位
}

// 处理配速单位变化
function handlePaceUnitChange() {
    if (paceMinutesInput.value && paceSecondsInput.value) {
        const paceMinutes = parseInt(paceMinutesInput.value);
        const paceSeconds = parseInt(paceSecondsInput.value);
        const totalPaceSeconds = paceMinutes * 60 + paceSeconds;
        const fromUnit = this.dataset.previousUnit || 'km';
        const toUnit = this.value;
        
        if (fromUnit !== toUnit) {
            // 配速转换：如果从公里转换到英里，配速时间会增加（因为英里比公里长）
            let convertedPaceSeconds;
            if (fromUnit === 'km' && toUnit === 'mile') {
                convertedPaceSeconds = totalPaceSeconds * UNIT_CONVERSIONS.mile_to_km;
            } else if (fromUnit === 'mile' && toUnit === 'km') {
                convertedPaceSeconds = totalPaceSeconds * UNIT_CONVERSIONS.km_to_mile;
            }
            
            const newMinutes = Math.floor(convertedPaceSeconds / 60);
            const newSeconds = Math.round(convertedPaceSeconds % 60);
            
            paceMinutesInput.value = newMinutes;
            paceSecondsInput.value = newSeconds;
        }
    }
    
    // 保存当前单位作为下一次转换的参考
    this.dataset.previousUnit = this.value;
}

// 计算函数
function calculate() {
    try {
        let result = '';
        const distanceUnit = distanceUnitSelect.value;
        const paceUnit = paceUnitSelect.value;
        const speedUnit = speedUnitSelect.value;
        
        // 获取所有输入值
        const distance = parseFloat(distanceInput.value);
        const hours = parseInt(hoursInput.value) || 0;
        const minutes = parseInt(minutesInput.value) || 0;
        const seconds = parseInt(secondsInput.value) || 0;
        const paceMinutes = parseInt(paceMinutesInput.value) || 0;
        const paceSecs = parseInt(paceSecondsInput.value) || 0;
        const speedValue = parseFloat(speedInput.value);
        const hasPace = paceMinutes > 0 || paceSecs > 0;
        const hasSpeed = !isNaN(speedValue) && speedValue > 0;
        const hasDistance = !isNaN(distance) && distance > 0;
        const hasTime = hours > 0 || minutes > 0 || seconds > 0;
        const totalSeconds = hours * 3600 + minutes * 60 + seconds;
        
        // 辅助函数：获取配速单位文本
        function getPaceUnitText(unit) {
            switch (unit) {
                case 'km': return '公里';
                case 'mile': return '英里';
                case 'm': return '米';
                default: return unit;
            }
        }
        
        // 通用函数：根据配速计算速度
        function calculateSpeedFromPace(pMinutes, pSeconds) {
            const totalPaceSeconds = pMinutes * 60 + pSeconds;
            
            // 计算速度（公里/小时），先转换为米为单位的计算
            let speedKmh;
            if (paceUnit === 'km') {
                speedKmh = 3600 / totalPaceSeconds;
            } else if (paceUnit === 'mile') {
                // 英里配速转公里/小时：1小时跑多少英里 * 英里到公里的转换系数
                speedKmh = (3600 / totalPaceSeconds) * UNIT_CONVERSIONS.mile_to_km;
            } else if (paceUnit === 'm') {
                // 米配速转公里/小时
                speedKmh = (3600 / totalPaceSeconds) * UNIT_CONVERSIONS.m_to_km;
            }
            
            let displaySpeed = speedKmh;
            let speedUnitText = '公里/小时';
            
            if (speedUnit === 'mph') {
                displaySpeed = speedKmh * UNIT_CONVERSIONS.kmh_to_mph;
                speedUnitText = '英里/小时';
            }
            
            return { speedKmh, displaySpeed, speedUnitText };
        }
        
        // 通用函数：根据速度计算配速
        function calculatePaceFromSpeed(speedVal) {
            // 转换为公里/小时
            let speedKmh = speedVal;
            if (speedUnit === 'mph') {
                speedKmh = speedVal * UNIT_CONVERSIONS.mph_to_kmh;
            }
            
            // 计算配速（秒/单位距离）
            let paceSecondsPerUnit;
            if (paceUnit === 'km') {
                paceSecondsPerUnit = 3600 / speedKmh;
            } else if (paceUnit === 'mile') {
                // 公里/小时转英里配速
                paceSecondsPerUnit = (3600 / speedKmh) * UNIT_CONVERSIONS.mile_to_km;
            } else if (paceUnit === 'm') {
                // 公里/小时转米配速
                paceSecondsPerUnit = 3600 / (speedKmh * UNIT_CONVERSIONS.km_to_m);
            }
            
            const calculatedPaceMinutes = Math.floor(paceSecondsPerUnit / 60);
            const calculatedPaceSecs = Math.round(paceSecondsPerUnit % 60);
            
            return { calculatedPaceMinutes, calculatedPaceSecs, paceSecondsPerUnit };
        }
        
        // 通用函数：根据距离和时间计算速度和配速
        function calculateFromDistanceAndTime(dist, timeSecs) {
            // 统一转换为米作为中间单位
            const distanceInMeters = convertDistance(dist, distanceUnit, 'm');
            
            // 计算速度（公里/小时）
            const speedKmh = (distanceInMeters / timeSecs) * UNIT_CONVERSIONS.m_to_km * 3600;
            
            // 转换速度为显示单位
            let displaySpeed = speedKmh;
            let speedUnitText = '公里/小时';
            if (speedUnit === 'mph') {
                displaySpeed = speedKmh * UNIT_CONVERSIONS.kmh_to_mph;
                speedUnitText = '英里/小时';
            }
            
            // 计算配速（秒/单位距离）
            let paceSecondsPerUnit;
            if (paceUnit === 'km') {
                // 转换距离到公里
                const distanceInKm = distanceInMeters * UNIT_CONVERSIONS.m_to_km;
                paceSecondsPerUnit = timeSecs / distanceInKm;
            } else if (paceUnit === 'mile') {
                // 转换距离到英里
                const distanceInMiles = distanceInMeters * UNIT_CONVERSIONS.m_to_mile;
                paceSecondsPerUnit = timeSecs / distanceInMiles;
            } else if (paceUnit === 'm') {
                // 直接使用米距离
                paceSecondsPerUnit = timeSecs / distanceInMeters;
            }
            
            const calculatedPaceMinutes = Math.floor(paceSecondsPerUnit / 60);
            const calculatedPaceSecs = Math.round(paceSecondsPerUnit % 60);
            
            return { 
                speedKmh, 
                displaySpeed, 
                speedUnitText,
                calculatedPaceMinutes,
                calculatedPaceSecs,
                paceSecondsPerUnit,
                distanceInMeters
            };
        }
        
        // 根据不同的计算模式进行处理
        switch(currentMode) {
            case 'pace':
                // 计算配速模式
                if (hasDistance && hasTime) {
                    // 有距离和时间，使用它们计算配速和速度
                    const { displaySpeed, speedUnitText, calculatedPaceMinutes, calculatedPaceSecs } = calculateFromDistanceAndTime(distance, totalSeconds);
                    
                    result = `
                        <div class="result-item">
                            <h4>配速结果：</h4>
                            <p>距离：<strong>${distance}</strong> ${getPaceUnitText(distanceUnit)}</p>
                            <p>时间：<strong>${formatTime(hours, minutes, seconds)}</strong></p>
                            <p>您的配速为 <strong>${formatNumber(calculatedPaceMinutes)}:${formatNumber(calculatedPaceSecs)}</strong> 分钟/${getPaceUnitText(paceUnit)}</p>
                            <p>您的速度为 <strong>${displaySpeed.toFixed(2)}</strong> ${speedUnitText}</p>
                        </div>
                    `;
                    
                    // 更新配速和速度输入框
                    paceMinutesInput.value = calculatedPaceMinutes;
                    paceSecondsInput.value = calculatedPaceSecs;
                    speedInput.value = displaySpeed.toFixed(2);
                } else if (hasSpeed && hasDistance) {
                    // 有速度和距离，但没有时间，计算配速和时间
                    const { calculatedPaceMinutes, calculatedPaceSecs } = calculatePaceFromSpeed(speedValue);
                    
                    // 计算时间
                    const distanceInMeters = convertDistance(distance, distanceUnit, 'm');
                    // 将速度转换为米/秒
                    let speedMps;
                    if (speedUnit === 'kmh') {
                        speedMps = speedValue * UNIT_CONVERSIONS.kmh_to_ms;
                    } else if (speedUnit === 'mph') {
                        // 英里/小时转换为米/秒 = 英里/小时 * 英里到公里转换 * 公里/小时到米/秒转换
                        speedMps = speedValue * UNIT_CONVERSIONS.mph_to_kmh * UNIT_CONVERSIONS.kmh_to_ms;
                    }
                    
                    const calculatedTimeSecs = distanceInMeters / speedMps;
                    const calculatedHours = Math.floor(calculatedTimeSecs / 3600);
                    const remainingSeconds = calculatedTimeSecs % 3600;
                    const calculatedMinutes = Math.floor(remainingSeconds / 60);
                    const calculatedSeconds = Math.round(remainingSeconds % 60);
                    
                    result = `
                        <div class="result-item">
                            <h4>配速结果：</h4>
                            <p>距离：<strong>${distance}</strong> ${getPaceUnitText(distanceUnit)}</p>
                            <p>速度：<strong>${speedValue.toFixed(2)}</strong> ${speedUnit === 'kmh' ? '公里/小时' : '英里/小时'}</p>
                            <p>您的配速为 <strong>${formatNumber(calculatedPaceMinutes)}:${formatNumber(calculatedPaceSecs)}</strong> 分钟/${getPaceUnitText(paceUnit)}</p>
                            <p><strong>以${formatNumber(calculatedPaceMinutes)}:${formatNumber(calculatedPaceSecs)} 分钟/${getPaceUnitText(paceUnit)}完成${distance} ${getPaceUnitText(distanceUnit)}需要：</strong> ${formatTime(calculatedHours, calculatedMinutes, calculatedSeconds)}</p>
                        </div>
                    `;
                    
                    paceMinutesInput.value = calculatedPaceMinutes;
                    paceSecondsInput.value = calculatedPaceSecs;
                    // 更新时间输入框
                    hoursInput.value = calculatedHours || '';
                    minutesInput.value = calculatedMinutes || '';
                    secondsInput.value = calculatedSeconds || '';
                } else if (hasSpeed && hasTime) {
                    // 有速度和时间，但没有距离，计算配速和距离
                    const { calculatedPaceMinutes, calculatedPaceSecs } = calculatePaceFromSpeed(speedValue);
                    
                    // 计算距离
                    // 将速度转换为米/秒
                    let speedMps;
                    if (speedUnit === 'kmh') {
                        speedMps = speedValue * UNIT_CONVERSIONS.kmh_to_ms;
                    } else if (speedUnit === 'mph') {
                        // 英里/小时转换为米/秒 = 英里/小时 * 英里到公里转换 * 公里/小时到米/秒转换
                        speedMps = speedValue * UNIT_CONVERSIONS.mph_to_kmh * UNIT_CONVERSIONS.kmh_to_ms;
                    }
                    
                    const calculatedDistanceInMeters = speedMps * totalSeconds;
                    const displayDistance = convertDistance(calculatedDistanceInMeters, 'm', distanceUnit);
                    // 根据单位确定小数位数
                    const decimalPlaces = distanceUnit === 'm' ? 0 : 2;
                    
                    result = `
                        <div class="result-item">
                            <h4>配速结果：</h4>
                            <p>时间：<strong>${formatTime(hours, minutes, seconds)}</strong></p>
                            <p>速度：<strong>${speedValue.toFixed(2)}</strong> ${speedUnit === 'kmh' ? '公里/小时' : '英里/小时'}</p>
                            <p>您的配速为 <strong>${formatNumber(calculatedPaceMinutes)}:${formatNumber(calculatedPaceSecs)}</strong> 分钟/${getPaceUnitText(paceUnit)}</p>
                            <p><strong>以${formatNumber(calculatedPaceMinutes)}:${formatNumber(calculatedPaceSecs)} 分钟/${getPaceUnitText(paceUnit)}行进${formatTime(hours, minutes, seconds)}可以完成距离：</strong> ${displayDistance.toFixed(decimalPlaces)} ${getPaceUnitText(distanceUnit)}</p>
                        </div>
                    `;
                    
                    paceMinutesInput.value = calculatedPaceMinutes;
                    paceSecondsInput.value = calculatedPaceSecs;
                    // 更新距离输入框
                    distanceInput.value = displayDistance.toFixed(decimalPlaces);
                } else if (hasSpeed) {
                    // 距离和时间不都有值，但有速度值，使用速度计算配速
                    const { calculatedPaceMinutes, calculatedPaceSecs } = calculatePaceFromSpeed(speedValue);
                    
                    result = `
                        <div class="result-item">
                            <h4>配速结果：</h4>
                            <p>以速度 <strong>${speedValue.toFixed(2)}</strong> ${speedUnit === 'kmh' ? '公里/小时' : '英里/小时'}</p>
                            <p>您的配速为 <strong>${formatNumber(calculatedPaceMinutes)}:${formatNumber(calculatedPaceSecs)}</strong> 分钟/${getPaceUnitText(paceUnit)}</p>
                        </div>
                    `;
                    
                    paceMinutesInput.value = calculatedPaceMinutes;
                    paceSecondsInput.value = calculatedPaceSecs;
                } else {
                    showError('请输入距离和时间，或者输入速度值来计算配速');
                    return;
                }
                break;
                
            case 'speed':
                // 计算速度模式
                if (hasDistance && hasTime) {
                    // 有距离和时间，使用它们计算配速和速度
                    const { displaySpeed, speedUnitText, calculatedPaceMinutes, calculatedPaceSecs } = calculateFromDistanceAndTime(distance, totalSeconds);
                    
                    result = `
                        <div class="result-item">
                            <h4>速度结果：</h4>
                            <p>距离：<strong>${distance}</strong> ${getPaceUnitText(distanceUnit)}</p>
                            <p>时间：<strong>${formatTime(hours, minutes, seconds)}</strong></p>
                            <p>您的配速为 <strong>${formatNumber(calculatedPaceMinutes)}:${formatNumber(calculatedPaceSecs)}</strong> 分钟/${getPaceUnitText(paceUnit)}</p>
                            <p>您的速度为 <strong>${displaySpeed.toFixed(2)}</strong> ${speedUnitText}</p>
                        </div>
                    `;
                    
                    // 更新配速和速度输入框
                    paceMinutesInput.value = calculatedPaceMinutes;
                    paceSecondsInput.value = calculatedPaceSecs;
                    speedInput.value = displaySpeed.toFixed(2);
                } else if (hasPace && hasDistance) {
                    // 优先使用配速和距离计算
                    const { displaySpeed, speedUnitText } = calculateSpeedFromPace(paceMinutes, paceSecs);
                    
                    // 计算时间
                    const paceTotalSeconds = paceMinutes * 60 + paceSecs;
                    let distanceInTargetUnit;
                    
                    // 根据配速单位和距离单位进行转换
                    if (paceUnit === 'km' && distanceUnit === 'miles') {
                        // 配速是公里配速，距离是英里，需要转换距离到公里
                        distanceInTargetUnit = distance * UNIT_CONVERSIONS.mile_to_km;
                    } else if (paceUnit === 'mile' && distanceUnit === 'km') {
                        // 配速是英里配速，距离是公里，需要转换距离到英里
                        distanceInTargetUnit = distance * UNIT_CONVERSIONS.km_to_mile;
                    } else {
                        // 单位一致，直接使用
                        distanceInTargetUnit = distance;
                    }
                    
                    const calculatedTimeSecs = paceTotalSeconds * distanceInTargetUnit;
                    const calculatedHours = Math.floor(calculatedTimeSecs / 3600);
                    const remainingSeconds = calculatedTimeSecs % 3600;
                    const calculatedMinutes = Math.floor(remainingSeconds / 60);
                    const calculatedSeconds = Math.round(remainingSeconds % 60);
                    
                    result = `
                        <div class="result-item">
                            <h4>速度结果：</h4>
                            <p>距离：<strong>${distance}</strong> ${getPaceUnitText(distanceUnit)}</p>
                            <p>配速：<strong>${formatNumber(paceMinutes)}:${formatNumber(paceSecs)}</strong> 分钟/${getPaceUnitText(paceUnit)}</p>
                            <p>您的速度为 <strong>${displaySpeed.toFixed(2)}</strong> ${speedUnitText}</p>
                            <p><strong>以${formatNumber(paceMinutes)}:${formatNumber(paceSecs)} 分钟/${getPaceUnitText(paceUnit)}完成${distance} ${getPaceUnitText(distanceUnit)}需要：</strong> ${formatTime(calculatedHours, calculatedMinutes, calculatedSeconds)}</p>
                        </div>
                    `;
                    
                    // 更新速度输入框（根据配速计算得出）
                    speedInput.value = displaySpeed.toFixed(2);
                    
                    // 更新时间输入框
                    hoursInput.value = calculatedHours || '';
                    minutesInput.value = calculatedMinutes || '';
                    secondsInput.value = calculatedSeconds || '';
                } else if (hasPace && hasTime) {
                    // 优先使用配速和时间计算
                    const { displaySpeed, speedUnitText } = calculateSpeedFromPace(paceMinutes, paceSecs);
                    
                    // 计算距离
                    const paceTotalSeconds = paceMinutes * 60 + paceSecs;
                    let distanceInTargetUnit = totalSeconds / paceTotalSeconds;
                    
                    // 根据配速单位转换到目标距离单位
                    let displayDistance;
                    if (paceUnit === 'km' && distanceUnit === 'miles') {
                        // 配速是公里配速，需要转换到英里距离
                        displayDistance = distanceInTargetUnit * UNIT_CONVERSIONS.km_to_mile;
                    } else if (paceUnit === 'mile' && distanceUnit === 'km') {
                        // 配速是英里配速，需要转换到公里距离
                        displayDistance = distanceInTargetUnit * UNIT_CONVERSIONS.mile_to_km;
                    } else {
                        // 单位一致
                        displayDistance = distanceInTargetUnit;
                    }
                    
                    // 根据单位确定小数位数
                    const decimalPlaces = distanceUnit === 'm' ? 0 : 2;
                    
                    result = `
                        <div class="result-item">
                            <h4>速度结果：</h4>
                            <p>时间：<strong>${formatTime(hours, minutes, seconds)}</strong></p>
                            <p>配速：<strong>${formatNumber(paceMinutes)}:${formatNumber(paceSecs)}</strong> 分钟/${getPaceUnitText(paceUnit)}</p>
                            <p>您的速度为 <strong>${displaySpeed.toFixed(2)}</strong> ${speedUnitText}</p>
                            <p><strong>以${formatNumber(paceMinutes)}:${formatNumber(paceSecs)} 分钟/${getPaceUnitText(paceUnit)}行进${formatTime(hours, minutes, seconds)}可以完成距离：</strong> ${displayDistance.toFixed(decimalPlaces)} ${getPaceUnitText(distanceUnit)}</p>
                        </div>
                    `;
                    
                    // 更新速度输入框（根据配速计算得出）
                    speedInput.value = displaySpeed.toFixed(2);
                    
                    // 更新距离输入框
                    distanceInput.value = displayDistance.toFixed(decimalPlaces);
                } else if (hasSpeed && hasDistance) {
                    // 只有速度和距离（没有配速），计算速度和时间
                    // 将距离转换为米
                    const distanceInMeters = convertDistance(distance, distanceUnit, 'm');
                    
                    // 将速度转换为米/秒
                    let speedMps;
                    if (speedUnit === 'kmh') {
                        speedMps = speedValue * UNIT_CONVERSIONS.kmh_to_ms;
                    } else if (speedUnit === 'mph') {
                        // 英里/小时转换为米/秒 = 英里/小时 * 英里到公里转换 * 公里/小时到米/秒转换
                        speedMps = speedValue * UNIT_CONVERSIONS.mph_to_kmh * UNIT_CONVERSIONS.kmh_to_ms;
                    }
                    
                    const calculatedTimeSecs = distanceInMeters / speedMps;
                    const calculatedHours = Math.floor(calculatedTimeSecs / 3600);
                    const remainingSeconds = calculatedTimeSecs % 3600;
                    const calculatedMinutes = Math.floor(remainingSeconds / 60);
                    const calculatedSeconds = Math.round(remainingSeconds % 60);
                    
                    // 计算配速
                    const paceResult = calculatePaceFromSpeed(speedValue);
                    
                    result = `
                        <div class="result-item">
                            <h4>速度结果：</h4>
                            <p>距离：<strong>${distance}</strong> ${getPaceUnitText(distanceUnit)}</p>
                            <p>您的速度为 <strong>${speedValue.toFixed(2)}</strong> ${speedUnit === 'kmh' ? '公里/小时' : '英里/小时'}</p>
                            <p><strong>以${speedValue.toFixed(2)} ${speedUnit === 'kmh' ? '公里/小时' : '英里/小时'}完成${distance} ${getPaceUnitText(distanceUnit)}需要：</strong> ${formatTime(calculatedHours, calculatedMinutes, calculatedSeconds)}</p>
                        </div>
                    `;
                    
                    // 更新配速输入框（根据速度计算得出）
                    paceMinutesInput.value = paceResult.calculatedPaceMinutes;
                    paceSecondsInput.value = paceResult.calculatedPaceSecs;
                    
                    // 更新时间输入框
                    hoursInput.value = calculatedHours || '';
                    minutesInput.value = calculatedMinutes || '';
                    secondsInput.value = calculatedSeconds || '';
                } else if (hasSpeed && hasTime) {
                    // 只有速度和时间（没有配速），计算速度和距离
                    // 将速度转换为米/秒
                    let speedMps;
                    if (speedUnit === 'kmh') {
                        speedMps = speedValue * UNIT_CONVERSIONS.kmh_to_ms;
                    } else if (speedUnit === 'mph') {
                        // 英里/小时转换为米/秒 = 英里/小时 * 英里到公里转换 * 公里/小时到米/秒转换
                        speedMps = speedValue * UNIT_CONVERSIONS.mph_to_kmh * UNIT_CONVERSIONS.kmh_to_ms;
                    }
                    
                    const calculatedDistanceInMeters = speedMps * totalSeconds;
                    const displayDistance = convertDistance(calculatedDistanceInMeters, 'm', distanceUnit);
                    // 根据单位确定小数位数
                    const decimalPlaces = distanceUnit === 'm' ? 0 : 2;
                    
                    // 计算配速
                    const paceResult = calculatePaceFromSpeed(speedValue);
                    
                    result = `
                        <div class="result-item">
                            <h4>速度结果：</h4>
                            <p>时间：<strong>${formatTime(hours, minutes, seconds)}</strong></p>
                            <p>您的速度为 <strong>${speedValue.toFixed(2)}</strong> ${speedUnit === 'kmh' ? '公里/小时' : '英里/小时'}</p>
                            <p><strong>以${speedValue.toFixed(2)} ${speedUnit === 'kmh' ? '公里/小时' : '英里/小时'}行进${formatTime(hours, minutes, seconds)}可以完成距离：</strong> ${displayDistance.toFixed(decimalPlaces)} ${getPaceUnitText(distanceUnit)}</p>
                        </div>
                    `;
                    
                    // 更新配速输入框（根据速度计算得出）
                    paceMinutesInput.value = paceResult.calculatedPaceMinutes;
                    paceSecondsInput.value = paceResult.calculatedPaceSecs;
                    
                    // 更新距离输入框
                    distanceInput.value = displayDistance.toFixed(decimalPlaces);
                } else if (hasPace && hasDistance) {
                    // 有配速和距离，但没有时间，计算速度和时间
                    const { displaySpeed, speedUnitText } = calculateSpeedFromPace(paceMinutes, paceSecs);
                    
                    // 计算时间
                    const paceTotalSeconds = paceMinutes * 60 + paceSecs;
                    let distanceInTargetUnit;
                    
                    // 根据配速单位和距离单位进行转换
                    if (paceUnit === 'km' && distanceUnit === 'miles') {
                        // 配速是公里配速，距离是英里，需要转换距离到公里
                        distanceInTargetUnit = distance * UNIT_CONVERSIONS.mile_to_km;
                    } else if (paceUnit === 'mile' && distanceUnit === 'km') {
                        // 配速是英里配速，距离是公里，需要转换距离到英里
                        distanceInTargetUnit = distance * UNIT_CONVERSIONS.km_to_mile;
                    } else {
                        // 单位一致，直接使用
                        distanceInTargetUnit = distance;
                    }
                    
                    const calculatedTimeSecs = paceTotalSeconds * distanceInTargetUnit;
                    const calculatedHours = Math.floor(calculatedTimeSecs / 3600);
                    const remainingSeconds = calculatedTimeSecs % 3600;
                    const calculatedMinutes = Math.floor(remainingSeconds / 60);
                    const calculatedSeconds = Math.round(remainingSeconds % 60);
                    
                    result = `
                        <div class="result-item">
                            <h4>速度结果：</h4>
                            <p>距离：<strong>${distance}</strong> ${getPaceUnitText(distanceUnit)}</p>
                            <p>配速：<strong>${formatNumber(paceMinutes)}:${formatNumber(paceSecs)}</strong> 分钟/${getPaceUnitText(paceUnit)}</p>
                            <p>您的速度为 <strong>${displaySpeed.toFixed(2)}</strong> ${speedUnitText}</p>
                            <p><strong>以${formatNumber(paceMinutes)}:${formatNumber(paceSecs)} 分钟/${getPaceUnitText(paceUnit)}完成${distance} ${getPaceUnitText(distanceUnit)}需要：</strong> ${formatTime(calculatedHours, calculatedMinutes, calculatedSeconds)}</p>
                        </div>
                    `;
                    
                    speedInput.value = displaySpeed.toFixed(2);
                    // 更新时间输入框
                    hoursInput.value = calculatedHours || '';
                    minutesInput.value = calculatedMinutes || '';
                    secondsInput.value = calculatedSeconds || '';
                } else if (hasPace && hasTime) {
                    // 有配速和时间，但没有距离，计算速度和距离
                    const { displaySpeed, speedUnitText } = calculateSpeedFromPace(paceMinutes, paceSecs);
                    
                    // 计算距离
                    const paceTotalSeconds = paceMinutes * 60 + paceSecs;
                    let distanceInTargetUnit = totalSeconds / paceTotalSeconds;
                    
                    // 根据配速单位转换到目标距离单位
                    let displayDistance;
                    if (paceUnit === 'km' && distanceUnit === 'miles') {
                        // 配速是公里配速，需要转换到英里距离
                        displayDistance = distanceInTargetUnit * UNIT_CONVERSIONS.km_to_mile;
                    } else if (paceUnit === 'mile' && distanceUnit === 'km') {
                        // 配速是英里配速，需要转换到公里距离
                        displayDistance = distanceInTargetUnit * UNIT_CONVERSIONS.mile_to_km;
                    } else {
                        // 单位一致
                        displayDistance = distanceInTargetUnit;
                    }
                    
                    // 根据单位确定小数位数
                    const decimalPlaces = distanceUnit === 'm' ? 0 : 2;
                    
                    result = `
                        <div class="result-item">
                            <h4>速度结果：</h4>
                            <p>时间：<strong>${formatTime(hours, minutes, seconds)}</strong></p>
                            <p>配速：<strong>${formatNumber(paceMinutes)}:${formatNumber(paceSecs)}</strong> 分钟/${getPaceUnitText(paceUnit)}</p>
                            <p>您的速度为 <strong>${displaySpeed.toFixed(2)}</strong> ${speedUnitText}</p>
                            <p><strong>以${formatNumber(paceMinutes)}:${formatNumber(paceSecs)} 分钟/${getPaceUnitText(paceUnit)}行进${formatTime(hours, minutes, seconds)}可以完成距离：</strong> ${displayDistance.toFixed(decimalPlaces)} ${getPaceUnitText(distanceUnit)}</p>
                        </div>
                    `;
                    
                    speedInput.value = displaySpeed.toFixed(2);
                    // 更新距离输入框
                    distanceInput.value = displayDistance.toFixed(decimalPlaces);
                } else if (hasPace) {
                    // 距离和时间不都有值，但有配速值，使用配速计算速度
                    const { displaySpeed, speedUnitText } = calculateSpeedFromPace(paceMinutes, paceSecs);
                    
                    result = `
                        <div class="result-item">
                            <h4>速度结果：</h4>
                            <p>以配速 <strong>${formatNumber(paceMinutes)}:${formatNumber(paceSecs)}</strong> 分钟/${getPaceUnitText(paceUnit)}</p>
                            <p>您的速度为 <strong>${displaySpeed.toFixed(2)}</strong> ${speedUnitText}</p>
                        </div>
                    `;
                    
                    speedInput.value = displaySpeed.toFixed(2);
                } else {
                    showError('请输入距离和时间，或者输入配速值来计算速度');
                    return;
                }
                break;
                
            case 'distance':
                // 计算距离模式
                if (hasTime && (hasPace || hasSpeed)) {
                    let effectivePaceMinutes, effectivePaceSecs;
                    
                    // 优先使用配速，如果配速和速度都有且不一致
                    if (hasPace && hasSpeed) {
                        // 配速和速度都有，使用配速计算
                        effectivePaceMinutes = paceMinutes;
                        effectivePaceSecs = paceSecs;
                    } else if (hasPace) {
                        // 只有配速，直接使用
                        effectivePaceMinutes = paceMinutes;
                        effectivePaceSecs = paceSecs;
                    } else {
                        // 只有速度，先计算配速
                        const paceResult = calculatePaceFromSpeed(speedValue);
                        effectivePaceMinutes = paceResult.calculatedPaceMinutes;
                        effectivePaceSecs = paceResult.calculatedPaceSecs;
                        
                        // 更新配速输入框
                        paceMinutesInput.value = effectivePaceMinutes;
                        paceSecondsInput.value = effectivePaceSecs;
                    }
                    
                    // 计算配速总秒数
                    const totalPaceSeconds = effectivePaceMinutes * 60 + effectivePaceSecs;
                    
                    // 计算距离（米）
                    let distanceInMeters;
                    if (paceUnit === 'km') {
                        // 公里配速，计算公里距离再转米
                        const distanceInKm = totalSeconds / totalPaceSeconds;
                        distanceInMeters = distanceInKm * UNIT_CONVERSIONS.km_to_m;
                    } else if (paceUnit === 'mile') {
                        // 英里配速，计算英里距离再转米
                        const distanceInMiles = totalSeconds / (totalPaceSeconds * UNIT_CONVERSIONS.mile_to_km);
                        distanceInMeters = distanceInMiles * UNIT_CONVERSIONS.mile_to_m;
                    } else if (paceUnit === 'm') {
                        // 米配速，直接计算米距离
                        distanceInMeters = totalSeconds / totalPaceSeconds;
                    }
                    
                    // 根据目标距离单位转换
                    const displayDistance = convertDistance(distanceInMeters, 'm', distanceUnit);
                    const distanceUnitText = getPaceUnitText(distanceUnit);
                    
                    // 根据单位确定小数位数
                    let decimalPlaces = distanceUnit === 'm' ? 0 : 2;
                    
                    result = `
                        <div class="result-item">
                            <h4>距离结果：</h4>
                            <p>时间：<strong>${formatTime(hours, minutes, seconds)}</strong></p>
                            <p>配速：<strong>${formatNumber(effectivePaceMinutes)}:${formatNumber(effectivePaceSecs)}</strong> 分钟/${getPaceUnitText(paceUnit)}</p>
                            <p>您能完成的距离为 <strong>${displayDistance.toFixed(decimalPlaces)}</strong> ${distanceUnitText}</p>
                        </div>
                    `;
                    
                    distanceInput.value = displayDistance.toFixed(decimalPlaces);
                } else {
                    showError('请输入时间，以及配速或速度中的至少一项');
                    return;
                }
                break;
                
            case 'time':
                // 计算时间模式
                if (hasDistance && (hasPace || hasSpeed)) {
                    let effectivePaceMinutes, effectivePaceSecs;
                    
                    // 优先使用配速，如果配速和速度都有且不一致
                    if (hasPace && hasSpeed) {
                        // 配速和速度都有，使用配速计算
                        effectivePaceMinutes = paceMinutes;
                        effectivePaceSecs = paceSecs;
                    } else if (hasPace) {
                        // 只有配速，直接使用
                        effectivePaceMinutes = paceMinutes;
                        effectivePaceSecs = paceSecs;
                    } else {
                        // 只有速度，先计算配速
                        const paceResult = calculatePaceFromSpeed(speedValue);
                        effectivePaceMinutes = paceResult.calculatedPaceMinutes;
                        effectivePaceSecs = paceResult.calculatedPaceSecs;
                        
                        // 更新配速输入框
                        paceMinutesInput.value = effectivePaceMinutes;
                        paceSecondsInput.value = effectivePaceSecs;
                    }
                    
                    // 计算配速总秒数
                    const totalPaceSeconds = effectivePaceMinutes * 60 + effectivePaceSecs;
                    
                    // 转换输入距离为统一的米单位
                    const distanceInMeters = convertDistance(distance, distanceUnit, 'm');
                    
                    // 根据配速单位计算总时间
                    let totalTimeSeconds;
                    if (paceUnit === 'km') {
                        // 公里配速：将米转换为公里
                        const distanceInKm = distanceInMeters * UNIT_CONVERSIONS.m_to_km;
                        totalTimeSeconds = distanceInKm * totalPaceSeconds;
                    } else if (paceUnit === 'mile') {
                        // 英里配速：将米转换为英里
                        const distanceInMiles = distanceInMeters * UNIT_CONVERSIONS.m_to_mile;
                        totalTimeSeconds = distanceInMiles * totalPaceSeconds;
                    } else if (paceUnit === 'm') {
                        // 米配速：直接使用米距离
                        totalTimeSeconds = distanceInMeters * totalPaceSeconds;
                    }
                    
                    // 转换总秒数为时分秒
                    const calculatedHours = Math.floor(totalTimeSeconds / 3600);
                    const remainingSeconds = totalTimeSeconds % 3600;
                    const calculatedMinutes = Math.floor(remainingSeconds / 60);
                    const calculatedSeconds = Math.round(remainingSeconds % 60);
                    
                    result = `
                        <div class="result-item">
                            <h4>时间结果：</h4>
                            <p>距离：<strong>${distance}</strong> ${getPaceUnitText(distanceUnit)}</p>
                            <p>配速：<strong>${formatNumber(effectivePaceMinutes)}:${formatNumber(effectivePaceSecs)}</strong> 分钟/${getPaceUnitText(paceUnit)}</p>
                            <p>所需时间为 <strong>${formatTime(calculatedHours, calculatedMinutes, calculatedSeconds)}</strong></p>
                        </div>
                    `;
                    
                    // 更新时间输入框
                    hoursInput.value = calculatedHours || '';
                    minutesInput.value = calculatedMinutes || '';
                    secondsInput.value = calculatedSeconds || '';
                } else {
                    showError('请输入距离，以及配速或速度中的至少一项');
                    return;
                }
                break;
                
            default:
                showError('未知的计算模式');
                return;
        }
        
        // 显示计算结果
        showResult(result);
    } catch (error) {
        showError('计算过程中出现错误，请检查输入数据');
        console.error(error);
    }
}

// 格式化数字为两位数
function formatNumber(num) {
    return num.toString().padStart(2, '0');
}

// 格式化时间显示
function formatTime(hours, minutes, seconds) {
    return `${hours > 0 ? formatNumber(hours) + ':' : ''}${formatNumber(minutes)}:${formatNumber(seconds)}`;
}

// 分段距离数据（公里和英里单位）
// 根据结束点获取最大距离值
function getMaxDistanceByEndPoint(unit, endPoint) {
    // 如果endPoint是数字，直接返回该值
    if (typeof endPoint === 'number') {
        return endPoint;
    }
    
    // 否则按原来的方式处理预设值
    if (unit === 'km') {
        switch (endPoint) {
            case 'half': return 21.0975; // 半程马拉松
            case 'marathon': return 42.195; // 全程马拉松
            case '100km': return 100; // 百公里
            default: return 42.195; // 默认全程马拉松
        }
    } else { // mile
        switch (endPoint) {
            case 'half': return 13.1; // 半程马拉松
            case 'marathon': return 26.2; // 全程马拉松
            case '100mile': return 100; // 百英里
            default: return 26.2; // 默认全程马拉松
        }
    }
}

// 过滤距离数据，根据结束点限制最大值
function filterDistancesByEndPoint(distances, endPoint, unit) {
    const maxDistance = getMaxDistanceByEndPoint(unit, endPoint);
    const filteredDistances = distances.filter(d => d.value <= maxDistance);
    
    // 确保数组已排序
    filteredDistances.sort((a, b) => a.value - b.value);
    
    // 仅当结束点是自定义数字且明显大于现有最大距离时，才添加为最后一项
    // 这避免了当使用不同单位时显示异常跳跃的距离点
    if (typeof endPoint === 'number' && endPoint > maxDistance - 0.001) {
        // 检查是否已经有接近结束点的值（避免重复）
        const lastItem = filteredDistances[filteredDistances.length - 1];
        // 如果最后一个项目的值不等于结束点值，则添加结束点
        if (!lastItem || Math.abs(lastItem.value - endPoint) > 0.001) {
            // 创建自定义距离标签
            const customLabel = unit === 'km' ? `${endPoint}公里` : `${endPoint}英里`;
            // 移除可能存在的、与结束点值相差很小的项目
            const filtered = filteredDistances.filter(d => Math.abs(d.value - endPoint) > 0.001);
            filtered.push({ label: customLabel, value: endPoint });
            return filtered;
        }
    }
    
    return filteredDistances;
}



// 每1公里的分段距离数据（包含特殊点）
const SPLIT_DISTANCES_KM_PER_1 = (endPoint = 'marathon') => {
    const maxDistance = getMaxDistanceByEndPoint('km', endPoint);
    const distances = [];
    // 添加每1公里的数据，直到最大距离
    for (let i = 1; i <= Math.ceil(maxDistance); i++) {
        distances.push({ label: `${i}公里`, value: i });
    }
    // 添加半程马拉松和全程马拉松特殊点（如果还没有的话）
    if (maxDistance >= 21.0975 && !distances.some(d => d.value === 21.0975)) {
        distances.push({ label: '半程马拉松', value: 21.0975 });
    }
    if (maxDistance >= 42.195 && !distances.some(d => d.value === 42.195)) {
        distances.push({ label: '全程马拉松', value: 42.195 });
    }
    if (maxDistance === 100 && !distances.some(d => d.value === 100)) {
        distances.push({ label: '百公里', value: 100 });
    }
    // 过滤并按距离值排序
    return filterDistancesByEndPoint(distances, endPoint, 'km').sort((a, b) => a.value - b.value);
};

// 每1英里的分段距离数据（包含特殊点）
const SPLIT_DISTANCES_MILE_PER_1 = (endPoint = 'marathon') => {
    const maxDistance = getMaxDistanceByEndPoint('mile', endPoint);
    const distances = [];
    // 添加每1英里的数据，直到最大距离
    for (let i = 1; i <= Math.ceil(maxDistance); i++) {
        distances.push({ label: `${i}英里`, value: i });
    }
    // 添加半程马拉松和全程马拉松特殊点（如果还没有的话）
    if (maxDistance >= 13.1 && !distances.some(d => d.value === 13.1)) {
        distances.push({ label: '13.1英里（半程马拉松）', value: 13.1 });
    }
    if (maxDistance >= 26.2 && !distances.some(d => d.value === 26.2)) {
        distances.push({ label: '26.2英里（全程马拉松）', value: 26.2 });
    }
    if (maxDistance === 100 && !distances.some(d => d.value === 100)) {
        distances.push({ label: '100英里', value: 100 });
    }
    // 过滤并按距离值排序
    return filterDistancesByEndPoint(distances, endPoint, 'mile').sort((a, b) => a.value - b.value);
};

// 更新分段时间表格
  function updateSplitTimeTable(paceMinutes, paceSeconds, paceUnit, kmGranularity = '5', mileGranularity = '5', kmEndPoint = null, mileEndPoint = null) {
      const paceReferenceElement = document.querySelector('.pace-reference');
      if (!paceReferenceElement) return;
      
      // 获取全局控件引用
      const distanceInput = document.getElementById('global-endpoint-distance');
      const unitSelector = document.getElementById('global-endpoint-unit');
      
      // 如果没有传入结束点参数，则获取结束点值
      if (kmEndPoint === null || mileEndPoint === null) {
          // 1. 首先检查统一控件是否有有效值
          if (distanceInput && unitSelector) {
              const distance = parseFloat(distanceInput.value);
              const unit = unitSelector.value;
              
              if (!isNaN(distance) && distance > 0) {
                  // 根据选择的单位计算两个表格需要的结束点值
                  if (unit === 'km') {
                      kmEndPoint = distance;
                      mileEndPoint = distance * UNIT_CONVERSIONS.km_to_mile;
                  } else if (unit === 'mile') {
                      mileEndPoint = distance;
                      kmEndPoint = distance * UNIT_CONVERSIONS.mile_to_km;
                  }
              } else {
                  // 2. 如果统一控件值无效，检查主表单中的距离和单位
                  const mainDistanceInput = document.getElementById('distance');
                  const mainDistanceUnit = document.getElementById('distance-unit');
                  
                  if (mainDistanceInput && mainDistanceUnit) {
                      const mainDistance = parseFloat(mainDistanceInput.value);
                      const mainUnit = mainDistanceUnit.value;
                      
                      if (!isNaN(mainDistance) && mainDistance > 0) {
                          // 根据主表单单位计算结束点值
                          if (mainUnit === 'm') {
                              // 米转换为公里
                              kmEndPoint = mainDistance / 1000;
                              mileEndPoint = kmEndPoint * UNIT_CONVERSIONS.km_to_mile;
                          } else if (mainUnit === 'km') {
                              kmEndPoint = mainDistance;
                              mileEndPoint = mainDistance * UNIT_CONVERSIONS.km_to_mile;
                          } else if (mainUnit === 'mile') {
                              mileEndPoint = mainDistance;
                              kmEndPoint = mainDistance * UNIT_CONVERSIONS.mile_to_km;
                          } else {
                              // 3. 如果主表单单位无效，使用默认全马距离
                              kmEndPoint = 42.195;
                              mileEndPoint = 26.2;
                          }
                      } else {
                          // 3. 如果主表单距离无效，使用默认全马距离
                          kmEndPoint = 42.195;
                          mileEndPoint = 26.2;
                      }
                  } else {
                      // 3. 如果主表单控件不存在，使用默认全马距离
                      kmEndPoint = 42.195;
                      mileEndPoint = 26.2;
                  }
              }
          } else {
              // 2. 如果统一控件不存在，检查主表单中的距离和单位
              const mainDistanceInput = document.getElementById('distance');
              const mainDistanceUnit = document.getElementById('distance-unit');
              
              if (mainDistanceInput && mainDistanceUnit) {
                  const mainDistance = parseFloat(mainDistanceInput.value);
                  const mainUnit = mainDistanceUnit.value;
                  
                  if (!isNaN(mainDistance) && mainDistance > 0) {
                      // 根据主表单单位计算结束点值
                      if (mainUnit === 'm') {
                          // 米转换为公里
                          kmEndPoint = mainDistance / 1000;
                          mileEndPoint = kmEndPoint * UNIT_CONVERSIONS.km_to_mile;
                      } else if (mainUnit === 'km') {
                          kmEndPoint = mainDistance;
                          mileEndPoint = mainDistance * UNIT_CONVERSIONS.km_to_mile;
                      } else if (mainUnit === 'mile') {
                          mileEndPoint = mainDistance;
                          kmEndPoint = mainDistance * UNIT_CONVERSIONS.mile_to_km;
                      } else {
                          // 3. 如果主表单单位无效，使用默认全马距离
                          kmEndPoint = 42.195;
                          mileEndPoint = 26.2;
                      }
                  } else {
                      // 3. 如果主表单距离无效，使用默认全马距离
                      kmEndPoint = 42.195;
                      mileEndPoint = 26.2;
                  }
              } else {
                  // 3. 如果主表单控件不存在，使用默认全马距离
                  kmEndPoint = 42.195;
                  mileEndPoint = 26.2;
              }
          }
      }
    
    // 计算配速总秒数
    const totalPaceSeconds = paceMinutes * 60 + paceSeconds;
    
    // 计算不同单位的配速显示
    let kmPaceMinutes, kmPaceSeconds, milePaceMinutes, milePaceSeconds;
    
    if (paceUnit === 'km') {
        // 如果当前配速单位是公里，直接使用
        kmPaceMinutes = paceMinutes;
        kmPaceSeconds = paceSeconds;
        // 转换为英里配速
        const milePaceTotalSeconds = totalPaceSeconds * UNIT_CONVERSIONS.min_per_km_to_min_per_mile;
        milePaceMinutes = Math.floor(milePaceTotalSeconds / 60);
        milePaceSeconds = Math.round(milePaceTotalSeconds % 60);
    } else if (paceUnit === 'mile') {
        // 如果当前配速单位是英里，转换为公里配速
        const kmPaceTotalSeconds = totalPaceSeconds * UNIT_CONVERSIONS.min_per_mile_to_min_per_km;
        kmPaceMinutes = Math.floor(kmPaceTotalSeconds / 60);
        kmPaceSeconds = Math.round(kmPaceTotalSeconds % 60);
        // 直接使用英里配速
        milePaceMinutes = paceMinutes;
        milePaceSeconds = paceSeconds;
    }
    
    // 格式化配速显示
    const kmPaceDisplay = `${kmPaceMinutes}分${kmPaceSeconds}秒`;
    const milePaceDisplay = `${milePaceMinutes}分${milePaceSeconds}秒`;
    
    // 生成公里和英里两个版本的表格，传递粒度和结束点参数
    let kmTableHtml = generateSplitTimeTable('km', totalPaceSeconds, paceUnit, kmGranularity, kmEndPoint);
    let mileTableHtml = generateSplitTimeTable('mile', totalPaceSeconds, paceUnit, mileGranularity, mileEndPoint);
    
    // 更新表格内容，添加粒度切换和结束点选择控件
    paceReferenceElement.innerHTML = `
        <h3>分段时间参考</h3>
        <!-- 统一的结束距离控制 -->
        <div class="form-group">
            <label>结束距离：</label>
            <div class="input-with-unit">
                <!-- 保留用户原始输入的距离值，不要直接使用转换后的kmEndPoint -->
                <input type="number" id="global-endpoint-distance" class="endpoint-distance" step="0.1" min="0.1" 
                    value="${distanceInput ? distanceInput.value : (unitSelector && unitSelector.value === 'mile' ? mileEndPoint : kmEndPoint)}">
                <select id="global-endpoint-unit" class="unit-select">
                    <option value="km" ${unitSelector && unitSelector.value === 'km' ? 'selected' : ''}>公里</option>
                    <option value="mile" ${unitSelector && unitSelector.value === 'mile' ? 'selected' : ''}>英里</option>
                </select>
            </div>
        </div>
        <div class="split-tables-container">
            <div class="split-table-section">
                <div class="table-header-controls">
                    <h4>公里版本（配速为${kmPaceDisplay}/公里）</h4>
                    <div class="controls-row">
                        <div class="control-group">
                            <label>显示粒度：</label>
                            <select class="granularity-selector" data-unit="km">
                                <option value="5" ${kmGranularity === '5' ? 'selected' : ''}>每5公里一行</option>
                                <option value="1" ${kmGranularity === '1' ? 'selected' : ''}>每1公里一行</option>
                            </select>
                        </div>

                    </div>
                </div>
                ${kmTableHtml}
            </div>
            <div class="split-table-section">
                <div class="table-header-controls">
                    <h4>英里版本（配速为${milePaceDisplay}/英里）</h4>
                    <div class="controls-row">
                        <div class="control-group">
                            <label>显示粒度：</label>
                            <select class="granularity-selector" data-unit="mile">
                                <option value="5" ${mileGranularity === '5' ? 'selected' : ''}>每5英里一行</option>
                                <option value="1" ${mileGranularity === '1' ? 'selected' : ''}>每1英里一行</option>
                            </select>
                        </div>

                    </div>
                </div>
                ${mileTableHtml}
            </div>
        </div>
    `;
    
    // 添加事件监听器
    addGranularityChangeListeners(paceMinutes, paceSeconds, paceUnit);
    addEndPointChangeListeners(paceMinutes, paceSeconds, paceUnit);
}

// 为结束点控件添加事件监听器
function addEndPointChangeListeners(paceMinutes, paceSeconds, paceUnit) {
    // 为统一的距离输入框和单位选择器添加事件监听器
    const distanceInput = document.getElementById('global-endpoint-distance');
    const unitSelector = document.getElementById('global-endpoint-unit');
    
    // 处理距离输入框变化
    if (distanceInput) {
        distanceInput.addEventListener('change', function() {
            handleEndPointChange(paceMinutes, paceSeconds, paceUnit);
        });
        
        distanceInput.addEventListener('blur', function() {
            handleEndPointChange(paceMinutes, paceSeconds, paceUnit);
        });
    }
    
    // 处理单位选择器变化
    if (unitSelector) {
        unitSelector.addEventListener('change', function() {
            // 当单位改变时，自动转换距离值
            const distance = parseFloat(distanceInput.value);
            if (!isNaN(distance) && distance > 0) {
                const newUnit = unitSelector.value;
                const oldUnit = newUnit === 'km' ? 'mile' : 'km';
                
                // 根据单位进行转换
                if (oldUnit === 'mile' && newUnit === 'km') {
                    // 英里转公里
                    distanceInput.value = (distance * UNIT_CONVERSIONS.mile_to_km).toFixed(1);
                } else if (oldUnit === 'km' && newUnit === 'mile') {
                    // 公里转英里
                    distanceInput.value = (distance * UNIT_CONVERSIONS.km_to_mile).toFixed(1);
                }
            }
            
            // 为了避免重复转换，我们直接从DOM获取当前值和单位
            // 而不是传递已经计算过的结束点参数
            handleEndPointChange(paceMinutes, paceSeconds, paceUnit);
        });
    }
}

// 处理结束点变化的辅助函数
function handleEndPointChange(paceMinutes, paceSeconds, paceUnit) {
    // 获取当前的粒度设置
    let kmGranularity = '5';
    let mileGranularity = '5';
    
    // 获取粒度选择器的值
    const kmGranularitySelector = document.querySelector('.granularity-selector[data-unit="km"]');
    const mileGranularitySelector = document.querySelector('.granularity-selector[data-unit="mile"]');
    
    if (kmGranularitySelector) kmGranularity = kmGranularitySelector.value;
    if (mileGranularitySelector) mileGranularity = mileGranularitySelector.value;
    
    // 不在这里进行单位转换，直接调用updateSplitTimeTable让它内部处理
    // 这样可以避免重复转换问题
    updateSplitTimeTable(paceMinutes, paceSeconds, paceUnit, kmGranularity, mileGranularity);
}

// 为粒度选择器添加事件监听器
function addGranularityChangeListeners(paceMinutes, paceSeconds, paceUnit) {
    const selectors = document.querySelectorAll('.granularity-selector');
    
    selectors.forEach(selector => {
        // 移除可能存在的旧监听器，避免重复添加
        const newSelector = selector.cloneNode(true);
        selector.parentNode.replaceChild(newSelector, selector);
        
        // 添加新的change事件监听器
        newSelector.addEventListener('change', function() {
            // 直接调用handleEndPointChange函数
            // 该函数会获取当前的粒度设置并正确处理结束距离
            handleEndPointChange(paceMinutes, paceSeconds, paceUnit);
        });
    });
}

// 生成单个分段时间表格
function generateSplitTimeTable(targetUnit, totalPaceSeconds, paceUnit, granularity = '5', endPoint = 'marathon') {
    // 获取最大距离值
    const maxDistance = typeof endPoint === 'number' ? endPoint : (targetUnit === 'km' ? 42.195 : 26.2);
    
    // 根据粒度计算分段距离
    const splitDistances = [];
    const step = granularity === '1' ? 1 : 5;
    
    // 添加基本的分段距离点
    for (let distance = step; distance < maxDistance; distance += step) {
        // 格式化标签，保留一位小数但移除末尾的.0
        let formattedDistance = distance % 1 === 0 ? distance.toFixed(0) : distance.toFixed(1);
        splitDistances.push({
            label: `${formattedDistance}${targetUnit === 'km' ? '公里' : '英里'}`,
            value: distance
        });
    }
    
    // 添加重要的特殊点（但只在不超过最大距离的情况下）
    const specialPoints = targetUnit === 'km' ? 
        [
            { label: '半程马拉松', value: 21.0975 },
            { label: '全程马拉松', value: 42.195 },
        ] : 
        [
            { label: '半程马拉松', value: 13.1 },
            { label: '全程马拉松', value: 26.2 },
        ];
    
    // 为每个特殊点检查是否需要添加
    specialPoints.forEach(point => {
        // 只添加小于等于最大距离且尚未添加的特殊点
        if (point.value <= maxDistance && !splitDistances.some(d => Math.abs(d.value - point.value) < 0.001)) {
            splitDistances.push(point);
        }
    });
    
    // 添加结束点（如果还没有）
    if (!splitDistances.some(d => Math.abs(d.value - maxDistance) < 0.001)) {
        // 格式化结束点标签
        let endPointLabel;
        if (targetUnit === 'km' && Math.abs(maxDistance - 21.0975) < 0.001) {
            endPointLabel = '半程马拉松';
        } else if (targetUnit === 'km' && Math.abs(maxDistance - 42.195) < 0.001) {
            endPointLabel = '全程马拉松';
        } else if (targetUnit === 'mile' && Math.abs(maxDistance - 13.1) < 0.001) {
            endPointLabel = '半程马拉松';
        } else if (targetUnit === 'mile' && Math.abs(maxDistance - 26.2) < 0.001) {
            endPointLabel = '全程马拉松';
        } else {
            // 自定义距离
            let formattedEndPoint = maxDistance % 1 === 0 ? maxDistance.toFixed(0) : maxDistance.toFixed(1);
            endPointLabel = `${formattedEndPoint}${targetUnit === 'km' ? '公里' : '英里'}`;
        }
        splitDistances.push({ label: endPointLabel, value: maxDistance });
    }
    
    // 按距离值排序
    splitDistances.sort((a, b) => a.value - b.value);
    let tableHtml = `
        <table class="reference-table">
            <thead>
                <tr>
                    <th>距离</th>
                    <th>累计时间</th>
                    <th>分段时间</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // 添加起点行（开始时）
    tableHtml += `
        <tr>
            <td>开始时</td>
            <td>00:00</td>
            <td>无</td>
        </tr>
    `;
    
    let cumulativeTime = 0;
    let previousCumulativeTime = 0;
    
    for (let i = 0; i < splitDistances.length; i++) {
        const distance = splitDistances[i].value;
        const distanceLabel = splitDistances[i].label;
        
        // 根据配速单位和目标距离单位计算时间
        let distanceInPaceUnit;
        if (paceUnit === 'km') {
            if (targetUnit === 'km') {
                distanceInPaceUnit = distance;
            } else { // mile
                distanceInPaceUnit = distance * UNIT_CONVERSIONS.mile_to_km;
            }
        } else { // mile
            if (targetUnit === 'km') {
                distanceInPaceUnit = distance * UNIT_CONVERSIONS.km_to_mile;
            } else { // mile
                distanceInPaceUnit = distance;
            }
        }
        
        // 计算该段距离的累计时间
        cumulativeTime = distanceInPaceUnit * totalPaceSeconds;
        
        // 计算分段时间（当前累计时间减去上一个点的累计时间）
        const segmentTimeSeconds = cumulativeTime - previousCumulativeTime;
        
        // 格式化时间
        const cumulativeTimeFormatted = formatTimeFromSeconds(cumulativeTime);
        const segmentTimeFormatted = formatTimeFromSeconds(segmentTimeSeconds);
        
        tableHtml += `
            <tr>
                <td>${distanceLabel}</td>
                <td>${cumulativeTimeFormatted}</td>
                <td>${segmentTimeFormatted}</td>
            </tr>
        `;
        
        // 更新上一个累计时间
        previousCumulativeTime = cumulativeTime;
    }
    
    tableHtml += `
            </tbody>
        </table>
    `;
    
    return tableHtml;
}

// 从秒数格式化时间
function formatTimeFromSeconds(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const remainingSeconds = totalSeconds % 3600;
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = Math.round(remainingSeconds % 60);
    
    return formatTime(hours, minutes, seconds);
}

// 显示结果
function showResult(content) {
    resultArea.style.display = 'block';
    resultContent.innerHTML = content;
    resultContent.classList.remove('error-message');
    
    // 尝试从结果中提取配速信息以更新分段时间表格
    try {
        // 从DOM中获取当前计算的配速
        const paceMinutes = parseFloat(paceMinutesInput.value);
        const paceSeconds = parseFloat(paceSecondsInput.value);
        const paceUnit = paceUnitSelect.value;
        
        // 如果配速输入框有值，更新分段时间表格
        if (!isNaN(paceMinutes) && !isNaN(paceSeconds)) {
            // 使用默认参数，将在updateSplitTimeTable函数内部处理统一的结束距离设置
            updateSplitTimeTable(paceMinutes, paceSeconds, paceUnit);
        }
    } catch (error) {
        console.error('更新分段时间表格失败:', error);
    }
}

// 显示错误
function showError(message) {
    resultArea.style.display = 'block';
    resultContent.innerHTML = `<p class="error-message">${message}</p>`;
    resultContent.classList.add('error-message');
}



// 当DOM加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPaceCalculator);
} else {
    initPaceCalculator();
}