import json

def get_keys(d, prefix=""):
    keys = set()
    for k, v in d.items():
        if isinstance(v, dict):
            keys.update(get_keys(v, prefix + k + "."))
        else:
            keys.add(prefix + k)
    return keys

with open("src/locales/en.json") as f:
    en_data = json.load(f)

with open("src/locales/ar.json") as f:
    ar_data = json.load(f)

en_keys = get_keys(en_data)
ar_keys = get_keys(ar_data)

missing_in_ar = en_keys - ar_keys
missing_in_en = ar_keys - en_keys

if missing_in_ar:
    print(f"Keys missing in ar.json: {missing_in_ar}")
if missing_in_en:
    print(f"Keys missing in en.json: {missing_in_en}")

# Also let's find all t(...) calls in .tsx and .ts files
import os, re
t_calls = set()
for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith(('.ts', '.tsx')):
            with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                content = f.read()
                # Find t('key') or t("key") or t(`key`)
                matches = re.findall(r't\(\s*[\'"`]([^\'"`]+)[\'"`]\s*\)', content)
                t_calls.update(matches)

missing_in_locale = t_calls - en_keys
if missing_in_locale:
    print(f"\nKeys used in code but missing in en.json: {missing_in_locale}")
