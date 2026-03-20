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

print(f"Missing in ar.json: {len(missing_in_ar)}")
for k in sorted(missing_in_ar):
    print("  ", k)

print(f"Missing in en.json: {len(missing_in_en)}")
for k in sorted(missing_in_en):
    print("  ", k)
