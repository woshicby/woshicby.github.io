# -*- coding: utf-8 -*-
"""
将 Steam 评价从 review-movies.json 移到 review-games.json，
合并重复游戏（更新豆瓣条目的 Steam 信息）
"""
import json

MOVIES_FILE = r'c:\工程文件\Git Repository\woshicby.github.io\JSON\review-movies.json'
GAMES_FILE = r'c:\工程文件\Git Repository\woshicby.github.io\JSON\review-games.json'

def read_json_with_format(path):
    """读取JSON文件，返回(data, has_bom, use_crlf)"""
    with open(path, 'rb') as f:
        raw = f.read()
    has_bom = raw[:3] == b'\xef\xbb\xbf'
    content = raw.decode('utf-8-sig')
    use_crlf = '\r\n' in content
    data = json.loads(content)
    return data, has_bom, use_crlf

def write_json_with_format(path, data, has_bom, use_crlf):
    """写入JSON文件，保持格式"""
    output = json.dumps(data, ensure_ascii=False, indent=4)
    if use_crlf:
        output = output.replace('\n', '\r\n')
    with open(path, 'wb') as f:
        if has_bom:
            f.write(b'\xef\xbb\xbf')
        f.write(output.encode('utf-8'))

def normalize_title(title):
    """标准化游戏名称用于匹配"""
    import re
    t = title.lower()
    # 去除特殊字符和空格
    t = re.sub(r'[™®©:\-—_.,!?\'\s]', '', t)
    return t

def is_same_game(title1, title2):
    """判断两个游戏名称是否指向同一个游戏"""
    n1 = normalize_title(title1)
    n2 = normalize_title(title2)
    if n1 == n2:
        return True
    # 一个名称包含另一个（处理中英文名称差异）
    if len(n1) > 5 and len(n2) > 5:
        if n1 in n2 or n2 in n1:
            return True
    # 关键词匹配
    keywords = ['detroit', 'nier', '尼爾', '尼尔', '底特律', 'cyberpunk', '赛博朋克',
                'dysongame', 'dysonsphere', '戴森球', '隐形守护者', 'invisibleguardian']
    for kw in keywords:
        if kw in n1 and kw in n2:
            return True
    return False

# ===== 1. 读取数据 =====
print("===== 读取数据 =====")
movies_data, movies_bom, movies_crlf = read_json_with_format(MOVIES_FILE)
games_data, games_bom, games_crlf = read_json_with_format(GAMES_FILE)

# ===== 2. 从 review-movies.json 移除游戏评价 =====
print("\n===== 从 review-movies.json 移除游戏评价 =====")
original_count = len(movies_data['watched'])
movies_data['watched'] = [m for m in movies_data['watched'] if m.get('category') != 'game']
removed_count = original_count - len(movies_data['watched'])
print(f"  移除了 {removed_count} 条游戏评价")
print(f"  review-movies.json watched 剩余: {len(movies_data['watched'])} 条")

# ===== 3. 获取 Steam 评价（从 _steam_reviews.json） =====
with open(r'c:\工程文件\Git Repository\woshicby.github.io\_steam_reviews.json', encoding='utf-8') as f:
    steam_reviews = json.load(f)
print(f"\n  Steam 评价: {len(steam_reviews)} 条")

# ===== 4. 合并到 review-games.json =====
print("\n===== 合并到 review-games.json =====")
existing_played = games_data.get('played', [])
print(f"  现有 played 条目: {len(existing_played)} 条")

# 找出重复游戏
merged_count = 0
added_count = 0
matched_indices = set()  # 已匹配的现有条目索引

for steam_review in steam_reviews:
    steam_title = steam_review['title']

    # 在现有条目中查找匹配
    match_idx = None
    for i, existing in enumerate(existing_played):
        if i in matched_indices:
            continue
        if is_same_game(steam_title, existing['title']):
            match_idx = i
            break

    if match_idx is not None:
        # 合并：更新现有条目的 Steam 信息
        existing = existing_played[match_idx]
        matched_indices.add(match_idx)

        # 保留豆瓣信息，添加 Steam 信息
        existing['myRating'] = steam_review['myRating']
        existing['review'] = steam_review['review']
        existing['link'] = steam_review['link']  # 更新为 Steam 链接
        existing['createdAt'] = steam_review['createdAt']
        existing['appId'] = steam_review['appId']
        existing['hours'] = steam_review.get('hours')
        existing['reviewHours'] = steam_review.get('reviewHours')
        existing['earlyAccess'] = steam_review.get('earlyAccess', False)
        existing['platform'] = 'Steam'

        merged_count += 1
        print(f"  [合并] {steam_title} <- {existing['title']}")
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
        existing_played.append(new_entry)
        added_count += 1

games_data['played'] = existing_played
print(f"\n  合并: {merged_count} 条, 新增: {added_count} 条")
print(f"  played 总数: {len(existing_played)} 条")

# ===== 5. 保存文件 =====
print("\n===== 保存文件 =====")
write_json_with_format(MOVIES_FILE, movies_data, movies_bom, movies_crlf)
print(f"  review-movies.json 已保存 (BOM={movies_bom}, CRLF={movies_crlf})")

write_json_with_format(GAMES_FILE, games_data, games_bom, games_crlf)
print(f"  review-games.json 已保存 (BOM={games_bom}, CRLF={games_crlf})")

# ===== 6. 验证 =====
print("\n===== 验证 =====")
games_data2, _, _ = read_json_with_format(GAMES_FILE)
played = games_data2.get('played', [])
print(f"review-games.json played 条目: {len(played)}")
has_rating = sum(1 for g in played if g.get('myRating') is not None)
has_review = sum(1 for g in played if g.get('review'))
has_steam_link = sum(1 for g in played if 'store.steampowered.com' in g.get('link', ''))
print(f"  有评分: {has_rating}, 有评论: {has_review}, Steam链接: {has_steam_link}")

movies_data2, _, _ = read_json_with_format(MOVIES_FILE)
games_in_movies = sum(1 for m in movies_data2['watched'] if m.get('category') == 'game')
print(f"review-movies.json 中残留游戏评价: {games_in_movies}")
