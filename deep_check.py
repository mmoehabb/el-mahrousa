import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find literal strings between JSX tags
    matches = re.finditer(r'>([^<{]+)<', content)

    for match in matches:
        text = match.group(1).strip()
        if not text: continue
        if re.match(r'^&[a-zA-Z#0-9]+;$', text): continue
        if len(text) <= 1: continue
        # Ignore variables and expressions
        if '{' in text or '}' in text: continue
        print(f"{filepath}: {text}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
