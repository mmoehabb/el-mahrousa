import re

with open('src/logic/gameLogic.test.ts', 'r') as f:
    content = f.read()

# Fix the first proposeAndAcceptTrade where we renamed player1 and player2 to p1 and p2 but some references still point to player1/player2.
content = content.replace(
    "const player1 = createMockPlayer({ id: 'p1', balance: 1000, properties: [1, 2] })",
    "const p1 = createMockPlayer({ id: 'p1', balance: 1000, properties: [1, 2] })"
)
content = content.replace(
    "const player2 = createMockPlayer({ id: 'p2', balance: 500, properties: [3, 4] })",
    "const p2 = createMockPlayer({ id: 'p2', balance: 500, properties: [3, 4] })"
)

# Replace 'const state = createMockState([player1, player2])' with 'const state = createMockState([p1, p2])' in ALL instances
content = content.replace("const state = createMockState([player1, player2])", "const state = createMockState([p1, p2])")

with open('src/logic/gameLogic.test.ts', 'w') as f:
    f.write(content)
