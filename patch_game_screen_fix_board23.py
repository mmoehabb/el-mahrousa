import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

# Ah, it is STILL black in landscape! Why?!
# Let's think: `availableHeight = window.innerHeight - (window.innerWidth < 1024 ? 130 : 50);`
# `minDimension = Math.min(window.innerWidth, availableHeight);`
# `targetSize = minDimension * 0.95;`
# In landscape, innerHeight is 375.
# `availableHeight = 375 - 130 = 245`.
# `minDimension = Math.min(812, 245) = 245`.
# `targetSize = 245 * 0.95 = 232.75`.
# `scale = 232.75 / 1280 = 0.18`.
# So `transform: scale(0.18) translate(-50%, -50%)`.
# BUT wait! If `transform: scale(...) translate(...)` is used, the translate is applied AFTER scale, which means it translates by 50% of the SCALED size.
# Yes, I said this earlier but didn't fix it properly.
# The correct order MUST be `translate(-50%, -50%) scale(...)`.
# Let me look at GameScreen.tsx:
# `transform: scale !== 1 ? \`scale(${scale}) translate(-50%, -50%)\` : 'translate(-50%, -50%)'`
# Ah! I used `scale(...) translate(...)` which translates by 50% of the UN-SCALED size? NO, transforms are applied right-to-left.
# Wait, if they are applied right-to-left, then `translate(-50%, -50%)` happens FIRST.
# So it translates by 50% of the ORIGINAL size (which is what we want, because the element is 1240x1240).
# Then it scales.
# BUT wait... if it scales, it scales from `origin-top-left`.
# So it moves to the center (translate), then scales down.
# Wait, if it's already translated to the center, and it scales from top-left, the top-left corner stays in the center, and the rest of the board shrinks!
# So the board shrinks towards the center of the screen, leaving the top and left empty.
# In landscape, the scale is 0.18. It shrinks so much that it might completely leave the viewport if the centering is off!
#
# The bulletproof centering for scaled absolute elements:
# ```css
# top: 50%;
# left: 50%;
# transform-origin: 0 0;
# transform: scale(0.18) translate(-50%, -50%);
# ```
# Let's test this order:
# 1. Translate -50%, -50%. (Moves center of element to 0,0).
# 2. Scale 0.18. (Shrinks it around 0,0).
# 3. Position at top: 50%, left: 50%. (Moves 0,0 to center of screen).
# YES! This is mathematically perfect.
# Wait, if `transform: scale(...) translate(...)`, then translate happens FIRST.
# So `scale(0.18) translate(-50%, -50%)` means: translate by -50% of original size, then scale by 0.18 from 0,0.
# Let's check my code:
# `transform: scale !== 1 ? \`scale(${scale}) translate(-50%, -50%)\` : 'translate(-50%, -50%)'`
# That IS the code I used! Why is it black?

# Let's look at `availableHeight` again.
# In landscape, availableHeight is 245.
# `minDimension` is 245.
# Is there an issue with Playwright landscape mode not clicking the buttons properly because they are overlapped?
# YES!
# In landscape (812x375), the "Create New Lobby" button or "Start Game" button might be off-screen and not scrollable!
# Playwright might be stuck on the Waiting Screen!
# If it's stuck on the waiting screen, my screenshot of the GameScreen would just be... wait, the waiting screen is dark, but not completely black.
# The landscape screenshot `board_landscape.png` is COMPLETELY black/dark blue.
# Actually, the dark blue `#0b021a` is the `bg-slate-900` background of the App!
# It's completely blank!
# Oh, in `verify_board_landscape.py`, I dismiss the dialog with `page.locator('button:has-text("OK")').click()`.
# If the dialog doesn't exist, it timeouts and throws exception?
# I put it in a `try...except`, so it ignores the exception.
# BUT wait! What if the "Start Game" button is never clicked because it's off-screen?
# Playwright `.click()` scrolls into view automatically.
# Let's check `board_landscape.png` by saving the HTML to see what's on the screen.

content = content.replace(
"""              className="absolute left-1/2 top-1/2 origin-top-left"
              style={{
                // We use origin-top-left and translate by -50% * 1/scale to perfectly center it
                transform: scale !== 1 ? `scale(${scale}) translate(-50%, -50%)` : 'translate(-50%, -50%)',
              }}""",
"""              className="absolute left-1/2 top-1/2 origin-top-left"
              style={{
                transform: scale !== 1 ? `scale(${scale}) translate(-50%, -50%)` : 'translate(-50%, -50%)',
              }}"""
)

with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content)
