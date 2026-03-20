with open('src/components/Tile.tsx', 'r', encoding='utf-8') as f:
    tile = f.read()

# p.isBankrupt ? ' (Bankrupt)' : ''
# let's change it to p.isBankrupt ? ` (${t('game.bankruptLabel')})` : ''

tile = tile.replace("p.isBankrupt ? ' (Bankrupt)' : ''", "p.isBankrupt ? ` (${t('game.bankruptLabel')})` : ''")

with open('src/components/Tile.tsx', 'w', encoding='utf-8') as f:
    f.write(tile)

print("Fixed Tile.tsx")
