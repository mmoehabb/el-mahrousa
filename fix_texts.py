import re
import os

def read_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        return f.read()

def write_file(filepath, content):
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

# Fix GameControls.tsx
gc = read_file('src/components/GameControls.tsx')
gc = gc.replace('<Handshake size={18} /> TRADES', '<Handshake size={18} /> {t("trade.tradesBtn")}')
gc = gc.replace('PROPOSE TRADE', '{t("trade.proposeTradeBtn")}')
gc = gc.replace('Cancel\n                      </button>', '{t("trade.cancel")}\n                      </button>')
gc = gc.replace('Accept\n                        </button>', '{t("trade.acceptOffer")}\n                        </button>')
gc = gc.replace('Reject\n                        </button>', '{t("trade.reject")}\n                        </button>')
gc = gc.replace('View All Trades', '{t("trade.viewAllTrades")}')
write_file('src/components/GameControls.tsx', gc)

# Fix TradeModal.tsx
tm = read_file('src/components/TradeModal.tsx')
tm = tm.replace('You Give', '{t("trade.youGive")}')
tm = tm.replace('No properties', '{t("trade.noProperties")}')
tm = tm.replace('You Receive', '{t("trade.youReceive")}')
tm = tm.replace('Cancel Offer', '{t("trade.cancelOffer")}')
tm = tm.replace('Reject\n                </button>', '{t("trade.reject")}\n                </button>')
tm = tm.replace('Accept Offer', '{t("trade.acceptOffer")}')
write_file('src/components/TradeModal.tsx', tm)

print("Fixed texts")
