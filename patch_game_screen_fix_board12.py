import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

# I see the script patch didn't apply properly because of some regex/replace mismatch in patch_game_screen_fix_board10.py.
# Let's fix GameScreen directly to use CSS container inline style.

board_search = """          <div className="mobile-board-scale">
            <Board
              handleRoll={handleRoll}
              isMyTurn={isMyTurn}
              sendAction={sendAction}
              onTileClick={setSelectedTile}
              setToastMessage={setToastMessage}
            />
          </div>"""

board_replace = """          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            <div
              className="origin-center lg:scale-100 lg:origin-top flex justify-center items-center"
              style={{
                transform: scale !== 1 ? `scale(${scale})` : undefined,
              }}
            >
              <Board
                handleRoll={handleRoll}
                isMyTurn={isMyTurn}
                sendAction={sendAction}
                onTileClick={setSelectedTile}
                setToastMessage={setToastMessage}
              />
            </div>
          </div>"""

content = content.replace(board_search, board_replace)

with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content)
