# -*- coding: utf-8 -*-
"""合并 2023-10-03 前任4 的两条记录为一条（同一场次，分开下单）。"""
import json

PATH = r'c:\工程文件\Git Repository\woshicby.github.io\JSON\tickets.json'

with open(PATH, 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

# 找到 2023-10-03 的两条记录
idxs = []
for i, t in enumerate(data):
    if '20231003' in (t.get('date') or '').replace('-', '') and t.get('title') == '前任4：英年早婚':
        idxs.append(i)

if len(idxs) != 2:
    print(f'未找到预期记录，找到 {len(idxs)} 条')
else:
    a, b = data[idxs[0]], data[idxs[1]]
    merged = {
        'type': 'movie',
        'title': '前任4：英年早婚',
        'date': '2023-10-03 20:00:00',
        'location': '莆田金逸国际影城正荣店',
        'hall': '3号巨幕厅',
        'seat': ['7排11座', '7排12座', '7排13座'],
        'price': 123,
        'platform': '猫眼',
        'note': '',
        'refId': '35358443'
    }

    # 删除两条旧记录（从大到小索引避免偏移）
    for idx in sorted(idxs, reverse=True):
        data.pop(idx)
    # 在原位置插入合并后的记录
    data.insert(idxs[0], merged)

    with open(PATH, 'w', encoding='utf-8-sig') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f'已合并索引 {idxs} 为一条记录，剩余 {len(data)} 条')
