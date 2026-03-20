import json
import os
import re

def get_all_t_calls():
    t_calls = set()
    for root, _, files in os.walk('src'):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                with open(os.path.join(root, file), 'r', encoding='utf-8') as f:
                    content = f.read()
                    # Find t('key') or t("key") or t(`key`)
                    matches = re.findall(r't\(\s*[\'"`]([^\'"`]+)[\'"`]', content)
                    t_calls.update(matches)
    return t_calls

def get_keys_from_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    def _get_keys(d, prefix=""):
        keys = set()
        for k, v in d.items():
            if isinstance(v, dict):
                keys.update(_get_keys(v, prefix + k + "."))
            else:
                keys.add(prefix + k)
        return keys
    return _get_keys(data)

en_keys = get_keys_from_json('src/locales/en.json')
ar_keys = get_keys_from_json('src/locales/ar.json')
t_calls = get_all_t_calls()

missing_in_en = t_calls - en_keys
missing_in_ar = t_calls - ar_keys

print(f"Missing in EN: {missing_in_en}")
print(f"Missing in AR: {missing_in_ar}")
