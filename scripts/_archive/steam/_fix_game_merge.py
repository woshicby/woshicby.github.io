# -*- coding: utf-8 -*-
"""
修正版：将 Steam 评价合并到 review-games.json
只在原始豆瓣游戏（前6条）中查找匹配，不在新添加的 Steam 评价之间合并
"""
import json
import re

MOVIES_FILE = r'c:\工程文件\Git Repository\woshicby.github.io\JSON\review-movies.json'
GAMES_FILE = r'c:\工程文件\Git Repository\woshicby.github.io\JSON\review-games.json'
STEAM_FILE = r'c:\工程文件\Git Repository\woshicby.github.io\_steam_reviews.json'

def read_json_with_format(path):
    with open(path, 'rb') as f:
        raw = f.read()
    has_bom = raw[:3] == b'\xef\xbb\xbf'
    content = raw.decode('utf-8-sig')
    use_crlf = '\r\n' in content
    return json.loads(content), has_bom, use_crlf

def write_json_with_format(path, data, has_bom, use_crlf):
    output = json.dumps(data, ensure_ascii=False, indent=4)
    if use_crlf:
        output = output.replace('\n', '\r\n')
    with open(path, 'wb') as f:
        if has_bom:
            f.write(b'\xef\xbb\xbf')
        f.write(output.encode('utf-8'))

def is_same_game(steam_title, douban_title):
    """判断 Steam 游戏名称与豆瓣游戏名称是否指向同一个游戏"""
    # 标准化：转小写，去除特殊字符
    def normalize(t):
        t = t.lower()
        t = re.sub(r'[™®©:\-—_.,!?\'\s（）()]', '', t)
        return t

    s = normalize(steam_title)
    d = normalize(douban_title)

    # 精确匹配
    if s == d:
        return True

    # 关键词匹配（只用于已知的重复游戏）
    pairs = [
        ('detroit', '底特律'),
        ('nierreplicant', '尼尔人工生命'),
        ('nierautomata', '尼尔机械纪元'),
    ]
    for kw1, kw2 in pairs:
        if (kw1 in s or kw2 in s) and (kw1 in d or kw2 in d):
            # 进一步检查：确保不是 Replicant 和 Automata 混淆
            if 'replicant' in s and 'automata' in d:
                return False
            if 'automata' in s and 'replicant' in d:
                return False
            return True

    return False

# ===== 1. 读取数据 =====
print("===== 读取数据 =====")
games_data, games_bom, games_crlf = read_json_with_format(GAMES_FILE)

# 读取 Steam 评价
with open(STEAM_FILE, encoding='utf-8') as f:
    steam_reviews = json.load(f)
print(f"  Steam 评价: {len(steam_reviews)} 条")

# ===== 2. 重置 played 数组（保留原始6条豆瓣游戏） =====
# 从当前 played 中筛选出原始的豆瓣游戏（没有 appId 字段的）
original_douban_games = [g for g in games_data.get('played', []) if not g.get('appId')]
print(f"  原始豆瓣游戏: {len(original_douban_games)} 条")
for g in original_douban_games:
    print(f"    - {g['title']}")

# 清除之前错误添加的 Steam 评价（有 appId 字段的）
# 保留豆瓣游戏的原始信息

# ===== 3. 合并 Steam 评价 =====
print("\n===== 合并 Steam 评价 =====")
played = list(original_douban_games)  # 从原始豆瓣游戏开始
matched_douban_indices = set()

merged_count = 0
added_count = 0

for steam_review in steam_reviews:
    steam_title = steam_review['title']

    # 只在原始豆瓣游戏中查找匹配（不匹配之前添加的 Steam 评价）
    match_idx = None
    for i, douban_game in enumerate(original_douban_games):
        if i in matched_douban_indices:
            continue
        if is_same_game(steam_title, douban_game['title']):
            match_idx = i
            break

    if match_idx is not None:
        # 合并：更新豆瓣条目的 Steam 信息
        douban_game = original_douban_games[match_idx]
        matched_douban_indices.add(match_idx)

        # 在 played 中找到对应的条目并更新
        for g in played:
            if g is douban_game:
                g['myRating'] = steam_review['myRating']
                g['review'] = steam_review['review']
                g['link'] = steam_review['link']  # 更新为 Steam 链接
                g['createdAt'] = steam_review['createdAt']
                g['appId'] = steam_review['appId']
                g['hours'] = steam_review.get('hours')
                g['reviewHours'] = steam_review.get('reviewHours')
                g['earlyAccess'] = steam_review.get('earlyAccess', False)
                g['platform'] = 'Steam'
                break

        merged_count += 1
        print(f"  [合并] {steam_title} <- {douban_game['title']}")
    else:
        # 添加为新条目
        new_entry = {
            'title': steam_title,
            'doubanRating': None,
            'myRating': steam_review['myRating'],
            'review': steam_review['review'],
            'tags': [],
            'link': steam_review['link'],
            'createdAt': steam_review['createdAt'],
            'category': 'game',
            'status': 'played',
            'appId': steam_review['appId'],
            'hours': steam_review.get('hours'),
            'reviewHours': steam_review.get('reviewHours'),
            'earlyAccess': steam_review.get('earlyAccess', False),
            'platform': 'Steam',
        }
        played.append(new_entry)
        added_count += 1

games_data['played'] = played
print(f"\n  合并: {merged_count} 条, 新增: {added_count} 条")
print(f"  played 总数: {len(played)} 条")

# ===== 4. 保存 =====
print("\n===== 保存 =====")
write_json_with_format(GAMES_FILE, games_data, games_bom, games_crlf)
print(f"  review-games.json 已保存 (BOM={games_bom}, CRLF={games_crlf})")

# ===== 5. 验证 =====
print("\n===== 验证 =====")
games_data2, _, _ = read_json_with_format(GAMES_FILE)
played2 = games_data2.get('played', [])
print(f"played 总数: {len(played2)}")

# 检查是否有重复
from collections import Counter
app_ids = [g.get('appId') for g in played2 if g.get('appId')]
duplicates = {k: v for k, v in Counter(app_ids).items() if v > 1}
if duplicates:
    print(f"  重复 appId: {duplicates}")
else:
    print(f"  无重复 appId")

# 检查 Montaro
montaros = [g for g in played2 if g.get('title') == 'Montaro']
print(f"  Montaro 条目: {len(montaros)}")
for m in montaros:
    print(f"    appId={m.get('appId')}, hours={m.get('hours')}, link={m.get('link')}")

# 检查黑神话
bsw = [g for g in played2 if '黑神话' in g.get('title', '')]
print(f"  黑神话条目: {len(bsw)}")
for g in bsw:
    print(f"    title={g['title']}, appId={g.get('appId')}")

# 检查情感反诈
qg = [g for g in played2 if '情感反诈' in g.get('title', '')]
print(f"  情感反诈条目: {len(qg)}")
for g in qg:
    print(f"    title={g['title']}, appId={g.get('appId')}")

has_rating = sum(1 for g in played2 if g.get('myRating') is not None)
has_review = sum(1 for g in played2 if g.get('review'))
has_steam_link = sum(1 for g in played2 if 'store.steampowered.com' in g.get('link', ''))
print(f"\n  有评分: {has_rating}, 有评论: {has_review}, Steam链接: {has_steam_link}")
