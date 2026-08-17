# -*- coding: utf-8 -*-
import json

data = json.load(open('JSON/movie-views.json', encoding='utf-8'))

multi = [m for m in data if len(m['records']) > 1]
print('有多条记录的电影: %d部' % len(multi))
print()

for m in multi:
    title = m['title']
    n = len(m['records'])
    print('=== %s (%d条) ===' % (title, n))
    for i, r in enumerate(m['records']):
        has_content = r.get('cinema') or r.get('hall') or r.get('seat') or r.get('price') is not None or r.get('ticketImage')
        status = '有内容' if has_content else '空(仅时间)'
        print('  [%d] %s | %s | cinema=%s hall=%s seat=%s price=%s ticket=%s' % (
            i, r['date'], status,
            r.get('cinema',''), r.get('hall',''), r.get('seat',[]),
            r.get('price'), r.get('ticketImage','')
        ))
    print()
