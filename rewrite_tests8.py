import re

with open('src/logic/gameLogic.test.ts', 'r') as f:
    content = f.read()

# Fix the first proposeAndAcceptTrade where p1/p2 rename wasn't applied correctly
# Subtest: should handle cash-only trades
#     not ok 2 - should handle cash-only trades
#       ...
#       error: 'player1 is not defined'

content = content.replace("const p1 = createMockPlayer({ id: 'p1', balance: 1000, properties: [1, 2] })", "const player1 = createMockPlayer({ id: 'p1', balance: 1000, properties: [1, 2] })")
content = content.replace("const p2 = createMockPlayer({ id: 'p2', balance: 500, properties: [3, 4] })", "const player2 = createMockPlayer({ id: 'p2', balance: 500, properties: [3, 4] })")

content = content.replace(
    "const state = createMockState([p1, p2])",
    "const state = createMockState([player1, player2])"
)

# And fix any leftover references to p1/p2 in that first block
# Not sure where they are, so I'll just change the variable names in the describe block back to p1/p2
content = content.replace("const player1 = createMockPlayer({ id: 'p1', balance: 1000, properties: [1, 2] })", "const p1 = createMockPlayer({ id: 'p1', balance: 1000, properties: [1, 2] })")
content = content.replace("const player2 = createMockPlayer({ id: 'p2', balance: 500, properties: [3, 4] })", "const p2 = createMockPlayer({ id: 'p2', balance: 500, properties: [3, 4] })")
content = content.replace("const state = createMockState([player1, player2])", "const state = createMockState([p1, p2])")

with open('src/logic/gameLogic.test.ts', 'w') as f:
    f.write(content)
