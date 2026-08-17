# -*- coding: utf-8 -*-
"""修复 Montaro 重复问题：将原 app 496920 的 appId 改回，但 title/link 指向 Montaro"""
import json

STEAM_FILE = r'c:\工程文件\Git Repository\woshicby.github.io\_steam_reviews.json'
REVIEWS_FILE = r'c:\工程文件\Git Repository\woshicby.github.io\JSON\review-movies.json'

# ===== 1. 修复 _steam_reviews.json =====
with open(STEAM_FILE, encoding='utf-8') as f:
    steam_data = json.load(f)

fixed = 0
for r in steam_data:
    # 找到 hours=0.1 的 Montaro（原 app 496920），改回 appId
    if r['title'] == 'Montaro' and r.get('hours') == 0.1 and r.get('appId') == '495890':
        r['appId'] = '496920'
        fixed += 1
        print(f"_steam_reviews.json: Montaro (hours=0.1) appId 改回 496920")

with open(STEAM_FILE, 'w', encoding='utf-8') as f:
    json.dump(steam_data, f, ensure_ascii=False, indent=2)

# ===== 2. 修复 review-movies.json =====
with open(REVIEWS_FILE, 'rb') as f:
    raw = f.read()
has_bom = raw[:3] == b'\xef\xbb\xbf'
content = raw.decode('utf-8-sig')
use_crlf = '\r\n' in content

data = json.loads(content)

fixed2 = 0
for item in data['watched']:
    if (item.get('category') == 'game' and item.get('title') == 'Montaro'
            and item.get('hours') == 0.1 and item.get('appId') == '495890'):
        item['appId'] = '496920'
        fixed2 += 1
        print(f"review-movies.json: Montaro (hours=0.1) appId 改回 496920")

# 写回
output = json.dumps(data, ensure_ascii=False, indent=4)
if use_crlf:
    output = output.replace('\n', '\r\n')
with open(REVIEWS_FILE, 'wb') as f:
    if has_bom:
        f.write(b'\xef\xbb\xbf')
    f.write(output.encode('utf-8'))

print(f"\n修复完成: _steam_reviews.json 修复 {fixed} 条, review-movies.json 修复 {fixed2} 条")

# 验证
with open(REVIEWS_FILE, encoding='utf-8-sig') as f:
    data = json.load(f)
montaros = [g for g in data['watched'] if g.get('title') == 'Montaro']
print(f"\nreview-movies.json 中 Montaro 条目: {len(montaros)}")
for m in montaros:
    print(f"  appId={m['appId']}, hours={m['hours']}, link={m['link']}")
