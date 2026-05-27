import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

# Why is it still black in landscape?
# Maybe `minDimension` is so small that `targetSize` is negative or very small?
# In landscape: innerWidth = 812. availableHeight = 375 - 50 = 325.
# minDimension = 325. targetSize = 325 * 0.95 = 308.75.
# scale = 308.75 / 1280 = 0.24.
# Then `transform: scale(0.24)`.
# Wait, why is it completely black? Did Playwright not click the "Start Game" button or "OK"?
# In `verify_board_landscape.py` I use `page.locator('button:has-text("OK")').click(timeout=2000)`.
# But in landscape mode, the dialog might be slightly off screen, or maybe "Play as Guest" isn't visible?
# Let's write a small script to dump Playwright page content.

content = content.replace(
"""          <div className="w-full h-full flex-1 max-w-full overflow-hidden relative z-10 flex justify-center items-center">
            <div
              className="origin-center"
              style={{
                transform: scale !== 1 ? `scale(${scale})` : undefined,
              }}
            >""",
"""          <div className="w-full h-full flex-1 max-w-full overflow-hidden flex justify-center items-center relative z-10">
            <div
              className="origin-center lg:scale-100 lg:origin-top flex justify-center items-center"
              style={{
                transform: scale !== 1 ? `scale(${scale})` : undefined,
              }}
            >"""
)

with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content)
