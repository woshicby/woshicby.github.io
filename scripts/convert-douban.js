const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const SHEET_STATUS_MAP = [
    { status: 'watched' },
    { status: 'watching' },
    { status: 'wantToWatch' },
    { status: 'listened' },
    { status: 'listening' },
    { status: 'wantToListen' },
    { status: 'read' },
    { status: 'reading' },
    { status: 'wantToRead' },
    { status: 'played' },
    { status: 'playing' },
    { status: 'wantToPlay' },
    { status: 'watched' },
    { status: 'wantToWatch' }
];

function detectCategory(link) {
    if (!link) return 'unknown';
    if (link.includes('movie.douban.com')) return 'movie';
    if (link.includes('music.douban.com')) return 'music';
    if (link.includes('book.douban.com')) return 'book';
    if (link.includes('douban.com/game')) return 'game';
    if (link.includes('douban.com/location/drama')) return 'drama';
    return 'unknown';
}

function parseMovieIntro(intro) {
    if (!intro) return { year: null, region: '', genres: [], directors: '', actors: '' };
    const parts = intro.split(' / ');
    return {
        year: parseInt(parts[0]) || null,
        region: parts[1] || '',
        genres: parts[2] ? parts[2].split(' ').filter(Boolean) : [],
        directors: parts[3] || '',
        actors: parts[4] || ''
    };
}

function parseBookIntro(intro) {
    if (!intro) return { author: '', year: null, publisher: '' };
    const parts = intro.split(' / ');
    return {
        author: parts[0] || '',
        year: parseInt(parts[1]) || null,
        publisher: parts[2] || ''
    };
}

function parseMusicIntro(intro) {
    if (!intro) return { artist: '', year: null };
    const parts = intro.split(' / ');
    return {
        artist: parts[0] || '',
        year: parseInt(parts[1]) || null
    };
}

function parseGameIntro(intro) {
    if (!intro) return { genres: [], platforms: [], developer: '', releaseDate: '' };
    const parts = intro.split('/');
    const genres = [];
    const platforms = [];
    let developer = '';
    let releaseDate = '';
    const knownPlatforms = ['PC', 'Mac', 'iPhone', 'iPad', 'Android', 'PlayStation 5', 'PlayStation 4',
        'Xbox Series X', 'Xbox One', 'Nintendo Switch', 'Nintendo Switch 2', 'Steam Deck',
        'Web', 'PS Vita', 'Nintendo 3DS', 'Wii U'];

    for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;
        if (knownPlatforms.some(p => trimmed === p)) {
            platforms.push(trimmed);
        } else if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            releaseDate = trimmed;
        } else if (trimmed === trimmed.toUpperCase() && trimmed.length > 2 && !trimmed.includes(' ')) {
            developer = trimmed;
        } else if (/^[A-Z]/.test(trimmed) && trimmed.includes(' ') && !knownPlatforms.includes(trimmed)) {
            developer = trimmed;
        } else if (/^[\u4e00-\u9fa5]/.test(trimmed) && !knownPlatforms.includes(trimmed)) {
            if (genres.length === 0 && !developer) {
                genres.push(trimmed);
            } else if (!developer && !releaseDate) {
                developer = trimmed;
            } else {
                genres.push(trimmed);
            }
        } else {
            genres.push(trimmed);
        }
    }

    return { genres, platforms, developer, releaseDate };
}

function parseDramaIntro(intro) {
    if (!intro) return { type: '', name: '' };
    const parts = intro.split(' / ');
    return {
        type: parts[0] ? parts[0].trim() : '',
        name: parts[1] ? parts[1].trim() : ''
    };
}

function mapRow(row, category, status) {
    const keys = Object.keys(row);
    const getValueByIndex = (idx) => row[keys[idx]] || '';

    const title = getValueByIndex(0);
    const intro = getValueByIndex(1);
    const doubanRating = parseFloat(getValueByIndex(2)) || 0;
    const link = getValueByIndex(3);
    const createdAt = getValueByIndex(4);
    const myRating = parseInt(getValueByIndex(5)) || 0;
    const tagsStr = getValueByIndex(6);
    const review = getValueByIndex(7);

    const tags = tagsStr ? tagsStr.split(' ').filter(Boolean) : [];

    const base = { title, doubanRating, myRating, review, tags, link, createdAt, category, status };

    switch (category) {
        case 'movie': {
            const parsed = parseMovieIntro(intro);
            return { ...base, year: parsed.year, region: parsed.region, genres: parsed.genres, directors: parsed.directors, actors: parsed.actors };
        }
        case 'book': {
            const parsed = parseBookIntro(intro);
            return { ...base, author: parsed.author, year: parsed.year, publisher: parsed.publisher };
        }
        case 'music': {
            const parsed = parseMusicIntro(intro);
            return { ...base, artist: parsed.artist, year: parsed.year };
        }
        case 'game': {
            const parsed = parseGameIntro(intro);
            return { ...base, genres: parsed.genres, platforms: parsed.platforms, developer: parsed.developer, releaseDate: parsed.releaseDate };
        }
        case 'drama': {
            const parsed = parseDramaIntro(intro);
            return { ...base, type: parsed.type, dramaName: parsed.name };
        }
        default:
            return base;
    }
}

function convert() {
    const projectRoot = path.resolve(__dirname, '..');
    const workbook = XLSX.readFile(path.join(projectRoot, 'documents/豆伴(232919949).xlsx'));
    const result = {};

    workbook.SheetNames.forEach((sheetName, sheetIndex) => {
        const sheet = workbook.Sheets[sheetName];
        const data = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        if (data.length === 0) return;

        const statusInfo = SHEET_STATUS_MAP[sheetIndex] || { status: 'unknown' };
        const status = statusInfo.status;
        const category = detectCategory(data[0][Object.keys(data[0])[3]]);

        if (!result[category]) {
            result[category] = {};
        }

        result[category][status] = data.map(row => mapRow(row, category, status));

        console.log(`Sheet ${sheetIndex}: -> ${category}/${status} (${data.length} items)`);
    });

    for (const [category, statuses] of Object.entries(result)) {
        const outputPath = path.join(projectRoot, 'JSON', `douban-${category}s.json`);
        fs.writeFileSync(outputPath, JSON.stringify(statuses, null, 2), 'utf8');
        const totalItems = Object.values(statuses).reduce((sum, arr) => sum + arr.length, 0);
        console.log(`Written: douban-${category}s.json (${totalItems} total items)`);
    }

    console.log('\nDone!');
}

convert();
