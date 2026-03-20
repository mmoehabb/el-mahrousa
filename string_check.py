import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Simple check for any string literals in JSX that might need translation
    # Also look for alt attributes or title attributes
    lines = content.split('\n')
    for i, line in enumerate(lines):
        # find title="..."
        title_matches = re.findall(r'title="([^"]+)"', line)
        for match in title_matches:
            if match and not match.startswith('{'):
                print(f"{filepath}:{i+1}: title=\"{match}\"")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
