import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

# Instead of using raw `window.innerWidth` directly in the style block which won't update on resize,
# let's add a state and a resize listener, or just use pure CSS in a style tag / Tailwind custom class.
# Pure CSS: transform: scale(calc(min(100vw, 100vh) / 1240))
# Let's replace the inline style with pure CSS inline style.

board_wrapper_search = """<div
            className="w-full h-full flex items-center justify-center overflow-auto lg:scale-100 lg:origin-top"
            style={{
              // On mobile (below lg breakpoint), we want the board to fit precisely in the view width
              transform: window.innerWidth < 1024 ? `scale(min(${window.innerWidth} / 1240, ${window.innerHeight} / 1240))` : undefined,
              transformOrigin: window.innerWidth < 1024 ? 'center center' : 'top center'
            }}
          >"""

board_wrapper_replace = """<div
            className="w-full h-full flex items-center justify-center overflow-hidden lg:scale-100 lg:origin-top origin-center"
            style={{
              transform: typeof window !== 'undefined' && window.innerWidth < 1024 ? 'scale(calc(min(100vw, 100dvh) / 1240))' : undefined,
            }}
          >"""

content = content.replace(board_wrapper_search, board_wrapper_replace)

# Also let's fix the parent div.
parent_wrapper_search = """        <div
          dir="ltr"
          className="w-full h-full flex-1 max-w-full overflow-hidden flex justify-center relative z-10 sm:scale-100 origin-top"
        >"""

parent_wrapper_replace = """        <div
          dir="ltr"
          className="w-full h-full flex-1 max-w-full overflow-hidden flex justify-center items-center relative z-10 lg:origin-top"
        >"""

content = content.replace(parent_wrapper_search, parent_wrapper_replace)

with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content)
