import re

with open("src/index.css", "r") as f:
    content = f.read()

# I see the problem. `transform: translateX(-50%)` doesn't work correctly here because we didn't define a width.
# In `mobile-board-scale`, we have `width: 1200px` from the board component? Wait, the board is wrapped in `<div className="relative p-[20px]"><div className="w-[1200px]">`
# So the outer div is 1240px.

# Let's try CSS `zoom` again, but target the actual container, or let's use `scale` with a specific width on the wrapper.
# If we have:
# .mobile-board-wrapper { width: 100vw; height: 100dvh; display: flex; align-items: flex-start; justify-content: center; }
# .mobile-board-scale { transform: scale(min(100vw, 100dvh) / 1280); transform-origin: top center; margin-top: 50px; }
# And wait! The problem is `mobile-board-scale` still has a 1240px physical width, so flexbox tries to center a 1240px element in a 375px container.
# This causes the element to be pushed to the right, and then we see its left side.

# The fix is to add `width: 1280px; height: 1280px; flex-shrink: 0;` but NOT center it with flexbox.
# Better: position it absolutely.

content = content.replace(
"""  .mobile-board-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: center;
  }
  .mobile-board-scale {
    position: absolute;
    top: 50px; /* some padding from top ping indicator */
    left: 50%;
    transform: translateX(-50%) scale(calc(min(100vw, 100dvh) / 1280));
    transform-origin: top center;
  }""",
"""  .mobile-board-wrapper {
    width: 100%;
    height: 100vh;
    position: relative;
    overflow: hidden;
  }
  .mobile-board-scale {
    position: absolute;
    top: 50px;
    left: 50%;
    width: 1240px;
    height: 1240px;
    margin-left: -620px; /* Half of 1240px to center it perfectly */
    transform: scale(calc(min(100vw, 100dvh) / 1280));
    transform-origin: top center;
  }"""
)

with open("src/index.css", "w") as f:
    f.write(content)
