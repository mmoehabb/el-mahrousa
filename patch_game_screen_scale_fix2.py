import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

# Let's fix the transform by ensuring we use CSS var or better approach for dynamic resize without inline style JS check
# since inline style with `window.innerWidth` in React won't automatically re-render on resize unless we add a resize listener.
# Since the goal is pure CSS, we can just use a Tailwind custom class or pure style object.

board_wrapper_search = """<div
            className="w-full h-full flex items-center justify-center overflow-hidden lg:scale-100 lg:origin-top origin-center"
            style={{
              transform: typeof window !== 'undefined' && window.innerWidth < 1024 ? 'scale(calc(min(100vw, 100dvh) / 1240))' : undefined,
            }}
          >"""

# Using pure CSS in style, without window check. We will handle the lg: screen scale-100 using a custom class or media query if needed.
# But actually `transform: 'scale(...) '` in style will override Tailwind's `lg:scale-100`.
# To avoid this, we can just add a CSS class in index.css and use it.

board_wrapper_replace = """<div
            className="w-full h-full flex items-center justify-center overflow-hidden origin-center lg:origin-top mobile-board-scale"
          >"""

content = content.replace(board_wrapper_search, board_wrapper_replace)

with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content)
