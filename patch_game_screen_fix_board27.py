import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

board_search = """          <div className="w-full h-full flex-1 max-w-full overflow-hidden relative z-10">
            <div
              className="absolute left-1/2 top-1/2 origin-top-left"
              style={{
                // We use origin-top-left and translate by -50% * 1/scale to perfectly center it
                transform: scale !== 1 ? `scale(${scale}) translate(-50%, -50%)` : 'translate(-50%, -50%)',
              }}
            >"""

board_replace = """          <div className="w-full h-full flex-1 max-w-full overflow-hidden relative z-10 flex justify-center items-center">
            <div
              style={{
                transform: scale !== 1 ? `scale(${scale})` : undefined,
                transformOrigin: 'center center',
              }}
            >"""

content = content.replace(board_search, board_replace)

with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content)
