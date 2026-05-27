import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

# Let's completely remove the buggy flexbox alignment that's keeping the board size inside the container wrapper.
# If the Board scales, it still takes up its original width and height in the layout flow, creating massive invisible overflow that pushes things around or causes clip.
# The ONLY way to perfectly fix it is to wrap the Board in a container that ALSO scales its height/width to match the visual size,
# OR use absolute positioning so it doesn't push the layout.

# The current HTML is:
# <div className="w-full h-full flex-1 max-w-full overflow-hidden flex justify-center items-center relative z-10">
#   <div className="origin-center lg:scale-100 lg:origin-top flex justify-center items-center" style={{ transform: ... }}>
#     <Board />
#   </div>
# </div>

# This works fine with absolute positioning:
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

board_replace = """          <div className="w-full h-full flex-1 max-w-full overflow-hidden relative z-10 lg:flex lg:justify-center lg:items-center">
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:static lg:transform-none lg:flex lg:justify-center lg:items-center"
              style={{
                transform: scale !== 1 ? `translate(-50%, -50%) scale(${scale})` : undefined,
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
