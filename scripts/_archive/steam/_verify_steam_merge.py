# -*- coding: utf-8 -*-
"""验证 Steam 评价数据修正和合并结果"""
import json

# 1. 验证 _steam_reviews.json
print("===== _steam_reviews.json 验证 =====")
with open(r'c:\工程文件\Git Repository\woshicby.github.io\_steam_reviews.json', encoding='utf-8') as f:
    steam_data = json.load(f)

# 检查 Montaro
montaro_entries = [r for r in steam_data if r['title'] == 'Montaro']
print(f"Montaro 条目数: {len(montaro_entries)}")
for m in montaro_entries:
    print(f"  appId={m['appId']}, link={m['link']}, date={m['date']}, hours={m['hours']}, rating={m['myRating']}")

# 检查所有 link 是否为 Steam 链接
non_steam_links = [r for r in steam_data if not r['link'].startswith('https://store.steampowered.com/')]
print(f"非 Steam 链接数: {len(non_steam_links)}")

# 检查 platform 字段
no_platform = [r for r in steam_data if not r.get('platform')]
print(f"无 platform 字段数: {len(no_platform)}")

# 2. 验证 review-movies.json
print("\n===== review-movies.json 验证 =====")
with open(r'c:\工程文件\Git Repository\woshicby.github.io\JSON\review-movies.json', encoding='utf-8-sig') as f:
    review_data = json.load(f)

games = [m for m in review_data['watched'] if m.get('category') == 'game']
print(f"游戏评价总数: {len(games)}")
print(f"watched 总数: {len(review_data['watched'])}")

# 检查游戏评价的字段
if games:
    sample = games[0]
    print(f"\n示例游戏评价: {sample['title']}")
    print(f"  字段: {list(sample.keys())}")
    print(f"  myRating: {sample.get('myRating')}")
    print(f"  hours: {sample.get('hours')}")
    print(f"  earlyAccess: {sample.get('earlyAccess')}")
    print(f"  platform: {sample.get('platform')}")
    print(f"  appId: {sample.get('appId')}")
    print(f"  link: {sample.get('link')}")
    print(f"  review: {str(sample.get('review', ''))[:60]}...")

# 检查 Montaro 在 review-movies.json 中
montaro_in_reviews = [g for g in games if g['title'] == 'Montaro']
print(f"\nreview-movies.json 中 Montaro 条目数: {len(montaro_in_reviews)}")
for m in montaro_in_reviews:
    print(f"  appId={m.get('appId')}, link={m.get('link')}, date={m.get('createdAt')}, hours={m.get('hours')}")

# 检查有抢先体验标记的游戏
early_access_games = [g for g in games if g.get('earlyAccess')]
print(f"\n抢先体验游戏数: {len(early_access_games)}")
for g in early_access_games:
    print(f"  {g['title']}")

# 统计好评/差评
good = sum(1 for g in games if g.get('myRating') == 8)
bad = sum(1 for g in games if g.get('myRating') == 2)
print(f"\n好评(8分): {good}, 差评(2分): {bad}")
