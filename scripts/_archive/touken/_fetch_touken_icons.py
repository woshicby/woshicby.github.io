# -*- coding: utf-8 -*-
"""从保存的 wiki 页面 HTML 中提取刀剑编号和名称，下载原图并更新本地文件。"""
import os, hashlib, requests, re, time

ROOT = r'c:\工程文件\Git Repository\woshicby.github.io'
ICON_DIR = os.path.join(ROOT, 'images', 'touken', '刀账图标')
HTML_FILE = os.path.join(ROOT, 'bwiki刀账页.html')

def file_hash(path):
    h = hashlib.md5()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()

# 读取 HTML
print(f'正在读取 {HTML_FILE} ...')
with open(HTML_FILE, 'rb') as f:
    raw = f.read()
print(f'文件大小: {len(raw)} 字节')
html = raw.decode('utf-8')
print(f'HTML 大小: {len(html)} 字符')

# 提取所有 No.### 和对应刀名
pattern = re.compile(r'No\.(\d{3})\s*&#160;\s*<a[^>]*>([^<]+)</a>')
matches = pattern.findall(html)
print(f'找到 {len(matches)} 个刀剑条目')

# 从 img src 提取原图 URL
# 格式: src="https://patchwiki.biligame.com/images/djlw/thumb/9/9c/xxx.jpg/140px-003.jpg"
# 原图: https://patchwiki.biligame.com/images/djlw/thumb/9/9c/xxx.jpg
img_pattern = re.compile(r'<img[^>]+src=["\'](https://patchwiki\.biligame\.com/images/djlw/[^"\']+\.jpg)/\d+px-(\d{3})\.jpg["\']')
img_matches = img_pattern.findall(html)
print(f'找到 {len(img_matches)} 个图片 URL')

# 构建编号 -> (刀名, 原图URL) 映射
swords = {}
for num, name in matches:
    swords[num] = (name, None)
for base_url, num in img_matches:
    if num in swords:
        name, _ = swords[num]
        swords[num] = (name, base_url)

# 获取本地已有的图标
local_icons = {}
for fn in os.listdir(ICON_DIR):
    if fn.lower().endswith(('.jpg', '.jpeg', '.png')):
        local_icons[fn] = os.path.join(ICON_DIR, fn)
print(f'本地已有 {len(local_icons)} 个图标')

# 将刀名转换为本地文件名格式
def name_to_local(name):
    local = name.replace('·', '')
    return f'{local}.jpg'

# 下载更新
downloaded = 0
skipped = 0
failed = 0
missing_downloaded = 0

for num, (name, base_url) in sorted(swords.items(), key=lambda x: x[0]):
    local_name = name_to_local(name)
    local_path = os.path.join(ICON_DIR, local_name)

    # 优先使用 HTML 中的原图 URL，否则使用 wiki 页面 URL
    if base_url:
        wiki_url = base_url
    else:
        wiki_url = f'https://wiki.biligame.com/djlw/文件:{num}.jpg'

    is_new = local_name not in local_icons

    # 如果本地已有，对比 hash
    if not is_new:
        try:
            time.sleep(0.3)
            remote_resp = requests.get(wiki_url, timeout=60, headers={'User-Agent': 'Mozilla/5.0'})
            remote_resp.raise_for_status()
            remote_hash = hashlib.md5(remote_resp.content).hexdigest()
            local_hash = file_hash(local_path)
            if remote_hash == local_hash:
                skipped += 1
                continue
        except Exception as e:
            print(f'  [WARN] {local_name} (No.{num}) - 无法获取: {e}')
            failed += 1
            continue

    # 下载
    try:
        time.sleep(0.3)
        resp = requests.get(wiki_url, timeout=60, headers={'User-Agent': 'Mozilla/5.0'})
        resp.raise_for_status()
        with open(local_path, 'wb') as f:
            f.write(resp.content)
        if is_new:
            missing_downloaded += 1
            print(f'  [NEW] {local_name} (No.{num})')
        else:
            downloaded += 1
            print(f'  [UPD] {local_name} (No.{num})')
    except Exception as e:
        print(f'  [FAIL] {local_name} (No.{num}): {e}')
        failed += 1

print(f'\n完成：更新 {downloaded} 个，新增 {missing_downloaded} 个，跳过 {skipped} 个，失败 {failed} 个')

# 检查本地多余文件
wiki_local_names = {name_to_local(n) for n, _ in swords.values()}
for fn in local_icons:
    if fn not in wiki_local_names and fn != 'no_touken.jpg' and not fn.startswith('resize'):
        print(f'  [WARN] 本地文件 {fn} 在 wiki 中不存在')
