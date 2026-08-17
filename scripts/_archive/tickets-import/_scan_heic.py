"""扫描 HEIC 文件：解析 EXIF 时间，匹配电影窗口，用 WIC 转换为 JPG 并复制到 tickets 目录。"""
import json
import os
import struct
import subprocess
import tempfile
from datetime import datetime, timedelta

TICKETS_JSON = r'c:\工程文件\Git Repository\woshicby.github.io\JSON\tickets.json'
TICKETS_DIR = r'c:\工程文件\Git Repository\woshicby.github.io\images\tickets'
ARCHIVE_ROOT = r'Y:\图片视频素材合集'
PS_SCRIPT = r'c:\工程文件\Git Repository\woshicby.github.io\_heic_converter.ps1'

# ========== HEIC EXIF 解析 ==========
def find_tiff_headers(data):
    positions = []
    idx = 0
    while True:
        idx = data.find(b'MM\x00\x2a', idx)
        if idx == -1:
            break
        positions.append(('>', idx))
        idx += 1
    idx = 0
    while True:
        idx = data.find(b'II\x2a\x00', idx)
        if idx == -1:
            break
        positions.append(('<', idx))
        idx += 1
    return positions

def parse_tiff_ifd(data, tiff_start, endian):
    data_len = len(data)
    if tiff_start + 8 > data_len:
        return None
    ifd_offset = struct.unpack(endian + 'I', data[tiff_start+4:tiff_start+8])[0]
    ifd_abs = tiff_start + ifd_offset
    if ifd_abs + 2 > data_len:
        return None
    count = struct.unpack(endian + 'H', data[ifd_abs:ifd_abs+2])[0]
    for i in range(count):
        entry = ifd_abs + 2 + i * 12
        if entry + 12 > data_len:
            break
        tag = struct.unpack(endian + 'H', data[entry:entry+2])[0]
        ftype = struct.unpack(endian + 'H', data[entry+2:entry+4])[0]
        count_val = struct.unpack(endian + 'I', data[entry+4:entry+8])[0]
        if tag == 34665 and ftype == 4:
            exif_ifd_offset = struct.unpack(endian + 'I', data[entry+8:entry+12])[0]
            exif_abs = tiff_start + exif_ifd_offset
            if exif_abs + 2 <= data_len:
                exif_count = struct.unpack(endian + 'H', data[exif_abs:exif_abs+2])[0]
                for j in range(exif_count):
                    e_entry = exif_abs + 2 + j * 12
                    if e_entry + 12 > data_len:
                        break
                    e_tag = struct.unpack(endian + 'H', data[e_entry:e_entry+2])[0]
                    e_type = struct.unpack(endian + 'H', data[e_entry+2:e_entry+4])[0]
                    e_count = struct.unpack(endian + 'I', data[e_entry+4:e_entry+8])[0]
                    if e_tag in (36867, 36868) and e_type == 2:
                        if e_count <= 4:
                            val = data[e_entry+8:e_entry+8+e_count-1]
                        else:
                            val_offset = struct.unpack(endian + 'I', data[e_entry+8:e_entry+12])[0]
                            val_abs = tiff_start + val_offset
                            if val_abs + e_count <= data_len:
                                val = data[val_abs:val_abs+e_count-1]
                            else:
                                continue
                        try:
                            s = val.decode('ascii', errors='replace').strip('\x00')
                            return datetime.strptime(s, '%Y:%m:%d %H:%M:%S')
                        except (ValueError, TypeError):
                            pass
        if tag == 306 and ftype == 2:
            if count_val <= 4:
                val = data[entry+8:entry+8+count_val-1]
            else:
                val_offset = struct.unpack(endian + 'I', data[entry+8:entry+12])[0]
                val_abs = tiff_start + val_offset
                if val_abs + count_val <= data_len:
                    val = data[val_abs:val_abs+count_val-1]
                else:
                    continue
            try:
                s = val.decode('ascii', errors='replace').strip('\x00')
                return datetime.strptime(s, '%Y:%m:%d %H:%M:%S')
            except (ValueError, TypeError):
                pass
    return None

def get_heic_time(path):
    with open(path, 'rb') as f:
        data = f.read()
    for endian, pos in find_tiff_headers(data):
        dt = parse_tiff_ifd(data, pos, endian)
        if dt:
            return dt
    return None

# ========== WIC 转换 ==========
def heic_to_jpg(heic_path, jpg_path):
    job = {'input': heic_path, 'output': jpg_path}
    with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False, encoding='utf-8') as tf:
        json.dump(job, tf, ensure_ascii=False)
        job_file = tf.name
    try:
        cmd = ['powershell', '-ExecutionPolicy', 'Bypass', '-File', PS_SCRIPT, '-JobFile', job_file]
        r = subprocess.run(cmd, capture_output=True, timeout=60)
        if r.returncode == 0:
            output = r.stdout.decode('utf-8', errors='replace').strip()
            try:
                result = json.loads(output)
                return result.get('success', False)
            except json.JSONDecodeError:
                pass
        return os.path.exists(jpg_path)
    except Exception:
        return False
    finally:
        if os.path.exists(job_file):
            os.unlink(job_file)

# ========== 主逻辑 ==========
# 1. 读取电影时间窗口
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

# 2. 构建现有文件序号映射
existing_counts = {}
if os.path.exists(TICKETS_DIR):
    for fn in os.listdir(TICKETS_DIR):
        parts = fn.rsplit('_', 1)
        if len(parts) == 2 and parts[0]:
            try:
                seq = int(parts[1].replace('.jpg', '').replace('.jpeg', '').replace('.png', ''))
                existing_counts[parts[0]] = max(existing_counts.get(parts[0], 0), seq)
            except ValueError:
                pass

def match_movie(photo_dt):
    best = None
    best_diff = None
    for w in windows:
        if w['start'] <= photo_dt <= w['end']:
            diff = abs((photo_dt - w['movie_dt']).total_seconds())
            if best_diff is None or diff < best_diff:
                best = w
                best_diff = diff
    return best

# 3. 查找所有 HEIC 文件
phone_dirs = []
for d in os.listdir(ARCHIVE_ROOT):
    if d.startswith('手机照片存档'):
        phone_dirs.append(os.path.join(ARCHIVE_ROOT, d))

heic_files = []
for phone_dir in phone_dirs:
    for root, dirs, files in os.walk(phone_dir):
        for fn in files:
            if fn.lower().endswith('.heic'):
                heic_files.append(os.path.join(root, fn))

print(f'找到 {len(heic_files)} 个 HEIC 文件，开始解析 EXIF 并匹配...')

results = []
matched = 0
no_exif = 0
no_match = 0
convert_fail = 0

for i, heic_path in enumerate(heic_files, 1):
    basename = os.path.basename(heic_path)
    print(f'[{i}/{len(heic_files)}] {basename}', end='', flush=True)

    # 读取 EXIF 时间
    photo_dt = get_heic_time(heic_path)
    if photo_dt is None:
        print(' → 无 EXIF 时间')
        no_exif += 1
        continue

    # 匹配电影
    w = match_movie(photo_dt)
    if w:
        # 转换并复制
        key = f"{w['date_prefix']}_{w['title']}"
        seq = existing_counts.get(key, 0) + 1
        existing_counts[key] = seq
        target_name = f"{w['date_prefix']}_{w['title']}_{seq}.jpg"
        target_path = os.path.join(TICKETS_DIR, target_name)

        if os.path.exists(target_path):
            os.unlink(target_path)

        if heic_to_jpg(heic_path, target_path):
            matched += 1
            print(f' → 匹配! {photo_dt.strftime("%Y-%m-%d %H:%M:%S")} → {target_name}')
            results.append({
                'movie': w['title'],
                'date': w['date'],
                'photo_time': photo_dt.strftime('%Y-%m-%d %H:%M:%S'),
                'source': heic_path,
                'target': target_name,
            })
        else:
            convert_fail += 1
            print(f' → 匹配但转换失败: {target_name}')
    else:
        no_match += 1
        print(f' → 不匹配 ({photo_dt.strftime("%Y-%m-%d %H:%M:%S")})')

print()
print(f'\n=== 汇总 ===')
print(f'总HEIC: {len(heic_files)}, 匹配并复制: {matched}, 不匹配: {no_match}, 无EXIF: {no_exif}, 转换失败: {convert_fail}')

if results:
    print('\n=== 匹配结果 ===')
    by_movie = {}
    for r in results:
        by_movie.setdefault(r['movie'], []).append(r)
    for movie, items in sorted(by_movie.items(), key=lambda x: x[1][0]['date'], reverse=True):
        print(f"【{movie}】({items[0]['date']}) — {len(items)} 张")
        for r in items:
            print(f"  {r['photo_time']} → {r['target']}")
