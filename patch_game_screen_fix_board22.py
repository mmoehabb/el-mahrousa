import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

# Let's fix the responsiveness completely. The user's exact complaint:
# "Great work. However, it doesn't adapt to screen height. It's only responsive to screen width. It should take into account the height of the screen as well."
#
# The issue with using `scale()` on a large 1240px container is that it STILL takes up 1240px in the CSS layout box model.
# When flexbox tries to center it, it centers the 1240px invisible bounding box.
# If the viewport is small, flexbox pushes the center of the 1240px box to the center of the screen, which pushes the TOP and LEFT off-screen!
# That's why the board is pushed to the bottom right!
# To fix this, you MUST use absolute positioning with `top: 50%; left: 50%; transform: translate(-50%, -50%) scale(...)`.
# Let's re-implement absolute positioning, it is the ONLY bulletproof way to scale a fixed-size element without layout side-effects.

board_search = """          <div className="w-full h-full flex-1 max-w-full overflow-hidden flex justify-center items-center relative z-10">
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

board_replace = """          <div className="w-full h-full flex-1 max-w-full overflow-hidden relative z-10">
            <div
              className="absolute left-1/2 top-1/2 origin-top-left"
              style={{
                // We use origin-top-left and translate by -50% * 1/scale to perfectly center it
                transform: scale !== 1 ? `scale(${scale}) translate(-50%, -50%)` : 'translate(-50%, -50%)',
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
