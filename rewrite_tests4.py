import re

with open('src/logic/gameLogic.test.ts', 'r') as f:
    content = f.read()

# Replace the createMockState with array arg to object override arg in endTurn
content = re.sub(
    r"createMockState\(\s*\[(.*?)\],\s*(\d+),\s*\)",
    r"createMockState([\1], undefined, { currentPlayerIndex: \2 })",
    content
)

with open('src/logic/gameLogic.test.ts', 'w') as f:
    f.write(content)
