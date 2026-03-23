import re

with open('src/logic/gameLogic.test.ts', 'r') as f:
    content = f.read()

# Remove old factory functions

content = re.sub(r"  const createMockPlayer = \([^\)]*\): Player => \(\{.*?  \}\)\n", "", content, flags=re.DOTALL)
content = re.sub(r"  const createMockTile = \([^\)]*\): import\('\.\./types/game\.ts'\)\.Tile => \(\{.*?  \}\)\n", "", content, flags=re.DOTALL)
content = re.sub(r"  const createMockState = \([^\)]*\): GameState => \(\{.*?  \}\)\n", "", content, flags=re.DOTALL)

# Add import
import_stmt = "import { createMockPlayer, createMockTile, createMockState } from './testUtils.ts'\n"
content = content.replace("import type { GameState, Player, TradeOffer } from '../types/game.ts'", "import type { GameState, Player, TradeOffer } from '../types/game.ts'\n" + import_stmt)


with open('src/logic/gameLogic.test.ts', 'w') as f:
    f.write(content)
