import json

with open(r'c:\工程文件\Git Repository\woshicby.github.io\JSON\tickets.json', 'r', encoding='utf-8') as f:
    tickets = json.load(f)

# Filter movie-type entries and print date|title for time matching
movies = [t for t in tickets if t.get('type') == 'movie']
for t in movies:
    print(f"{t['date']}|{t['title']}")
print(f"\nTotal movies: {len(movies)}")
