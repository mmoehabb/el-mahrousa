import re

with open('src/logic/gameLogic.test.ts', 'r') as f:
    content = f.read()

# Fix the duplicate block of tests that fail
# There are two 'proposeAndAcceptTrade' describe blocks. Let's merge or fix the second one
content = re.sub(
    r"const player1 = createMockPlayer\(\{ id: 'p1', balance: 500 \}\)\s*\n\s*const player2 = createMockPlayer\(\{ id: 'p2', balance: 500, properties: \[1\] \}\)",
    "const player1 = createMockPlayer({ id: 'p1', balance: 500 })\n    const player2 = createMockPlayer({ id: 'p2', balance: 500, properties: [1] })",
    content
)

# Fix the second describe('proposeAndAcceptTrade', ...) by fixing the player initialization there.
# It seems `createMockState([player1, player2])` is used, but player variables aren't initialized correctly or at all
# Let's see how it looks by fetching the whole block
