import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

# I see it uses `Math.min(window.innerWidth, window.innerHeight) / 1280`.
# If it uses Math.min(innerWidth, innerHeight), it SHOULD be responsive to height if height < width.
# Oh, on mobile, width (e.g. 375px) is always < height (e.g. 812px).
# So `Math.min(375, 812)` is 375.
# If the board is square (1240x1240), it will be scaled to 375x375.
# Wait, if width is 375, and the board is scaled to 375x375, it perfectly fits the width, and since height is 812, it fits the height too!
# Why did the user say "it doesn't adapt to screen height"?
# Maybe they mean in landscape mode, where height is small?
# Wait! In landscape mode, width is 812, height is 375.
# Then `Math.min` returns 375. It will scale to 375x375, which fits height perfectly!
# So `Math.min(window.innerWidth, window.innerHeight)` ALREADY accounts for both, because the board is a SQUARE.

# Let's think. What if the user wants it to be responsive to *available* space, not just window size?
# The board container has a top bar (ping indicator) and a bottom nav bar.
# The bottom nav bar is: `<div className="lg:hidden fixed bottom-0 left-0 right-0 ...">`
# The floating CTA is: `<div className="lg:hidden fixed bottom-20 ...">`
# If we scale it to `Math.min(window.innerWidth, window.innerHeight)`, the board might overlap with the bottom nav bar or floating CTA!
# So we need to subtract the height of the UI elements from `window.innerHeight`.
# For example, subtract 120px for the top/bottom UI.

# Or, maybe the board is NOT perfectly fitting if we use 1280 as divisor.
# The board is 1240px wide/tall. If we divide by 1280, it will have a small margin.
# Let's subtract some height for the UI.

content = content.replace(
"""        setScale(Math.min(window.innerWidth, window.innerHeight) / 1280)""",
"""        // Subtract some vertical space for the mobile bottom nav (approx 80px) and top padding (approx 50px)
        const availableHeight = window.innerHeight - 130;
        setScale(Math.min(window.innerWidth, availableHeight) / 1280)"""
)

with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content)
