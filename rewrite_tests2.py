import re

with open('src/logic/gameLogic.test.ts', 'r') as f:
    content = f.read()

# Replace local createMockPlayer functions that were missed (they take 1, 2, or 3 args)
content = re.sub(
    r"const createMockPlayer = \(id: string, isBankrupt: boolean = false\): Player => \(\{[\s\S]*?\}\)",
    "",
    content
)

content = re.sub(
    r"const createMockPlayer = \(id: string, balance: number, properties: number\[\]\): Player => \(\{[\s\S]*?\}\)",
    "",
    content
)

content = re.sub(
    r"const createMockGameState = \(players: Player\[\]\): GameState => \(\{[\s\S]*?\}\)",
    "",
    content
)

content = re.sub(
    r"const createMockState = \(players: Player\[\], currentPlayerIndex: number\): GameState => \(\{[\s\S]*?\}\)",
    "",
    content
)

with open('src/logic/gameLogic.test.ts', 'w') as f:
    f.write(content)
