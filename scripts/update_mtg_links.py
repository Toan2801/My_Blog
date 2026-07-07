import json
import os
import re
import sys

sys.stdout.reconfigure(encoding='utf-8')

SERIES_FILE = 'data/series/minhthonggiam.json'
ARTICLES_DIR = 'data/articles'

with open(SERIES_FILE, 'r', encoding='utf-8') as f:
    series = json.load(f)

content = series.get('content', '')

def get_slug(text):
    m = re.match(r'^Quyển (\d+):', text)
    if m:
        return f"minhthonggiam-chinhbien{int(m.group(1)):03d}"
    return None

def replacer(match):
    full_span = match.group(0)
    text = match.group(1)
    
    slug = get_slug(text)
    if slug:
        article_path = os.path.join(ARTICLES_DIR, f"{slug}.json")
        if os.path.exists(article_path):
            print(f"Found new article: {slug} - converting to link!")
            return f'<a href="/articles/{slug}">{text}</a>'
            
    return full_span

new_content = re.sub(r'<span[^>]*>(.*?)</span>', replacer, content)

if new_content != content:
    series['content'] = new_content
    with open(SERIES_FILE, 'w', encoding='utf-8') as f:
        json.dump(series, f, ensure_ascii=False, indent=2)
    print("Series TOC updated with new links!")
else:
    print("No new articles to link found.")
