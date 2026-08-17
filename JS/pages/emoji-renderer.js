/**
 * Emoji 渲染器页面脚本
 * 对应页面: emoji-renderer.html
 * 功能: 从 emoji-data.json 加载 Emoji 分类,支持按分类/搜索选择 Emoji,
 *       选择渲染样式(系统/Twitter/Google)和背景,可导出 PNG 或复制。
 */

// ============ 全局状态 ============
let EMOJI_DATA = [];        // Emoji 数据(分类+表情列表)
let currentEmoji = null;    // 当前选中的 Emoji
let currentStyle = 'system'; // 当前渲染样式: system/twitter/google
let currentBg = 'transparent'; // 当前背景: transparent/white/black/custom
let currentCategory = 0;    // 当前选中的分类索引

// 渲染尺寸限制
const PREVIEW_MAX_SIZE = 1024;   // 画布预览最大尺寸(超过则缩小预览)
const MAX_RENDER_SIZE = 16384;   // 导出最大尺寸(浏览器 canvas 限制)

/**
 * 将 Emoji 字符转为 Unicode 码点数组(十六进制小写)
 * @param {string} emoji - Emoji 字符
 * @returns {string[]} 码点数组(如 ['1f600'])
 */
function emojiToCodepoints(emoji) {
    const codepoints = [];
    for (const char of emoji) {
        codepoints.push(char.codePointAt(0).toString(16).toLowerCase());
    }
    return codepoints;
}

/**
 * 生成 Twemoji(Twitter)SVG 图片 URL
 * 过滤变体选择符 fe0f(避免 URL 冗余)
 * @param {string} emoji - Emoji 字符
 * @returns {string} 图片 URL
 */
function getTwemojiUrl(emoji) {
    const codepoints = emojiToCodepoints(emoji);
    const filtered = codepoints.filter(cp => cp !== 'fe0f');
    return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${filtered.join('-')}.svg`;
}

/**
 * 生成 Noto Emoji(Google)SVG 图片 URL
 * @param {string} emoji - Emoji 字符
 * @returns {string} 图片 URL
 */
function getNotoUrl(emoji) {
    const codepoints = emojiToCodepoints(emoji);
    return `https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/svg/emoji_u${codepoints.join('_')}.svg`;
}

/**
 * 加载图片(带跨域设置)
 * @param {string} url - 图片 URL
 * @returns {Promise<HTMLImageElement>} 加载成功的图片对象
 */
function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';   // 允许跨域绘制到 canvas
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image load failed: ' + url));
        img.src = url;
    });
}

/**
 * 加载 Emoji 数据(emoji-data.json)
 * 失败时置空数组(页面仍可用,只是无数据)
 */
async function loadEmojiData() {
    try {
        const response = await fetch('./JSON/emoji-data.json');
        if (!response.ok) throw new Error('Failed to load emoji data');
        EMOJI_DATA = await response.json();
    } catch (e) {
        console.error('加载Emoji数据失败:', e);
        EMOJI_DATA = [];
    }
}

/**
 * 初始化页面: 加载数据 → 渲染分类/网格 → 绑定事件 → 渲染画布
 */
async function init() {
    await loadEmojiData();
    renderCategoryTabs();
    renderEmojiGrid();
    bindEvents();
    renderEmoji();
}

/**
 * 渲染分类标签页
 * 每个分类生成一个按钮,点击切换分类并重新渲染网格
 */
function renderCategoryTabs() {
    const tabsContainer = document.getElementById('categoryTabs');
    tabsContainer.innerHTML = '';
    EMOJI_DATA.forEach((cat, index) => {
        const btn = document.createElement('button');
        btn.className = 'cat-btn' + (index === currentCategory ? ' active' : '');
        btn.textContent = cat.icon + ' ' + cat.category;
        btn.addEventListener('click', () => {
            currentCategory = index;
            document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderEmojiGrid();
        });
        tabsContainer.appendChild(btn);
    });
}

/**
 * 渲染 Emoji 网格
 * @param {string} [filter=''] - 搜索关键词; 非空时跨分类搜索名称/字符
 */
function renderEmojiGrid(filter = '') {
    const grid = document.getElementById('emojiGrid');
    grid.innerHTML = '';
    // 无搜索: 显示当前分类的 Emoji
    let emojis = EMOJI_DATA[currentCategory] ? EMOJI_DATA[currentCategory].emojis : [];
    // 有搜索: 跨所有分类搜索
    if (filter) {
        emojis = [];
        EMOJI_DATA.forEach(cat => {
            cat.emojis.forEach(e => {
                if (e.name.includes(filter) || e.char.includes(filter)) {
                    emojis.push(e);
                }
            });
        });
    }
    // 无结果提示
    if (emojis.length === 0) {
        grid.innerHTML = '<div class="no-results">没有找到匹配的Emoji</div>';
        return;
    }
    // 逐个渲染 Emoji 格子
    emojis.forEach(emoji => {
        const item = document.createElement('div');
        item.className = 'emoji-item' + (currentEmoji && currentEmoji.char === emoji.char ? ' selected' : '');
        item.textContent = emoji.char;
        // 若加载了 twemoji 库,用其渲染为跨平台一致的图片
        if (typeof twemoji !== 'undefined') {
            twemoji.parse(item, {
                folder: 'svg',
                ext: '.svg',
                base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/'
            });
        }
        item.title = emoji.name;
        // 点击选择 Emoji
        item.addEventListener('click', () => {
            currentEmoji = emoji;
            document.querySelectorAll('.emoji-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            renderEmoji();
        });
        grid.appendChild(item);
    });
}

/**
 * 更新尺寸信息显示
 * @param {number} size - 当前渲染尺寸
 */
function updateSizeInfo(size) {
    const info = document.getElementById('sizeInfo');
    if (info) info.textContent = `${size} × ${size}`;
}

/**
 * 绘制画布背景
 * @param {CanvasRenderingContext2D} ctx - 画布上下文
 * @param {number} size - 画布尺寸
 */
function drawBackground(ctx, size) {
    if (currentBg !== 'transparent') {
        if (currentBg === 'white') {
            ctx.fillStyle = '#ffffff';
        } else if (currentBg === 'black') {
            ctx.fillStyle = '#000000';
        } else {
            // 自定义背景色(取色器)
            ctx.fillStyle = document.getElementById('customBgColor').value;
        }
        ctx.fillRect(0, 0, size, size);
    }
}

/**
 * 用系统字体绘制 Emoji
 * @param {CanvasRenderingContext2D} ctx - 画布上下文
 * @param {string} emojiChar - Emoji 字符
 * @param {number} size - 画布尺寸
 */
function drawSystemEmoji(ctx, emojiChar, size) {
    const fontSize = size * 0.8;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emojiChar, size / 2, size / 2);
}

/**
 * 绘制平台 Emoji(加载 SVG 图片绘制到画布)
 * 加载失败时回退到系统 Emoji
 * @param {CanvasRenderingContext2D} ctx - 画布上下文
 * @param {string} emojiChar - Emoji 字符
 * @param {number} size - 画布尺寸
 * @param {Function} urlFn - URL 生成函数(getTwemojiUrl/getNotoUrl)
 */
async function drawPlatformEmoji(ctx, emojiChar, size, urlFn) {
    try {
        const url = urlFn(emojiChar);
        const img = await loadImage(url);
        const padding = size * 0.1;
        ctx.drawImage(img, padding, padding, size - padding * 2, size - padding * 2);
    } catch (e) {
        console.warn('平台emoji加载失败，回退到系统默认:', e.message);
        drawSystemEmoji(ctx, emojiChar, size);
    }
}

/**
 * 渲染 Emoji 到画布(核心绘制流程)
 * 清空 → 背景 → 按样式绘制(平台图片或系统字体)
 * @param {CanvasRenderingContext2D} ctx - 画布上下文
 * @param {number} size - 画布尺寸
 */
async function renderToCanvas(ctx, size) {
    // 清空画布
    ctx.clearRect(0, 0, size, size);
    drawBackground(ctx, size);

    // 未选择 Emoji: 显示提示文字
    if (!currentEmoji) {
        ctx.fillStyle = '#cccccc';
        ctx.font = `${size * 0.15}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('选择Emoji', size / 2, size / 2);
        return;
    }

    const emojiChar = currentEmoji.char;

    // 按选择样式绘制
    switch (currentStyle) {
        case 'twitter':
            await drawPlatformEmoji(ctx, emojiChar, size, getTwemojiUrl);
            break;
        case 'google':
            await drawPlatformEmoji(ctx, emojiChar, size, getNotoUrl);
            break;
        default:
            drawSystemEmoji(ctx, emojiChar, size);
    }
}

/**
 * 渲染预览画布(限制预览尺寸避免性能问题)
 */
async function renderEmoji() {
    const canvas = document.getElementById('emojiCanvas');
    const ctx = canvas.getContext('2d');
    const targetSize = parseInt(document.getElementById('renderSize').value) || 512;

    updateSizeInfo(targetSize);

    // 预览尺寸: 不超过 PREVIEW_MAX_SIZE
    const previewSize = Math.min(targetSize, PREVIEW_MAX_SIZE);
    canvas.width = previewSize;
    canvas.height = previewSize;

    await renderToCanvas(ctx, previewSize);
}

/**
 * 导出 PNG(按目标尺寸渲染)
 * 大尺寸用临时 canvas,导出失败提示减小尺寸
 */
async function exportPng() {
    if (!currentEmoji) return;

    const targetSize = parseInt(document.getElementById('renderSize').value) || 512;

    // 临时画布(目标尺寸,不缩放)
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetSize;
    tempCanvas.height = targetSize;
    const ctx = tempCanvas.getContext('2d');

    // 浏览器不支持超大 canvas
    if (!ctx) {
        alert('渲染失败：尺寸 ' + targetSize + '×' + targetSize + ' 超出浏览器支持范围，请尝试较小的尺寸（建议不超过8192）。');
        return;
    }

    await renderToCanvas(ctx, targetSize);

    try {
        // 导出并触发下载
        const dataUrl = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        const name = currentEmoji ? currentEmoji.name : 'emoji';
        link.download = `${name}_${targetSize}x${targetSize}.png`;
        link.href = dataUrl;
        link.click();
    } catch (e) {
        // toDataURL 失败(通常因 canvas 过大)
        alert('导出失败：尺寸 ' + targetSize + '×' + targetSize + ' 过大，请尝试较小的尺寸。');
    }
}

/**
 * 绑定页面所有交互事件
 * 尺寸滑块/输入框、样式按钮、背景按钮、自定义颜色、搜索、导出、复制
 */
function bindEvents() {
    const renderSize = document.getElementById('renderSize');
    const renderSizeInput = document.getElementById('renderSizeInput');

    // 尺寸滑块: 同步输入框并重渲染
    renderSize.addEventListener('input', () => {
        renderSizeInput.value = renderSize.value;
        updateSizeInfo(parseInt(renderSize.value));
        renderEmoji();
    });

    // 尺寸输入框: 限制范围并重渲染
    renderSizeInput.addEventListener('input', () => {
        let val = parseInt(renderSizeInput.value);
        if (isNaN(val)) return;
        val = Math.max(64, Math.min(MAX_RENDER_SIZE, val));
        renderSize.value = val;
        updateSizeInfo(val);
        renderEmoji();
    });

    // 输入框失焦: 校正非法值
    renderSizeInput.addEventListener('blur', () => {
        let val = parseInt(renderSizeInput.value);
        if (isNaN(val) || val < 64) val = 64;
        if (val > MAX_RENDER_SIZE) val = MAX_RENDER_SIZE;
        renderSizeInput.value = val;
        renderSize.value = val;
        renderEmoji();
    });

    // 样式按钮(system/twitter/google)
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStyle = btn.dataset.style;
            renderEmoji();
        });
    });

    // 背景按钮(transparent/white/black/custom)
    document.querySelectorAll('.bg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentBg = btn.dataset.bg;
            renderEmoji();
        });
    });

    // 自定义背景色选择
    document.getElementById('customBgColor').addEventListener('input', () => {
        document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
        const customBtn = document.querySelector('.custom-bg-btn');
        if (customBtn) customBtn.classList.add('active');
        currentBg = 'custom';
        renderEmoji();
    });

    // 自定义背景按钮: 激活并弹出取色器
    const customBgBtn = document.querySelector('.custom-bg-btn');
    if (customBgBtn) {
        customBgBtn.addEventListener('click', () => {
            document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
            customBgBtn.classList.add('active');
            currentBg = 'custom';
            document.getElementById('customBgColor').click();
            renderEmoji();
        });
    }

    // 搜索框: 实时过滤 Emoji
    document.getElementById('emojiSearch').addEventListener('input', (e) => {
        const filter = e.target.value.trim();
        if (filter) {
            renderEmojiGrid(filter);
        } else {
            renderEmojiGrid();
        }
    });

    // 导出 PNG
    document.getElementById('exportPng').addEventListener('click', exportPng);

    // 复制 Emoji(优先 Clipboard API,回退 execCommand)
    document.getElementById('copyEmoji').addEventListener('click', () => {
        if (!currentEmoji) return;
        navigator.clipboard.writeText(currentEmoji.char).then(() => {
            const btn = document.getElementById('copyEmoji');
            const originalText = btn.textContent;
            btn.textContent = '✅ 已复制';
            setTimeout(() => { btn.textContent = originalText; }, 1500);
        }).catch(() => {
            // 回退: 隐藏 textarea + execCommand
            const textarea = document.createElement('textarea');
            textarea.value = currentEmoji.char;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            const btn = document.getElementById('copyEmoji');
            const originalText = btn.textContent;
            btn.textContent = '✅ 已复制';
            setTimeout(() => { btn.textContent = originalText; }, 1500);
        });
    });
}

// DOM 就绪后初始化
document.addEventListener('DOMContentLoaded', init);
