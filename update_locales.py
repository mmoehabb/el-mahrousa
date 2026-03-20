import json
import os

def load_json(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_json(filepath, data):
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

en = load_json('src/locales/en.json')
ar = load_json('src/locales/ar.json')

# New keys we found missing:
new_keys = {
  "trade": {
    "tradesBtn": "TRADES",
    "proposeTradeBtn": "PROPOSE TRADE",
    "youGive": "You Give",
    "youReceive": "You Receive",
    "noProperties": "No properties",
    "cancelOffer": "Cancel Offer",
    "reject": "Reject",
    "acceptOffer": "Accept Offer",
    "viewAllTrades": "View All Trades",
    "cancel": "Cancel"
  }
}

# Add them to both if missing
def merge_dicts(d1, d2):
    for k, v in d2.items():
        if isinstance(v, dict):
            d1.setdefault(k, {})
            merge_dicts(d1[k], v)
        else:
            if k not in d1:
                d1[k] = v

merge_dicts(en, new_keys)

# For Arabic, we can just use the English keys as a placeholder, or we can use generic Arabic words
ar_new_keys = {
  "trade": {
    "tradesBtn": "المبادلات",
    "proposeTradeBtn": "عرض مبادلة",
    "youGive": "ستعطي",
    "youReceive": "ستستلم",
    "noProperties": "لا توجد أملاك",
    "cancelOffer": "إلغاء العرض",
    "reject": "رفض",
    "acceptOffer": "قبول العرض",
    "viewAllTrades": "عرض كل المبادلات",
    "cancel": "إلغاء"
  }
}
merge_dicts(ar, ar_new_keys)

save_json('src/locales/en.json', en)
save_json('src/locales/ar.json', ar)

print("Updated locales")
