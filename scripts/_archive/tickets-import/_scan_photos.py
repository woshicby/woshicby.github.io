import json
import os
import shutil
from datetime import datetime, timedelta
from PIL import Image
from PIL.ExifTags import Base as ExifBase

TICKETS_JSON = r'c:\工程文件\Git Repository\woshicby.github.io\JSON\tickets.json'
TICKETS_DIR = r'c:\工程文件\Git Repository\woshicby.github.io\images\tickets'
ARCHIVE_ROOT = r'Y:\图片视频素材合集'

# 1. 读取电影时间，构建时间窗口
with open(TICKETS_JSON, 'r', encoding='utf-8') as f:
    tickets = json.load(f)

movies = [t for t in tickets if t.get('type') == 'movie']
windows = []
for m in movies:
    dt = datetime.strptime(m['date'], '%Y-%m-%d %H:%M:%S')
    win_start = dt - timedelta(hours=1)
    win_end = dt + timedelta(hours=3, minutes=30)
    windows.append({
        'title': m['title'],
        'date': m['date'],
        'date_prefix': dt.strftime('%Y%m%d'),
        'start': win_start,
        'end': win_end,
        'movie_dt': dt,
    })

# 2. 检查现有票根图片，构建命名序号映射
existing_counts = {}
if os.path.exists(TICKETS_DIR):
    for fn in os.listdir(TICKETS_DIR):
        # 文件名格式: YYYYMMDD_电影名_序号.jpg
        parts = fn.rsplit('_', 1)
        if len(parts) == 2 and parts[0]:
            key = parts[0]  # YYYYMMDD_电影名
            try:
                seq = int(parts[1].replace('.jpg', '').replace('.jpeg', '').replace('.png', ''))
                existing_counts[key] = max(existing_counts.get(key, 0), seq)
            except ValueError:
                pass

# 3. 扫描手机照片存档文件夹
phone_dirs = []
for d in os.listdir(ARCHIVE_ROOT):
    if d.startswith('手机照片存档'):
        phone_dirs.append(os.path.join(ARCHIVE_ROOT, d))

IMAGE_EXTS = {'.jpg', '.jpeg', '.png'}
HEIC_FILES = []

def get_exif_time(path):
    """用 Pillow 读取 EXIF 拍摄时间"""
    try:
        img = Image.open(path)
        exif = img._getexif()
        if exif:
            # 优先 DateTimeOriginal (36867), 然后 DateTime (306)
            for tag in (36867, 36868, 306):
                if tag in exif:
                    val = exif[tag]
                    if isinstance(val, str):
                        try:
                            return datetime.strptime(val, '%Y:%m:%d %H:%M:%S')
                        except ValueError:
                            pass
        img.close()
    except Exception:
        pass
    return None

def match_movie(photo_dt):
    """找到照片时间匹配的电影，返回匹配的 movie window 或 None"""
    best = None
    best_diff = None
    for w in windows:
        if w['start'] <= photo_dt <= w['end']:
            diff = abs((photo_dt - w['movie_dt']).total_seconds())
            if best_diff is None or diff < best_diff:
                best = w
                best_diff = diff
    return best

results = []
scanned = 0
matched = 0

for phone_dir in phone_dirs:
    folder_name = os.path.basename(phone_dir)
    for root, dirs, files in os.walk(phone_dir):
        for fn in files:
            ext = os.path.splitext(fn)[1].lower()
            if ext == '.heic':
                HEIC_FILES.append(os.path.join(root, fn))
                continue
            if ext not in IMAGE_EXTS:
                continue

            scanned += 1
            fpath = os.path.join(root, fn)
            photo_dt = get_exif_time(fpath)
            if photo_dt is None:
                continue

            w = match_movie(photo_dt)
            if w:
                matched += 1
                # 确定序号
                key = f"{w['date_prefix']}_{w['title']}"
                seq = existing_counts.get(key, 0) + 1
                existing_counts[key] = seq
                target_name = f"{w['date_prefix']}_{w['title']}_{seq}.jpg"
                target_path = os.path.join(TICKETS_DIR, target_name)

                # 复制
                shutil.copy2(fpath, target_path)
                results.append({
                    'movie': w['title'],
                    'date': w['date'],
                    'photo_time': photo_dt.strftime('%Y-%m-%d %H:%M:%S'),
                    'source': fpath,
                    'target': target_name,
                })

# 输出结果
print(f'扫描完成: 共扫描 {scanned} 张图片 (JPG/JPEG/PNG), 匹配并复制 {matched} 张')
print(f'跳过 HEIC 文件: {len(HEIC_FILES)} 张 (需手动处理)')
print()

if results:
    # 按电影分组输出
    by_movie = {}
    for r in results:
        by_movie.setdefault(r['movie'], []).append(r)
    for movie, items in sorted(by_movie.items(), key=lambda x: x[1][0]['date'], reverse=True):
        print(f"【{movie}】({items[0]['date']}) — {len(items)} 张")
        for r in items:
            print(f"  {r['photo_time']} → {r['target']}")
        print()
else:
    print('未找到匹配的照片')

# 输出 HEIC 文件列表
if HEIC_FILES:
    print(f'\n=== HEIC 文件 (需手动检查) ===')
    for f in HEIC_FILES:
        mtime = datetime.fromtimestamp(os.path.getmtime(f))
        w = match_movie(mtime)
        if w:
            print(f"  {mtime.strftime('%Y-%m-%d %H:%M:%S')} | {w['title']} | {os.path.basename(f)}")
