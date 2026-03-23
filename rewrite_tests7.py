import re

with open('src/logic/gameLogic.test.ts', 'r') as f:
    content = f.read()

# Replace p1/p2 declarations from createMockPlayer inside those blocks to not clash with existing
content = content.replace(
    "const p1 = createMockPlayer({ id: 'p1', name: 'Player 1', balance: 1000, properties: [1, 2] })",
    "const player1 = createMockPlayer({ id: 'p1', name: 'Player 1', balance: 1000, properties: [1, 2] })"
)

content = content.replace(
    "const p2 = createMockPlayer({ id: 'p2', name: 'Player 2', balance: 1500, properties: [3, 4] })",
    "const player2 = createMockPlayer({ id: 'p2', name: 'Player 2', balance: 1500, properties: [3, 4] })"
)

content = content.replace(
    "const state = createMockState([p1, p2])",
    "const state = createMockState([player1, player2])"
)

with open('src/logic/gameLogic.test.ts', 'w') as f:
    f.write(content)
