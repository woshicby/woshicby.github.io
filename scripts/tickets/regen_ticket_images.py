# -*- coding: utf-8 -*-
"""扫描 images/tickets/ 目录，按 日期_标题 子目录分组，生成 ticket-images.json 映射文件。

用法:
    python scripts/tickets/regen_ticket_images.py

用途:
    在 images/tickets/ 目录新增/删除图片后运行此脚本，重新生成 JSON/ticket-images.json。
    JS 端 (tickets.js) 运行时会自动读取该映射，根据 date+title 匹配对应图片。

目录结构 (2026-09-01 起):
    images/tickets/<日期8位_标题>/*.jpg    图片按场次分子目录存放
    顶层不再放平铺图片。

输出格式:
    {
      "20160708_大鱼海棠": ["images/tickets/20160708_大鱼海棠/20160708_大鱼海棠_1_开场前.jpg", ...],
      ...
    }
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

# 只取子目录（按 日期_标题 分组），跳过顶层散文件/隐藏文件
subdirs = [d for d in os.listdir(IMG_DIR)
           if os.path.isdir(os.path.join(IMG_DIR, d))
           and not d.startswith('.')]

groups = defaultdict(list)
unparsed = []

for sub in sorted(subdirs):
    sub_path = os.path.join(IMG_DIR, sub)
    files = [fn for fn in sorted(os.listdir(sub_path))
             if fn.lower().endswith(('.jpg', '.jpeg', '.png'))
             and not fn.startswith('.')]
    for fn in files:
        groups[sub].append(f'images/tickets/{sub}/{fn}')

mapping = {k: v for k, v in groups.items()}

# 输出保持与 JS 端读取一致 (UTF-8, 2 空格缩进)
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump(mapping, f, ensure_ascii=False, indent=2)

print(f'共 {len(mapping)} 个分组，{sum(len(v) for v in mapping.values())} 张图片')
print(f'已写入 {OUT}')
