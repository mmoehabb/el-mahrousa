import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

# Replace board section scaling
# Original:
# <div className="w-full h-full flex items-center justify-center overflow-auto scale-[0.3] sm:scale-100 origin-center sm:origin-top">
#   <Board
# Let's make it calculate scale based on viewport width (vw/vh) for mobile,
# or just use CSS container queries or specific transform rules to make it fit.
# A simple way to make a 1240px board fit the screen is using CSS `transform: scale(min(100vw / 1240, 100vh / 1240))`

board_wrapper_search = '<div className="w-full h-full flex items-center justify-center overflow-auto scale-[0.3] sm:scale-100 origin-center sm:origin-top">'
board_wrapper_replace = """<div
            className="w-full h-full flex items-center justify-center overflow-auto lg:scale-100 lg:origin-top"
            style={{
              // On mobile (below lg breakpoint), we want the board to fit precisely in the view width
              transform: window.innerWidth < 1024 ? `scale(min(${window.innerWidth} / 1240, ${window.innerHeight} / 1240))` : undefined,
              transformOrigin: window.innerWidth < 1024 ? 'center center' : 'top center'
            }}
          >"""

content = content.replace(board_wrapper_search, board_wrapper_replace)

with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content)
