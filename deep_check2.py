import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find text that isn't wrapped in translation calls and might be user-visible
    # Look for placeholders
    placeholders = re.findall(r'placeholder="([^"{]+)"', content)
    for p in placeholders:
        print(f"PLACEHOLDER {filepath}: {p}")

    # Look for alts
    alts = re.findall(r'alt="([^"{]+)"', content)
    for a in alts:
        print(f"ALT {filepath}: {a}")

    # Look for titles
    titles = re.findall(r'title="([^"{]+)"', content)
    for t in titles:
        print(f"TITLE {filepath}: {t}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
