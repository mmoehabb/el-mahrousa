import re

with open('src/logic/gameLogic.test.ts', 'r') as f:
    content = f.read()

# Fix the final failing test message format string:
# 'Trade executed between Player 1 and Player 1'
# -> should be 'Trade executed between Player 1 and Player 2'

# Let's fix the mock player name property in the setup of that block
content = content.replace(
    "const p1 = createMockPlayer({ id: 'p1', balance: 1000, properties: [1, 2] })",
    "const p1 = createMockPlayer({ id: 'p1', name: 'Player p1', balance: 1000, properties: [1, 2] })"
)
content = content.replace(
    "const p2 = createMockPlayer({ id: 'p2', balance: 500, properties: [3, 4] })",
    "const p2 = createMockPlayer({ id: 'p2', name: 'Player p2', balance: 500, properties: [3, 4] })"
)

with open('src/logic/gameLogic.test.ts', 'w') as f:
    f.write(content)
