# -*- coding: utf-8 -*-
"""
修正 _steam_reviews.json 中 app 496920 的信息，
并将所有 Steam 评价合并到 review-movies.json
"""
import json
import re

STEAM_FILE = r'c:\工程文件\Git Repository\woshicby.github.io\_steam_reviews.json'
REVIEWS_FILE = r'c:\工程文件\Git Repository\woshicby.github.io\JSON\review-movies.json'

# ===== 1. 修正 _steam_reviews.json =====
print("===== 修正 _steam_reviews.json =====")

with open(STEAM_FILE, encoding='utf-8') as f:
    steam_reviews = json.load(f)

for review in steam_reviews:
    # 修正 app 496920 为 Montaro
    if review['appId'] == '496920':
        review['title'] = 'Montaro'
        review['link'] = 'https://store.steampowered.com/app/495890/Montaro/'
        review['appId'] = '495890'  # 更正为正确的 appId
        print(f"  修正 app 496920 -> Montaro (appId=495890)")

    # 确保 link 是完整的 Steam 链接
    if not review.get('link', '').startswith('https://store.steampowered.com/'):
        review['link'] = f"https://store.steampowered.com/app/{review['appId']}/"

    # 添加 platform 字段
    review['platform'] = 'Steam'

# 保存修正后的 _steam_reviews.json
with open(STEAM_FILE, 'w', encoding='utf-8') as f:
    json.dump(steam_reviews, f, ensure_ascii=False, indent=2)
print(f"  已保存 {len(steam_reviews)} 条评价到 _steam_reviews.json")

# ===== 2. 合并到 review-movies.json =====
print("\n===== 合并到 review-movies.json =====")

# 读取原始文件格式
with open(REVIEWS_FILE, 'rb') as f:
    raw = f.read()
has_bom = raw[:3] == b'\xef\xbb\xbf'
content = raw.decode('utf-8-sig')
use_crlf = '\r\n' in content

data = json.loads(content)

# 检查已有的游戏评价（按 appId 去重）
existing_game_app_ids = set()
for item in data['watched']:
    if item.get('category') == 'game' and item.get('appId'):
        existing_game_app_ids.add(item['appId'])

print(f"  已有游戏评价: {len(existing_game_app_ids)} 条")

# 准备要添加的游戏评价
new_games = []
for review in steam_reviews:
    # 跳过已存在的
    if review['appId'] in existing_game_app_ids:
        print(f"  跳过已存在的: {review['title']} (appId={review['appId']})")
        continue

    game_entry = {
        'title': review['title'],
        'myRating': review['myRating'],
        'review': review['review'],
        'tags': [],
        'link': review['link'],
        'createdAt': review['createdAt'],
        'category': 'game',
        'status': 'played',
        'appId': review['appId'],
        'hours': review.get('hours'),
        'reviewHours': review.get('reviewHours'),
        'earlyAccess': review.get('earlyAccess', False),
        'platform': 'Steam',
    }
    new_games.append(game_entry)

print(f"  新增游戏评价: {len(new_games)} 条")

# 添加到 watched 数组
data['watched'].extend(new_games)

# 写回文件，保持格式
output = json.dumps(data, ensure_ascii=False, indent=4)
if use_crlf:
    output = output.replace('\n', '\r\n')

with open(REVIEWS_FILE, 'wb') as f:
    if has_bom:
        f.write(b'\xef\xbb\xbf')
    f.write(output.encode('utf-8'))

print(f"  已写入 review-movies.json (BOM={has_bom}, 换行={'CRLF' if use_crlf else 'LF'})")
print(f"  watched 总数: {len(data['watched'])}")
print(f"  其中游戏评价: {sum(1 for m in data['watched'] if m.get('category') == 'game')} 条")
