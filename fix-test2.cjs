const fs = require('fs');
let content = fs.readFileSync('src/logic/gameLogic.test.ts', 'utf8');

// The earlier sed turned `const executeTrade = ...` into `const proposeAndAcceptTrade = ...`
// However, I need to make sure the top-level declaration is right
if (!content.includes('const proposeAndAcceptTrade = (state: GameState, p1Id: string, p2Id: string, offer: TradeOffer) => {')) {
  content = content.replace(
    /import type \{ GameState, Player, TradeOffer \} from '\.\.\/types\/game\.ts'/,
    "import type { GameState, Player, TradeOffer } from '../types/game.ts'\n\nconst proposeAndAcceptTrade = (state: GameState, p1Id: string, p2Id: string, offer: TradeOffer) => {\n  const tempState = proposeTrade(state, p1Id, p2Id, offer)\n  const tradeId = tempState.trades[0].id!\n  return acceptTrade(tempState, tradeId)\n}\n"
  );
}

fs.writeFileSync('src/logic/gameLogic.test.ts', content);
