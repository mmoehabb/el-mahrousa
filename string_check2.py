import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # check for things like <div>Hardcoded</div>
    matches = re.finditer(r'>\s*([a-zA-Z0-9_ -]+)\s*<', content)
    for m in matches:
        text = m.group(1).strip()
        if text and len(text) > 2 and not text.isdigit() and not '{' in text:
            print(f"HARDCODED {filepath}: {text}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
