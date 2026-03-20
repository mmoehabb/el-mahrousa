import json

def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en = load_json('src/locales/en.json')
ar = load_json('src/locales/ar.json')

en.setdefault('board', {})
en['board']['title'] = "EL-MAHROUSA"

ar.setdefault('board', {})
ar['board']['title'] = "المحروسة"

save_json('src/locales/en.json', en)
save_json('src/locales/ar.json', ar)

# Fix Board.tsx
with open('src/components/Board.tsx', 'r', encoding='utf-8') as f:
    board = f.read()

board = board.replace('EL-MAHROUSA', '{t("board.title")}')

with open('src/components/Board.tsx', 'w', encoding='utf-8') as f:
    f.write(board)

print("Fixed board title")
