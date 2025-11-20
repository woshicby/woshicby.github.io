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
    ms_to_mph: 2.23694,      // 米/秒到英里/小时
    mph_to_ms: 0.44704,      // 英里/小时到米/秒
    
    // 配速单位转换
    min_per_km_to_min_per_mile: 1.60934,  // 分钟/公里到分钟/英里
    min_per_mile_to_min_per_km: 0.621371, // 分钟/英里到分钟/公里
    min_per_km_to_min_per_m: 0.001,       // 分钟/公里到分钟/米
    min_per_m_to_min_per_km: 1000,        // 分钟/米到分钟/公里
    min_per_mile_to_min_per_m: 0.000621371, // 分钟/英里到分钟/米
    min_per_m_to_min_per_mile: 1609.34     // 分钟/米到分钟/英里
};

/**
 * 通用单位转换函数
 * 用于在不同单位系统之间转换数值
 * @function convertUnit
 * @param {number} value - 要转换的值
 * @param {string} fromUnit - 源单位
 * @param {string} toUnit - 目标单位
 * @param {string} unitType - 单位类型，可选值: 'distance', 'speed', 'pace'
 * @returns {number} 转换后的值
 */
function convertUnit(value, fromUnit, toUnit, unitType) {
    // 如果源单位和目标单位相同，直接返回原值
    if (fromUnit === toUnit) {
        return value;
    }
    
    // 根据单位类型执行相应的转换
    switch (unitType) {
        case 'distance':
            // 距离单位转换
            if (fromUnit === 'km' && toUnit === 'mile') {
                return value * UNIT_CONVERSIONS.km_to_mile;
            } else if (fromUnit === 'mile' && toUnit === 'km') {
                return value * UNIT_CONVERSIONS.mile_to_km;
            } else if (fromUnit === 'm' && toUnit === 'km') {
                return value * UNIT_CONVERSIONS.m_to_km;
            } else if (fromUnit === 'km' && toUnit === 'm') {
                return value * UNIT_CONVERSIONS.km_to_m;
            } else if (fromUnit === 'm' && toUnit === 'mile') {
                return value * UNIT_CONVERSIONS.m_to_mile;
            } else if (fromUnit === 'mile' && toUnit === 'm') {
                return value * UNIT_CONVERSIONS.mile_to_m;
            }
            break;
            
        case 'speed':
            // 速度单位转换
            if (fromUnit === 'kmh' && toUnit === 'mph') {
                return value * UNIT_CONVERSIONS.kmh_to_mph;
            } else if (fromUnit === 'mph' && toUnit === 'kmh') {
                return value * UNIT_CONVERSIONS.mph_to_kmh;
            } else if (fromUnit === 'kmh' && toUnit === 'ms') {
                return value * UNIT_CONVERSIONS.kmh_to_ms;
            } else if (fromUnit === 'ms' && toUnit === 'kmh') {
                return value * UNIT_CONVERSIONS.ms_to_kmh;
            } else if (fromUnit === 'ms' && toUnit === 'mph') {
                return value * UNIT_CONVERSIONS.ms_to_mph;
            } else if (fromUnit === 'mph' && toUnit === 'ms') {
                return value * UNIT_CONVERSIONS.mph_to_ms;
            }
            break;
            
        case 'pace':
            // 配速单位转换
            if (fromUnit === 'km' && toUnit === 'mile') {
                // 分钟/公里转换为分钟/英里
                return value * UNIT_CONVERSIONS.min_per_km_to_min_per_mile;
            } else if (fromUnit === 'mile' && toUnit === 'km') {
                // 分钟/英里转换为分钟/公里
                return value * UNIT_CONVERSIONS.min_per_mile_to_min_per_km;
            } else if (fromUnit === 'km' && toUnit === 'm') {
                return value * UNIT_CONVERSIONS.min_per_km_to_min_per_m;
            } else if (fromUnit === 'm' && toUnit === 'km') {
                return value * UNIT_CONVERSIONS.min_per_m_to_min_per_km;
            } else if (fromUnit === 'mile' && toUnit === 'm') {
                return value * UNIT_CONVERSIONS.min_per_mile_to_min_per_m;
            } else if (fromUnit === 'm' && toUnit === 'mile') {
                return value * UNIT_CONVERSIONS.min_per_m_to_min_per_mile;
            }
            break;
    }
    
    // 如果没有找到合适的转换关系，返回原值
    console.warn(`未找到从 ${fromUnit} 到 ${toUnit} 的 ${unitType} 单位转换关系`);
    return value;
}

/**
 * DOM元素引用变量
 * 将在DOM加载完成后初始化
 */

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
    // 优先设置开关事件监听
    const prioritySwitch = document.getElementById('priority-switch');
    if (prioritySwitch) {
        prioritySwitch.addEventListener('change', function() {
            // 当优先设置改变时，这里可以根据需要添加处理逻辑
            // 但在当前实现中，优先设置只在计算函数内部使用
        });
    }
    
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
        // 确保在添加事件监听器之前设置初始previousUnit属性
        speedUnitSelect.dataset.previousUnit = speedUnitSelect.value;
        speedUnitSelect.addEventListener('change', handleSpeedUnitChange);
    }
}

// 更新表单可见性
/**
 * 更新表单元素的编辑状态
 * 现在所有输入框在任何时候都设置为可编辑状态
 * 计算逻辑会根据输入值的组合自动处理
 * @function updateFormVisibility
 * @returns {void}
 */
function updateFormVisibility() {
    // 设置所有输入框为可编辑状态
    distanceInput.readOnly = false;
    hoursInput.readOnly = false;
    minutesInput.readOnly = false;
    secondsInput.readOnly = false;
    paceMinutesInput.readOnly = false;
    paceSecondsInput.readOnly = false;
    speedInput.readOnly = false;
}

// 处理距离单位变化
function handleDistanceUnitChange() {
    // 获取当前值和目标单位
    const currentValue = distanceInput.value;
    const toUnit = this.value;
    
    // 首先保存当前单位作为下一次转换的参考
    // 但需要在获取fromUnit之后再更新，以确保转换正确
    const fromUnit = this.dataset.previousUnit || 'km';
    
    // 确保在任何计算模式下都能进行单位转换，不仅限于特定模式
    if (currentValue) {
        const currentDistance = parseFloat(currentValue);
        
        // 检查输入是否有效
        if (!isNaN(currentDistance) && currentDistance > 0) {
            // 只有当单位发生变化时才进行转换
            if (fromUnit !== toUnit) {
                // 直接进行单位转换
                const convertedDistance = convertUnit(currentDistance, fromUnit, toUnit, 'distance');
                
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
    
    // 保存新的单位作为下一次转换的参考
    this.dataset.previousUnit = toUnit;
    
    // 移除自动触发计算的逻辑，确保切换单位时不会重新计算其他值
    // 用户需要手动点击计算按钮来更新结果
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
        // 获取之前的单位，如果不存在则使用默认值'kmh'
        const fromUnit = this.dataset.previousUnit || 'kmh';
        const toUnit = this.value;
        
        // 使用通用单位转换函数
        const convertedSpeed = convertUnit(speedValue, fromUnit, toUnit, 'speed');
        speedInput.value = convertedSpeed.toFixed(2);
    }
    
    // 保存当前单位作为下一次转换的参考
    this.dataset.previousUnit = this.value;
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
            // 使用通用单位转换函数进行配速转换
            const convertedPaceSeconds = convertUnit(totalPaceSeconds, fromUnit, toUnit, 'pace');
            
            const newMinutes = Math.floor(convertedPaceSeconds / 60);
            const newSeconds = Math.round(convertedPaceSeconds % 60);
            
            paceMinutesInput.value = newMinutes;
            paceSecondsInput.value = newSeconds;
        }
    }
    
    // 保存当前单位作为下一次转换的参考
    this.dataset.previousUnit = this.value;
}

// 获取速度/配速优先设置，默认为配速优先
function getPrioritySetting() {
    const prioritySwitch = document.getElementById('priority-switch');
    return prioritySwitch ? prioritySwitch.value : 'pace'; // 默认为配速优先
}

// 计算函数
function calculate() {
    // 获取输入值
    const distance = parseFloat(distanceInput.value) || 0;
    const hours = parseFloat(hoursInput.value) || 0;
    const minutes = parseFloat(minutesInput.value) || 0;
    const seconds = parseFloat(secondsInput.value) || 0;
    const paceMinutes = parseFloat(paceMinutesInput.value) || 0;
    const paceSeconds = parseFloat(paceSecondsInput.value) || 0;
    const speed = parseFloat(speedInput.value) || 0;
    
    // 获取单位
    const distanceUnit = distanceUnitSelect.value;
    const paceUnit = paceUnitSelect.value;
    const speedUnit = speedUnitSelect.value;
    
    // 获取优先设置
    const priority = getPrioritySetting();
    
    // 存储计算结果的数组
    const results = [];
    
    // 计算总时间（秒）
    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    
    // 计算总配速时间（秒/单位距离）
    const totalPaceSeconds = paceMinutes * 60 + paceSeconds;
    
    // 标记是否有有效的距离和时间输入
    const hasValidDistance = distance > 0;
    const hasValidTime = totalSeconds > 0;
    const hasValidPace = totalPaceSeconds > 0;
    const hasValidSpeed = speed > 0;
    
    // 定义可在整个函数范围内修改的距离标志变量
    let hasDistance = hasValidDistance;
    
    // 声明配速变量，确保在整个函数范围内可用
    let calculatedPaceMinutes = 0;
    let calculatedPaceSeconds = 0;
    
    // 情况1：距离和时间文本框都有数值
    if (hasValidDistance && hasValidTime) {
        // 计算配速（秒/单位距离）
        let totalCalculatedPaceSeconds = totalSeconds / distance;
        
        // 使用通用单位转换函数转换配速
        totalCalculatedPaceSeconds = convertUnit(totalCalculatedPaceSeconds, distanceUnit, paceUnit, 'pace');
        
        calculatedPaceMinutes = Math.floor(totalCalculatedPaceSeconds / 60);
        calculatedPaceSeconds = Math.round(totalCalculatedPaceSeconds % 60);
        
        // 计算速度（单位距离/小时）
        let calculatedSpeed = distance / (totalSeconds / 3600);
        
        // 使用通用单位转换函数转换速度
        calculatedSpeed = convertUnit(calculatedSpeed, distanceUnit === 'km' ? 'kmh' : 'mph', speedUnit, 'speed');
        
        // 更新配速输入框
        paceMinutesInput.value = calculatedPaceMinutes;
        paceSecondsInput.value = calculatedPaceSeconds;
        
        // 更新速度输入框
        speedInput.value = calculatedSpeed.toFixed(2);
        
        // 输出结果
        results.push(`距离: ${distance.toFixed(2)} ${getDistanceUnitLabel(distanceUnit)}`);
        results.push(`时间: ${formatTime(hours, minutes, seconds)}`);
        results.push(`配速: ${formatNumber(calculatedPaceMinutes)}:${formatNumber(calculatedPaceSeconds)} ${getPaceUnitLabel(paceUnit)}`);
        results.push(`速度: ${calculatedSpeed.toFixed(2)} ${getSpeedUnitLabel(speedUnit)}`);
    }
    // 情况2：距离和时间文本框中只有一项有数值
    else if (hasValidDistance || hasValidTime) {
        // 确定哪个输入有值
        hasDistance = hasValidDistance;
        const hasTime = hasValidTime;
        
        let calculatedSpeed, calculatedDistance, calculatedHours, calculatedMinutes, calculatedSeconds;
        
        // 检查配速和速度的输入情况
        const bothPaceAndSpeed = hasValidPace && hasValidSpeed;
        const onlyPace = hasValidPace && !hasValidSpeed;
        const onlySpeed = !hasValidPace && hasValidSpeed;
        
        if (!hasValidPace && !hasValidSpeed) {
            // 配速和速度都无数值
            results.push('<span class="error">请输入速度或配速来完成计算</span>');
        } else {
            // 计算配速和速度的关系
            if (bothPaceAndSpeed) {
                // 两者都有值，根据优先设置决定使用哪个
                if (priority === 'pace') {
                    calculatedPaceMinutes = paceMinutes;
                    calculatedPaceSeconds = paceSeconds;
                    
                    // 使用通用单位转换函数转换配速到距离单位
                let adjustedPaceSeconds = convertUnit(totalPaceSeconds, paceUnit, distanceUnit, 'pace');
                
                calculatedSpeed = 3600 / adjustedPaceSeconds;
                
                // 使用通用单位转换函数转换速度单位
                calculatedSpeed = convertUnit(calculatedSpeed, distanceUnit === 'km' ? 'kmh' : 'mph', speedUnit, 'speed');
                } else {
                    calculatedSpeed = speed;
                    
                    // 使用通用单位转换函数转换速度到距离单位
                let adjustedSpeed = convertUnit(speed, speedUnit, distanceUnit === 'km' ? 'kmh' : 'mph', 'speed');
                
                const tempPaceSeconds = 3600 / adjustedSpeed;
                
                // 使用通用单位转换函数转换配速单位
                let finalPaceSeconds = convertUnit(tempPaceSeconds, distanceUnit, paceUnit, 'pace');
                    
                    calculatedPaceMinutes = Math.floor(finalPaceSeconds / 60);
                    calculatedPaceSeconds = Math.round(finalPaceSeconds % 60);
                }
            } else if (onlyPace) {
                // 只有配速有值
                calculatedPaceMinutes = paceMinutes;
                calculatedPaceSeconds = paceSeconds;
                
                // 使用通用单位转换函数转换配速到距离单位
                let adjustedPaceSeconds = convertUnit(totalPaceSeconds, paceUnit, distanceUnit, 'pace');
                
                // 使用调整后的配速计算速度
                calculatedSpeed = 3600 / adjustedPaceSeconds;
            } else if (onlySpeed) {
                // 只有速度有值
                calculatedSpeed = speed;
                
                // 使用通用单位转换函数转换速度到距离单位
                let convertedSpeed = convertUnit(speed, speedUnit, distanceUnit === 'km' ? 'kmh' : 'mph', 'speed');
                
                const tempPaceSeconds = 3600 / convertedSpeed;
                calculatedPaceMinutes = Math.floor(tempPaceSeconds / 60);
                calculatedPaceSeconds = Math.round(tempPaceSeconds % 60);
            }
            
            // 更新配速和速度输入框
            paceMinutesInput.value = calculatedPaceMinutes;
            paceSecondsInput.value = calculatedPaceSeconds;
            speedInput.value = calculatedSpeed.toFixed(2);
            
            // 计算距离和时间中缺少的项
            if (hasDistance && !hasTime) {
                // 有距离，计算时间
                
                // 当使用速度计算时间时，确保单位匹配
                let adjustedTimeSeconds;
                
                // 检查是否是使用速度进行计算（只有速度有值）
                if (onlySpeed) {
                    // 使用通用单位转换函数转换速度到距离单位
                let convertedSpeed = convertUnit(calculatedSpeed, speedUnit, distanceUnit === 'km' ? 'kmh' : 'mph', 'speed');
                    
                    // 计算时间：时间(秒) = 距离 / 速度 * 3600
                    adjustedTimeSeconds = (distance / convertedSpeed) * 3600;
                } else {
                    // 使用配速计算时间
                    // 使用通用单位转换函数转换配速到距离单位
                const totalPaceSeconds = calculatedPaceMinutes * 60 + calculatedPaceSeconds;
                let adjustedPaceSeconds = convertUnit(totalPaceSeconds, paceUnit, distanceUnit, 'pace');
                    
                    adjustedTimeSeconds = distance * adjustedPaceSeconds;
                }
                
                calculatedHours = Math.floor(adjustedTimeSeconds / 3600);
                calculatedMinutes = Math.floor((adjustedTimeSeconds % 3600) / 60);
                calculatedSeconds = Math.round(adjustedTimeSeconds % 60);
                
                // 更新时间输入框
                hoursInput.value = calculatedHours || '';
                minutesInput.value = calculatedMinutes;
                secondsInput.value = calculatedSeconds;
                
                // 添加到结果
                results.push(`距离: ${distance.toFixed(2)} ${getDistanceUnitLabel(distanceUnit)}`);
                results.push(`计算时间: ${formatTime(calculatedHours, calculatedMinutes, calculatedSeconds)}`);
            } else if (!hasDistance && hasTime) {
                // 有时间，计算距离
                // 计算配速总秒数
                const totalPaceSeconds = calculatedPaceMinutes * 60 + calculatedPaceSeconds;
                
                // 考虑配速单位和距离单位的转换
                if (paceUnit !== distanceUnit) {
                    // 使用通用单位转换函数转换配速到距离单位
                    const adjustedPaceSeconds = convertUnit(totalPaceSeconds, paceUnit, distanceUnit, 'pace');
                    calculatedDistance = totalSeconds / adjustedPaceSeconds;
                } else {
                    // 单位相同，直接计算
                    calculatedDistance = totalSeconds / totalPaceSeconds;
                }
                
                // 更新距离输入框
                distanceInput.value = calculatedDistance.toFixed(2);
                
                // 重新标记hasDistance为true，因为现在有了计算出的距离
                hasDistance = true;
                
                // 添加到结果
                results.push(`计算距离: ${calculatedDistance.toFixed(2)} ${getDistanceUnitLabel(distanceUnit)}`);
                results.push(`时间: ${formatTime(hours, minutes, seconds)}`);
            }
            
            // 添加配速和速度到结果
            results.push(`配速: ${formatNumber(calculatedPaceMinutes)}:${formatNumber(calculatedPaceSeconds)} ${getPaceUnitLabel(paceUnit)}`);
            results.push(`速度: ${calculatedSpeed.toFixed(2)} ${getSpeedUnitLabel(speedUnit)}`);
        }
    }
    // 情况3：距离和时间文本框都无数值
    else {
        // 检查配速和速度的输入情况
        const bothPaceAndSpeed = hasValidPace && hasValidSpeed;
        const onlyPace = hasValidPace && !hasValidSpeed;
        const onlySpeed = !hasValidPace && hasValidSpeed;
        
        if (!hasValidPace && !hasValidSpeed) {
            // 配速和速度都无数值
            results.push('<span class="error">请输入速度或配速来完成计算</span>');
        } else {
            let calculatedSpeed;
            
            if (bothPaceAndSpeed) {
                // 两者都有值，根据优先设置决定使用哪个
                if (priority === 'pace') {
                    calculatedPaceMinutes = paceMinutes;
                    calculatedPaceSeconds = paceSeconds;
                    calculatedSpeed = 3600 / totalPaceSeconds;
                } else {
                    calculatedSpeed = speed;
                    const tempPaceSeconds = 3600 / speed;
                    calculatedPaceMinutes = Math.floor(tempPaceSeconds / 60);
                    calculatedPaceSeconds = Math.round(tempPaceSeconds % 60);
                }
            } else if (onlyPace) {
                // 只有配速有值，计算速度
                calculatedPaceMinutes = paceMinutes;
                calculatedPaceSeconds = paceSeconds;
                calculatedSpeed = 3600 / totalPaceSeconds;
            } else if (onlySpeed) {
                // 只有速度有值，计算配速
                calculatedSpeed = speed;
                const tempPaceSeconds = 3600 / speed;
                calculatedPaceMinutes = Math.floor(tempPaceSeconds / 60);
                calculatedPaceSeconds = Math.round(tempPaceSeconds % 60);
            }
            
            // 更新输入框
            paceMinutesInput.value = calculatedPaceMinutes;
            paceSecondsInput.value = calculatedPaceSeconds;
            speedInput.value = calculatedSpeed.toFixed(2);
            
            // 添加到结果
            results.push(`配速: ${formatNumber(calculatedPaceMinutes)}:${formatNumber(calculatedPaceSeconds)} ${getPaceUnitLabel(paceUnit)}`);
            results.push(`速度: ${calculatedSpeed.toFixed(2)} ${getSpeedUnitLabel(speedUnit)}`);
            results.push(`优先设置: ${priority === 'pace' ? '配速优先' : '速度优先'}`);
        }
    }
    
    // 显示结果
    resultContent.innerHTML = results.length > 0 ? results.map(line => `<p>${line}</p>`).join('') : '<p>请输入数据并点击计算按钮。</p>';
    
    // 确保配速输入框的值正确设置，这样即使showResult也调用updateSplitTimeTable，也能使用正确的值
    console.log('在calculate函数末尾，确保配速输入框值正确:', calculatedPaceMinutes, ':', calculatedPaceSeconds);
    if (calculatedPaceMinutes !== undefined && calculatedPaceSeconds !== undefined) {
        paceMinutesInput.value = calculatedPaceMinutes;
        paceSecondsInput.value = calculatedPaceSeconds;
    }
    
    // 在计算成功后更新分段时间表格
    // 优化条件判断，确保每次计算都能稳定触发分段时间表更新
    // 使用results数组长度来判断计算是否成功执行
    const currentPaceUnit = paceUnitSelect.value;
    
    // 确保配速单位有效
    const validPaceUnit = currentPaceUnit === 'km' || currentPaceUnit === 'mile';
    
    // 提前声明变量，避免作用域问题
    let mainDistance = null;
    let mainUnit = null;
    
    // 只有当计算成功执行且配速单位有效时触发更新
    if (results.length > 0 && validPaceUnit) {
        console.log('准备更新分段时间表');
        console.log('results.length:', results.length);
        console.log('validPaceUnit:', validPaceUnit);
        console.log('currentPaceUnit:', currentPaceUnit);
        console.log('hasValidDistance:', hasValidDistance);
        
        // 如果有有效距离，直接传递距离参数给updateSplitTimeTable函数
        // 确保分段时间表格的结束距离与计算结果一致
        let calculatedKmEndPoint = null;
        let calculatedMileEndPoint = null;
        
        // 使用hasDistance而不是hasValidDistance，因为当用户删除距离并输入时间后，
        // 我们会计算出新的距离并将hasDistance设为true
        if (hasDistance) {
            // 获取主表单中的距离值和单位
            mainDistance = parseFloat(distanceInput.value);
            mainUnit = distanceUnitSelect.value;
            
            console.log('mainDistance:', mainDistance);
            console.log('mainUnit:', mainUnit);
            
            // 根据单位计算公里和英里的结束距离
            if (mainUnit === 'm') {
                calculatedKmEndPoint = mainDistance / 1000;
                calculatedMileEndPoint = convertUnit(calculatedKmEndPoint, 'km', 'mile', 'distance');
            } else if (mainUnit === 'km') {
                calculatedKmEndPoint = mainDistance;
                calculatedMileEndPoint = convertUnit(mainDistance, 'km', 'mile', 'distance');
            } else if (mainUnit === 'mile') {
                calculatedMileEndPoint = mainDistance;
                calculatedKmEndPoint = convertUnit(mainDistance, 'mile', 'km', 'distance');
            }
        }
        
        // 确保配速变量存在
        console.log('calculatedPaceMinutes:', calculatedPaceMinutes);
        console.log('calculatedPaceSeconds:', calculatedPaceSeconds);
        console.log('calculatedKmEndPoint:', calculatedKmEndPoint);
        console.log('calculatedMileEndPoint:', calculatedMileEndPoint);
        
        // 调用updateSplitTimeTable函数，传递必要的参数
        // 使用计算后的配速值，确保传递稳定有效的参数
        if (calculatedPaceMinutes !== undefined && calculatedPaceSeconds !== undefined) {
            console.log('调用updateSplitTimeTable');
            updateSplitTimeTable(
                calculatedPaceMinutes, 
                calculatedPaceSeconds, 
                currentPaceUnit,
                '5', // 默认公里粒度
                '5', // 默认英里粒度
                calculatedKmEndPoint,
                calculatedMileEndPoint,
                hasDistance ? mainDistance : null,
                hasDistance ? mainUnit : null
            );
        } else {
            console.log('错误: 配速变量未定义，尝试从输入框获取值');
            // 尝试从输入框获取值作为备用
            const inputPaceMinutes = parseFloat(paceMinutesInput.value);
            const inputPaceSeconds = parseFloat(paceSecondsInput.value);
            if (!isNaN(inputPaceMinutes) && !isNaN(inputPaceSeconds)) {
                console.log('从输入框获取配速值成功:', inputPaceMinutes, ':', inputPaceSeconds);
                updateSplitTimeTable(
                    inputPaceMinutes, 
                    inputPaceSeconds, 
                    currentPaceUnit,
                    '5', // 默认公里粒度
                    '5', // 默认英里粒度
                    calculatedKmEndPoint,
                    calculatedMileEndPoint,
                    hasDistance ? mainDistance : null,
                    hasDistance ? mainUnit : null
                );
            }
        }
    }
}

// 辅助函数：获取距离单位标签
function getDistanceUnitLabel(unit) {
    switch(unit) {
        case 'km': return '公里';
        case 'mile': return '英里';
        case 'm': return '米';
        default: return unit;
    }
}

// 辅助函数：获取配速单位标签
function getPaceUnitLabel(unit) {
    switch(unit) {
        case 'km': return '分钟/公里';
        case 'mile': return '分钟/英里';
        default: return `分钟/${unit}`;
    }
}

// 辅助函数：获取速度单位标签
function getSpeedUnitLabel(unit) {
    switch(unit) {
        case 'kmh': return '公里/小时';
        case 'mph': return '英里/小时';
        case 'ms': return '米/秒';
        default: return `${unit}`;
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
  function updateSplitTimeTable(paceMinutes, paceSeconds, paceUnit, kmGranularity = '5', mileGranularity = '5', kmEndPoint = null, mileEndPoint = null, originalDistance = null, originalUnit = null) {
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
                      mileEndPoint = convertUnit(distance, 'km', 'mile', 'distance');
                  } else if (unit === 'mile') {
                      mileEndPoint = distance;
                      kmEndPoint = convertUnit(distance, 'mile', 'km', 'distance');
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
                              mileEndPoint = convertUnit(kmEndPoint, 'km', 'mile', 'distance');
                          } else if (mainUnit === 'km') {
                              kmEndPoint = mainDistance;
                              mileEndPoint = convertUnit(mainDistance, 'km', 'mile', 'distance');
                          } else if (mainUnit === 'mile') {
                              mileEndPoint = mainDistance;
                              kmEndPoint = convertUnit(mainDistance, 'mile', 'km', 'distance');
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
                          mileEndPoint = convertUnit(kmEndPoint, 'km', 'mile', 'distance');
                      } else if (mainUnit === 'km') {
                          kmEndPoint = mainDistance;
                          mileEndPoint = convertUnit(mainDistance, 'km', 'mile', 'distance');
                      } else if (mainUnit === 'mile') {
                          mileEndPoint = mainDistance;
                          kmEndPoint = convertUnit(mainDistance, 'mile', 'km', 'distance');
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
        // 使用通用单位转换函数转换为英里配速
        const milePaceTotalSeconds = convertUnit(totalPaceSeconds, 'km', 'mile', 'pace');
        milePaceMinutes = Math.floor(milePaceTotalSeconds / 60);
        milePaceSeconds = Math.round(milePaceTotalSeconds % 60);
    } else if (paceUnit === 'mile') {
        // 使用通用单位转换函数转换为公里配速
        const kmPaceTotalSeconds = convertUnit(totalPaceSeconds, 'mile', 'km', 'pace');
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
                <!-- 优先使用原始距离和单位（如果是通过calculate函数调用），否则保留用户当前输入 -->
                <input type="number" id="global-endpoint-distance" class="endpoint-distance" step="0.1" min="0.1" 
                    value="${originalDistance !== null ? originalDistance : (distanceInput ? distanceInput.value : (unitSelector && unitSelector.value === 'mile' ? mileEndPoint : kmEndPoint))}">
                <select id="global-endpoint-unit" class="unit-select">
                    <option value="km" ${originalUnit === 'km' ? 'selected' : (unitSelector && unitSelector.value === 'km' ? 'selected' : '')}>公里</option>
                    <option value="mile" ${originalUnit === 'mile' ? 'selected' : (unitSelector && unitSelector.value === 'mile' ? 'selected' : '')}>英里</option>
                    <option value="m" ${originalUnit === 'm' ? 'selected' : ''}>米</option>
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
                
                // 使用通用单位转换函数
                const convertedDistance = convertUnit(distance, oldUnit, newUnit, 'distance');
                distanceInput.value = convertedDistance.toFixed(1);
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
    // 获取当前表单中的距离信息
    const distanceInput = document.getElementById('distance');
    const distanceUnitSelect = document.getElementById('distance-unit');
    const hasValidDistance = distanceInput && distanceInput.value && !isNaN(parseFloat(distanceInput.value));
    const mainDistance = hasValidDistance ? parseFloat(distanceInput.value) : null;
    const mainUnit = hasValidDistance ? distanceUnitSelect.value : null;
    
    // 计算公里和英里的结束点
    let calculatedKmEndPoint = 42.195; // 默认全马距离
    let calculatedMileEndPoint = 26.2188;
    
    if (hasValidDistance) {
        if (mainUnit === 'km') {
            calculatedKmEndPoint = mainDistance;
            calculatedMileEndPoint = mainDistance * 0.621371;
        } else if (mainUnit === 'mile') {
            calculatedKmEndPoint = mainDistance * 1.60934;
            calculatedMileEndPoint = mainDistance;
        } else if (mainUnit === 'm') {
            // 米转公里和英里
            calculatedKmEndPoint = mainDistance / 1000;
            calculatedMileEndPoint = mainDistance / 1609.34;
        }
    }
    
    updateSplitTimeTable(
        paceMinutes, 
        paceSeconds, 
        paceUnit, 
        kmGranularity, 
        mileGranularity,
        calculatedKmEndPoint,
        calculatedMileEndPoint,
        mainDistance,
        mainUnit
    );
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
        
        // 使用通用单位转换函数，将目标距离单位转换为配速单位
        const distanceInPaceUnit = convertUnit(distance, targetUnit, paceUnit, 'distance');
        
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
            console.log('在showResult中调用updateSplitTimeTable，使用完整参数集');
            // 使用与calculate函数相同的完整参数集
            const distanceInput = document.getElementById('distance');
            const distanceUnitSelect = document.getElementById('distance-unit');
            const hasValidDistance = distanceInput && distanceInput.value && !isNaN(parseFloat(distanceInput.value));
            const mainDistance = hasValidDistance ? parseFloat(distanceInput.value) : null;
            const mainUnit = hasValidDistance ? distanceUnitSelect.value : null;
            
            // 计算公里和英里的结束点
            let calculatedKmEndPoint = 42.195; // 默认全马距离
            let calculatedMileEndPoint = 26.2188;
            
            if (hasValidDistance) {
                if (mainUnit === 'km') {
                    calculatedKmEndPoint = mainDistance;
                    calculatedMileEndPoint = mainDistance * 0.621371;
                } else if (mainUnit === 'mile') {
                    calculatedKmEndPoint = mainDistance * 1.60934;
                    calculatedMileEndPoint = mainDistance;
                } else if (mainUnit === 'm') {
                    // 米转公里和英里
                    calculatedKmEndPoint = mainDistance / 1000;
                    calculatedMileEndPoint = mainDistance / 1609.34;
                }
            }
            
            updateSplitTimeTable(
                paceMinutes, 
                paceSeconds, 
                paceUnit,
                '5', // 默认公里粒度
                '5', // 默认英里粒度
                calculatedKmEndPoint,
                calculatedMileEndPoint,
                mainDistance,
                mainUnit
            );
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