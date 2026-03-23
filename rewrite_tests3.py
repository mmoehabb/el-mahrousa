import re

with open('src/logic/gameLogic.test.ts', 'r') as f:
    content = f.read()

# Replace old mock calls that used positional args
content = re.sub(
    r"createMockPlayer\('(\w+)', (\d+), (\[.*?\])\)",
    r"createMockPlayer({ id: '\1', balance: \2, properties: \3 })",
    content
)

content = re.sub(
    r"createMockGameState\(\[(.*?)\]\)",
    r"createMockState([\1])",
    content
)

# For the endTurn describe block mock players:
# createMockPlayer('1'), createMockPlayer('2', true), etc
content = re.sub(
    r"createMockPlayer\('(\w+)'\)",
    r"createMockPlayer({ id: '\1' })",
    content
)

content = re.sub(
    r"createMockPlayer\('(\w+)',\s*(true|false)\)",
    r"createMockPlayer({ id: '\1', isBankrupt: \2 })",
    content
)

# Replace the createMockState with array arg to object override arg in endTurn
content = re.sub(
    r"createMockState\(\s*\[(.*?)\],\s*(\d+)\s*\)",
    r"createMockState([\1], undefined, { currentPlayerIndex: \2 })",
    content
)

with open('src/logic/gameLogic.test.ts', 'w') as f:
    f.write(content)
