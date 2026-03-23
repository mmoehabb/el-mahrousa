import re

with open('src/logic/gameLogic.test.ts', 'r') as f:
    content = f.read()

# Fix the duplicate block of tests that fail
content = content.replace(
    "const state = createMockState([p1, p2])",
    "const state = createMockState([player1, player2])"
)

# And fix any leftover p1 vs player1 in that second proposeAndAccept block
# It was setting 'const player1' but checking 'const p1' later? The 'const p1 = newState.players.find...' is fine since it's local scope.

with open('src/logic/gameLogic.test.ts', 'w') as f:
    f.write(content)
