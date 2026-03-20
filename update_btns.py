import json

def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en = load_json('src/locales/en.json')
ar = load_json('src/locales/ar.json')

en['confirmBtn'] = "Confirm"
en['cancelBtn'] = "Cancel"
en['okBtn'] = "OK"

ar['confirmBtn'] = "تأكيد"
ar['cancelBtn'] = "إلغاء"
ar['okBtn'] = "حسناً"

save_json('src/locales/en.json', en)
save_json('src/locales/ar.json', ar)

# Fix common.settings.audio
en.setdefault('common', {}).setdefault('settings', {})
en['common']['settings']['audio'] = "Audio"
en['common']['settings']['soundEffects'] = "Sound Effects"
en['common']['settings']['backgroundMusic'] = "Background Music"

ar.setdefault('common', {}).setdefault('settings', {})
ar['common']['settings']['audio'] = "الصوت"
ar['common']['settings']['soundEffects'] = "مؤثرات صوتية"
ar['common']['settings']['backgroundMusic'] = "موسيقى خلفية"

save_json('src/locales/en.json', en)
save_json('src/locales/ar.json', ar)

print("Added generic buttons and settings texts")
