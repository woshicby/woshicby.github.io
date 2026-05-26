let EMOJI_DATA = [];
let currentEmoji = null;
let currentStyle = 'system';
let currentBg = 'transparent';
let currentCategory = 0;

const PREVIEW_MAX_SIZE = 1024;
const MAX_RENDER_SIZE = 16384;

function emojiToCodepoints(emoji) {
    const codepoints = [];
    for (const char of emoji) {
        codepoints.push(char.codePointAt(0).toString(16).toLowerCase());
    }
    return codepoints;
}

function getTwemojiUrl(emoji) {
    const codepoints = emojiToCodepoints(emoji);
    const filtered = codepoints.filter(cp => cp !== 'fe0f');
    return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${filtered.join('-')}.svg`;
}

function getNotoUrl(emoji) {
    const codepoints = emojiToCodepoints(emoji);
    return `https://cdn.jsdelivr.net/gh/googlefonts/noto-emoji@main/svg/emoji_u${codepoints.join('_')}.svg`;
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Image load failed: ' + url));
        img.src = url;
    });
}

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

async function init() {
    await loadEmojiData();
    renderCategoryTabs();
    renderEmojiGrid();
    bindEvents();
    renderEmoji();
}

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

function renderEmojiGrid(filter = '') {
    const grid = document.getElementById('emojiGrid');
    grid.innerHTML = '';
    let emojis = EMOJI_DATA[currentCategory] ? EMOJI_DATA[currentCategory].emojis : [];
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
    if (emojis.length === 0) {
        grid.innerHTML = '<div class="no-results">没有找到匹配的Emoji</div>';
        return;
    }
    emojis.forEach(emoji => {
        const item = document.createElement('div');
        item.className = 'emoji-item' + (currentEmoji && currentEmoji.char === emoji.char ? ' selected' : '');
        item.textContent = emoji.char;
        if (typeof twemoji !== 'undefined') {
            twemoji.parse(item, {
                folder: 'svg',
                ext: '.svg',
                base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/'
            });
        }
        item.title = emoji.name;
        item.addEventListener('click', () => {
            currentEmoji = emoji;
            document.querySelectorAll('.emoji-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            renderEmoji();
        });
        grid.appendChild(item);
    });
}

function updateSizeInfo(size) {
    const info = document.getElementById('sizeInfo');
    if (info) info.textContent = `${size} × ${size}`;
}

function drawBackground(ctx, size) {
    if (currentBg !== 'transparent') {
        if (currentBg === 'white') {
            ctx.fillStyle = '#ffffff';
        } else if (currentBg === 'black') {
            ctx.fillStyle = '#000000';
        } else {
            ctx.fillStyle = document.getElementById('customBgColor').value;
        }
        ctx.fillRect(0, 0, size, size);
    }
}

function drawSystemEmoji(ctx, emojiChar, size) {
    const fontSize = size * 0.8;
    ctx.font = `${fontSize}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emojiChar, size / 2, size / 2);
}

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

async function renderToCanvas(ctx, size) {
    ctx.clearRect(0, 0, size, size);
    drawBackground(ctx, size);

    if (!currentEmoji) {
        ctx.fillStyle = '#cccccc';
        ctx.font = `${size * 0.15}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('选择Emoji', size / 2, size / 2);
        return;
    }

    const emojiChar = currentEmoji.char;

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

async function renderEmoji() {
    const canvas = document.getElementById('emojiCanvas');
    const ctx = canvas.getContext('2d');
    const targetSize = parseInt(document.getElementById('renderSize').value) || 512;

    updateSizeInfo(targetSize);

    const previewSize = Math.min(targetSize, PREVIEW_MAX_SIZE);
    canvas.width = previewSize;
    canvas.height = previewSize;

    await renderToCanvas(ctx, previewSize);
}

async function exportPng() {
    if (!currentEmoji) return;

    const targetSize = parseInt(document.getElementById('renderSize').value) || 512;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = targetSize;
    tempCanvas.height = targetSize;
    const ctx = tempCanvas.getContext('2d');

    if (!ctx) {
        alert('渲染失败：尺寸 ' + targetSize + '×' + targetSize + ' 超出浏览器支持范围，请尝试较小的尺寸（建议不超过8192）。');
        return;
    }

    await renderToCanvas(ctx, targetSize);

    try {
        const dataUrl = tempCanvas.toDataURL('image/png');
        const link = document.createElement('a');
        const name = currentEmoji ? currentEmoji.name : 'emoji';
        link.download = `${name}_${targetSize}x${targetSize}.png`;
        link.href = dataUrl;
        link.click();
    } catch (e) {
        alert('导出失败：尺寸 ' + targetSize + '×' + targetSize + ' 过大，请尝试较小的尺寸。');
    }
}

function bindEvents() {
    const renderSize = document.getElementById('renderSize');
    const renderSizeInput = document.getElementById('renderSizeInput');

    renderSize.addEventListener('input', () => {
        renderSizeInput.value = renderSize.value;
        updateSizeInfo(parseInt(renderSize.value));
        renderEmoji();
    });

    renderSizeInput.addEventListener('input', () => {
        let val = parseInt(renderSizeInput.value);
        if (isNaN(val)) return;
        val = Math.max(64, Math.min(MAX_RENDER_SIZE, val));
        renderSize.value = val;
        updateSizeInfo(val);
        renderEmoji();
    });

    renderSizeInput.addEventListener('blur', () => {
        let val = parseInt(renderSizeInput.value);
        if (isNaN(val) || val < 64) val = 64;
        if (val > MAX_RENDER_SIZE) val = MAX_RENDER_SIZE;
        renderSizeInput.value = val;
        renderSize.value = val;
        renderEmoji();
    });

    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStyle = btn.dataset.style;
            renderEmoji();
        });
    });

    document.querySelectorAll('.bg-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentBg = btn.dataset.bg;
            renderEmoji();
        });
    });

    document.getElementById('customBgColor').addEventListener('input', () => {
        document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
        const customBtn = document.querySelector('.custom-bg-btn');
        if (customBtn) customBtn.classList.add('active');
        currentBg = 'custom';
        renderEmoji();
    });

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

    document.getElementById('emojiSearch').addEventListener('input', (e) => {
        const filter = e.target.value.trim();
        if (filter) {
            renderEmojiGrid(filter);
        } else {
            renderEmojiGrid();
        }
    });

    document.getElementById('exportPng').addEventListener('click', exportPng);

    document.getElementById('copyEmoji').addEventListener('click', () => {
        if (!currentEmoji) return;
        navigator.clipboard.writeText(currentEmoji.char).then(() => {
            const btn = document.getElementById('copyEmoji');
            const originalText = btn.textContent;
            btn.textContent = '✅ 已复制';
            setTimeout(() => { btn.textContent = originalText; }, 1500);
        }).catch(() => {
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

document.addEventListener('DOMContentLoaded', init);
