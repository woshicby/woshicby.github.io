# -*- coding: utf-8 -*-
"""从 biligame wiki 刀账页面获取所有刀账图标，对比本地文件后下载更新。"""
import os, hashlib, requests, re
from pathlib import Path

ROOT = r'c:\工程文件\Git Repository\woshicby.github.io'
ICON_DIR = os.path.join(ROOT, 'images', 'touken', '刀账图标')
WIKI_URL = 'https://wiki.biligame.com/djlw/刀账'

def file_hash(path):
    h = hashlib.md5()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()

# 获取 wiki 页面
print(f'正在获取 {WIKI_URL} ...')
resp = requests.get(WIKI_URL, timeout=30)
resp.encoding = 'utf-8'
html = resp.text

# 提取所有刀账图标图片
# 格式: <img src="https://i0.hdslb.com/bfs/wikimedia/xxxxxx.jpg" alt="刀名">
img_pattern = re.compile(r'<img[^>]+src=["\'](https?://[^"\']+\.(?:jpg|jpeg|png))["\'][^>]*alt=["\']([^"\']+)["\']', re.I)
matches = img_pattern.findall(html)

# 过滤出刀账图标（150x150 或类似尺寸）
icon_urls = []
for url, alt in matches:
    if '150' in url or 'icon' in url.lower() or 'touken' in url.lower():
        icon_urls.append((url, alt.strip()))

print(f'页面共找到 {len(matches)} 张图片，其中刀账图标 {len(icon_urls)} 张')

# 获取本地已有的图标
local_icons = {}
for f in os.listdir(ICON_DIR):
    if f.lower().endswith(('.jpg', '.jpeg', '.png')):
        local_icons[f] = os.path.join(ICON_DIR, f)

print(f'本地已有 {len(local_icons)} 个图标')

# 下载更新
downloaded = 0
skipped = 0
for url, name in icon_urls:
    # 确定本地文件名
    ext = '.jpg' if 'jpg' in url.split('.')[-1] else '.png'
    local_name = f'{name}{ext}'
    local_path = os.path.join(ICON_DIR, local_name)

    # 如果本地已有同名文件，对比 hash
    if local_name in local_icons:
        try:
            remote_resp = requests.get(url, timeout=15)
            remote_hash = hashlib.md5(remote_resp.content).hexdigest()
            local_hash = file_hash(local_path)
            if remote_hash == local_hash:
                skipped += 1
                continue
        except Exception as e:
            print(f'  [WARN] 无法获取远程图片 {name}: {e}')
            continue

    # 下载
    try:
        resp = requests.get(url, timeout=15)
        resp.raise_for_status()
        with open(local_path, 'wb') as f:
            f.write(resp.content)
        downloaded += 1
        print(f'  [OK] {name}')
    except Exception as e:
        print(f'  [FAIL] {name}: {e}')

print(f'\n下载完成：新增/更新 {downloaded} 个，跳过 {skipped} 个')
