import os
import json

def process_file(filepath):
    print(f"Processing {filepath}...")
    with open(filepath, 'r', encoding='utf-8') as f:
        try:
            data = json.load(f)
        except json.JSONDecodeError as e:
            print(f"Error decoding {filepath}: {e}")
            return

    # Remove fields
    modified = False
    if 'pages' in data:
        del data['pages']
        modified = True
    if 'markdownPages' in data:
        del data['markdownPages']
        modified = True

    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Updated {filepath}")
    else:
        print(f"No changes for {filepath}")

def main():
    article_dir = r'd:\Antigravity\history-blog\data\articles'
    for filename in os.listdir(article_dir):
        if filename.endswith('.json'):
            process_file(os.path.join(article_dir, filename))

if __name__ == "__main__":
    main()
