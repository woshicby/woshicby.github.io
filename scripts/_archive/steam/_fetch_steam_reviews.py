# -*- coding: utf-8 -*-
"""采集Steam游戏评价信息 - 修正评论解析"""
import json
import re
import urllib.request
import time
import os

STEAM_ID = 'woshicby'
TOTAL_PAGES = 8
OUTPUT_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '_steam_reviews.json')

def fetch_url(url, timeout=30):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Cookie': 'Steam_Language=schinese'
    })
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read().decode('utf-8', errors='replace')

def parse_review_page(html):
    reviews = []
    pattern = r'steamcommunity\.com/app/(\d+)["\']'
    app_ids_with_pos = [(m.group(1), m.start()) for m in re.finditer(pattern, html)]

    seen = set()
    unique_entries = []
    for app_id, pos in app_ids_with_pos:
        if app_id not in seen:
            seen.add(app_id)
            unique_entries.append((app_id, pos))

    for i, (app_id, start_pos) in enumerate(unique_entries):
        end_pos = unique_entries[i+1][1] if i+1 < len(unique_entries) else len(html)
        block = html[start_pos:end_pos]

        # 好评/差评
        recommended = None
        if 'icon_thumbsUp' in block:
            recommended = True
        elif 'icon_thumbsDown' in block:
            recommended = False

        # 时长
        hours_match = re.search(r'总时数\s+([\d,]+\.?\d*)\s*小时', block)
        hours = float(hours_match.group(1).replace(',', '')) if hours_match else None

        # 评测时时长
        review_hours_match = re.search(r'评测时\s+([\d,]+\.?\d*)\s*小时', block)
        review_hours = float(review_hours_match.group(1).replace(',', '')) if review_hours_match else None

        # 抢先体验
        is_early_access = '抢先体验版本评测' in block

        # 日期
        date_match = re.search(r'发布于\s+(.+?)(?:。|\s*最后编辑)', block)
        date_str = date_match.group(1).strip() if date_match else ''

        # 提取评论文本
        # 找到所有时长相关文本的结束位置，然后从那之后到"发布于"之间提取评论
        review_text = ''

        # 找到 "总时数...小时" 的结束位置
        if hours_match:
            text_start = hours_match.end()
            # 跳过 "（评测时 X 小时）" 部分
            if review_hours_match:
                text_start = max(text_start, review_hours_match.end())

            # 找 "发布于" 的位置
            pub_start = block.find('发布于', text_start)

            if pub_start > text_start:
                review_text = block[text_start:pub_start].strip()
                # 清理HTML标签
                review_text = re.sub(r'<[^>]+>', '\n', review_text)
                # 清理 HTML 实体
                review_text = review_text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&#39;', "'")
                # 清理括号及多余空白
                review_text = re.sub(r'^[（(]\s*[）)]\s*', '', review_text)  # 去除开头的空括号
                review_text = re.sub(r'\n{3,}', '\n\n', review_text)
                review_text = review_text.strip()
                # 去除开头的 "抢先体验版本评测" 文本
                review_text = re.sub(r'^抢先体验版本评测\s*', '', review_text)
        else:
            # 没有时长信息的情况
            pub_start = block.find('发布于')
            if pub_start > 0:
                # 从 "总时数" 或其他标记之后开始
                review_text = block[:pub_start].strip()
                review_text = re.sub(r'<[^>]+>', '\n', review_text)
                review_text = review_text.replace('&amp;', '&').replace('&lt;', '<').replace('&gt;', '>').replace('&quot;', '"').replace('&#39;', "'")
                review_text = re.sub(r'\n{3,}', '\n\n', review_text)
                review_text = review_text.strip()

        reviews.append({
            'appId': app_id,
            'title': '',
            'recommended': recommended,
            'myRating': 8 if recommended else (2 if recommended is False else None),
            'hours': hours,
            'reviewHours': review_hours,
            'earlyAccess': is_early_access,
            'date': date_str,
            'review': review_text,
            'link': f'https://store.steampowered.com/app/{app_id}/',
        })

    return reviews

def get_game_name(app_id):
    url = f'https://store.steampowered.com/api/appdetails?appids={app_id}&l=schinese&filters=basic'
    try:
        req = urllib.request.Request(url, headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode('utf-8'))
        if data.get(str(app_id), {}).get('success'):
            return data[str(app_id)]['data'].get('name', '')
    except:
        pass
    return ''

def parse_date(date_str):
    if not date_str:
        return ''
    m = re.match(r'(?:(\d{4})\s*年\s*)?(\d{1,2})\s*月\s*(\d{1,2})\s*日', date_str)
    if m:
        year = int(m.group(1)) if m.group(1) else 2026
        return f"{year:04d}-{int(m.group(2)):02d}-{int(m.group(3)):02d}"
    return date_str

# 主程序
print("开始采集Steam评价...")
all_reviews = []
app_id_set = set()

for page in range(1, TOTAL_PAGES + 1):
    url = f'https://steamcommunity.com/id/{STEAM_ID}/recommended/?p={page}'
    print(f"获取第 {page}/{TOTAL_PAGES} 页...", end=' ')
    try:
        html = fetch_url(url)
        reviews = parse_review_page(html)
        new_count = 0
        for r in reviews:
            if r['appId'] not in app_id_set:
                app_id_set.add(r['appId'])
                all_reviews.append(r)
                new_count += 1
        print(f"{len(reviews)} 条（新增 {new_count}）")
    except Exception as e:
        print(f"失败: {e}")

print(f"\n共 {len(all_reviews)} 条评测")

# 获取游戏名称（使用缓存避免重复请求）
print(f"\n获取游戏名称...")
for i, review in enumerate(all_reviews):
    if review['appId'] and not review['title']:
        name = get_game_name(review['appId'])
        if not name and review['appId'] == '496920':
            name = '赛菲莉娅'  # API获取失败，手动补充
        review['title'] = name
        print(f"  [{i+1}/{len(all_reviews)}] {review['appId']}: {name or '(失败)'}")
        time.sleep(0.3)

# 转换日期和添加字段
for review in all_reviews:
    review['date'] = parse_date(review['date'])
    review['createdAt'] = review['date'] + ' 00:00:00' if review['date'] else ''
    review['category'] = 'game'
    review['status'] = 'played'

# 保存
with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
    json.dump(all_reviews, f, ensure_ascii=False, indent=2)

print(f"\n保存到: {OUTPUT_FILE}")
print(f"总计: {len(all_reviews)} 条 | 好评: {sum(1 for r in all_reviews if r['recommended'])} | 差评: {sum(1 for r in all_reviews if r['recommended'] is False)}")
print(f"无名称: {sum(1 for r in all_reviews if not r['title'])} | 无评论: {sum(1 for r in all_reviews if not r['review'])}")

# 验证评论质量
print("\n--- 评论质量检查 ---")
for r in all_reviews[:3]:
    print(f"\n{r['title']} (rating={r['myRating']}, hours={r['hours']}, date={r['date']}):")
    print(f"  review: {r['review'][:100]}...")
