import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

# Let's ensure that the container that wraps the Board handles height responsiveness gracefully.
# The user said: "it doesn't adapt to screen height. It's only responsive to screen width."
# If a user shrinks the browser window vertically on desktop, `window.innerWidth < 1024` might be false!
# Wait! "On mobile..." but maybe they are testing in Chrome DevTools responsive mode?
# If they are on a tablet, `innerWidth` might be 1024 or higher, so `scale` stays 1, but the height is small?
# If `window.innerWidth >= 1024`, scale is forced to 1.
# So if they have a wide but short window, it doesn't adapt!
# Let's remove the `window.innerWidth < 1024` check and just make it ALWAYS adapt if it doesn't fit!
# Wait, the original code had:
# `if (window.innerWidth < 1024)`
# If I change it to always adapt if `Math.min(window.innerWidth, availableHeight) < 1280`, then it will work perfectly everywhere!

content = content.replace(
"""      if (window.innerWidth < 1024) {
        // Subtract some vertical space for the mobile bottom nav (approx 80px) and top padding (approx 50px)
        const availableHeight = window.innerHeight - 130;
        setScale(Math.min(window.innerWidth, availableHeight) / 1280)
      } else {
        setScale(1)
      }""",
"""      // Always adapt to screen size if the window is too small, regardless of mobile/desktop
      const availableHeight = window.innerHeight - (window.innerWidth < 1024 ? 130 : 50); // Less UI overhead on desktop
      const minDimension = Math.min(window.innerWidth, availableHeight);

      // We want some padding so it doesn't touch the exact edges
      const targetSize = minDimension * 0.95;

      if (targetSize < 1280) {
        setScale(targetSize / 1280);
      } else {
        setScale(1);
      }"""
)

with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content)
