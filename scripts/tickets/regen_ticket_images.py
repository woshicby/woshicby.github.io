# -*- coding: utf-8 -*-
"""扫描 images/tickets/ 目录，按 日期_标题 分组，生成 ticket-images.json 映射文件。

用法:
    python scripts/tickets/regen_ticket_images.py

用途:
    在 images/tickets/ 目录新增/删除图片后运行此脚本，重新生成 JSON/ticket-images.json。
    JS 端 (tickets.js) 运行时会自动读取该映射，根据 date+title 匹配对应图片。
"""
import json, os, re, sys
from collections import defaultdict

# 从脚本位置向上找项目根目录（在 scripts/tickets/ 下执行时）
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(SCRIPT_DIR))

IMG_DIR = os.path.join(ROOT, 'images', 'tickets')
OUT = os.path.join(ROOT, 'JSON', 'ticket-images.json')

if not os.path.isdir(IMG_DIR):
    print(f'[ERROR] 图片目录不存在: {IMG_DIR}')
    sys.exit(1)

files = [f for f in os.listdir(IMG_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png'))]
groups = defaultdict(list)
unparsed = []

for fn in files:
    m = re.match(r'^(\d{8})_(.+?)_(\d+)_(.+)$', fn)
    if m:
        date8, title, seq, stage = m.groups()
        groups[f'{date8}_{title}'].append(f'images/tickets/{fn}')
    else:
        unparsed.append(fn)

if unparsed:
    print(f'[WARN] 以下 {len(unparsed)} 个文件无法解析，已跳过:')
    for fn in unparsed:
        print(f'  {fn}')

# 按序号排序
mapping = {}
for key, fn_list in groups.items():
    def sort_key(fn):
        m = re.search(r'_(\d+)_', fn)
        return int(m.group(1)) if m else 0
    mapping[key] = sorted(fn_list, key=sort_key)

with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(mapping, f, ensure_ascii=False, indent=2)

print(f'共 {len(mapping)} 个分组，{sum(len(v) for v in mapping.values())} 张图片')
print(f'已写入 {OUT}')
