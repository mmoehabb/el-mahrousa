import os
import re

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find literal strings between JSX tags (e.g., >Some text<)
    # We want to exclude empty strings, just whitespace, or variables/JSX
    # e.g., >Hello< matches, >{var}< doesn't
    # Pattern explanation:
    # >         - literal >
    # ([^<]+)   - capture anything that's not <
    # <         - literal <

    matches = re.finditer(r'>([^<{]+)<', content)

    for match in matches:
        text = match.group(1).strip()
        # ignore empty or purely whitespace
        if not text:
            continue

        # ignore html entities like &nbsp; or &times; or single chars usually (unless it's words)
        if re.match(r'^&[a-zA-Z#0-9]+;$', text):
            continue

        if len(text) <= 1:
            continue

        print(f"{filepath}: {text}")

for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.tsx'):
            process_file(os.path.join(root, file))
