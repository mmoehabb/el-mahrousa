import os
import re

def check_file(filepath):
    with open(filepath, 'r') as f:
        lines = f.readlines()

    for i, line in enumerate(lines):
        # Very simple regex to find hardcoded text between JSX tags
        # It looks for > text < where text contains some word characters and no curly braces
        matches = re.findall(r'>([^<>{]*[a-zA-Z]+[^<>{]*)<', line)
        for match in matches:
            text = match.strip()
            # Ignore some common valid cases like "X", "&times;", etc.
            if len(text) > 1 and not re.match(r'^&[a-zA-Z]+;$', text):
                print(f"{filepath}:{i+1}: {text}")

for root, _, files in os.walk('src/components'):
    for file in files:
        if file.endswith('.tsx'):
            check_file(os.path.join(root, file))
