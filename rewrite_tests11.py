import re

with open('src/logic/gameLogic.test.ts', 'r') as f:
    content = f.read()

# Fix the duplicate block of tests that fail
content = content.replace(
    "const player1 = createMockPlayer({ id: 'p1', name: 'Player 1', balance: 1000, properties: [1, 2] })",
    "const p1 = createMockPlayer({ id: 'p1', name: 'Player 1', balance: 1000, properties: [1, 2] })"
)
content = content.replace(
    "const player2 = createMockPlayer({ id: 'p2', name: 'Player 2', balance: 1500, properties: [3, 4] })",
    "const p2 = createMockPlayer({ id: 'p2', name: 'Player 2', balance: 1500, properties: [3, 4] })"
)

# And make sure all test scopes have these setups
content = re.sub(
    r"test\('should fail if p2 has insufficient funds', \(\) => \{\s*const state = createMockState\(\)",
    r"test('should fail if p2 has insufficient funds', () => {\n    const p1 = createMockPlayer({ id: 'p1', name: 'Player 1', balance: 1000, properties: [1, 2] })\n    const p2 = createMockPlayer({ id: 'p2', name: 'Player 2', balance: 1500, properties: [3, 4] })\n    const state = createMockState([p1, p2])",
    content
)

content = re.sub(
    r"test\('should fail if p1 offers unowned property', \(\) => \{\s*const state = createMockState\(\)",
    r"test('should fail if p1 offers unowned property', () => {\n    const p1 = createMockPlayer({ id: 'p1', name: 'Player 1', balance: 1000, properties: [1, 2] })\n    const p2 = createMockPlayer({ id: 'p2', name: 'Player 2', balance: 1500, properties: [3, 4] })\n    const state = createMockState([p1, p2])",
    content
)

content = re.sub(
    r"test\('should fail if p2 offers unowned property', \(\) => \{\s*const state = createMockState\(\)",
    r"test('should fail if p2 offers unowned property', () => {\n    const p1 = createMockPlayer({ id: 'p1', name: 'Player 1', balance: 1000, properties: [1, 2] })\n    const p2 = createMockPlayer({ id: 'p2', name: 'Player 2', balance: 1500, properties: [3, 4] })\n    const state = createMockState([p1, p2])",
    content
)

with open('src/logic/gameLogic.test.ts', 'w') as f:
    f.write(content)
