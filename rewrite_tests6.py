import re

with open('src/logic/gameLogic.test.ts', 'r') as f:
    content = f.read()

# Replace empty createMockState() in the second proposeAndAcceptTrade block
# with one that has properly configured players for these tests
replacement = """    const p1 = createMockPlayer({ id: 'p1', name: 'Player 1', balance: 1000, properties: [1, 2] })
    const p2 = createMockPlayer({ id: 'p2', name: 'Player 2', balance: 1500, properties: [3, 4] })
    const state = createMockState([p1, p2])"""

content = re.sub(
    r"const state = createMockState\(\)",
    replacement,
    content
)

with open('src/logic/gameLogic.test.ts', 'w') as f:
    f.write(content)
