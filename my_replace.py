import os
import re

def replace_in_file(filepath, replacements):
    with open(filepath, 'r') as f:
        content = f.read()

    for old, new in replacements:
        content = content.replace(old, new)

    with open(filepath, 'w') as f:
        f.write(content)

components = os.listdir('src/components')
for c in components:
    filepath = os.path.join('src/components', c)
    if os.path.isfile(filepath) and filepath.endswith('.tsx'):
        print(f"Checking {filepath}")
