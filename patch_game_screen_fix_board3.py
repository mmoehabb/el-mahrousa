import re

with open("src/index.css", "r") as f:
    content = f.read()

# Let's remove width and height here, and just use transform and origin, but maybe the
# origin should be top left, and we use absolute positioning?
# Or if we use standard transform on flex child, `origin-top` in Tailwind handles `transform-origin: top`.
# We just need to ensure the container itself has height.

# Actually, the problem might be that the mobile board size is too big and it gets clipped by `overflow-hidden`
# in the parent. Or because scale does not change layout size, the container takes full size (1240x1240)
# and overflows, making it impossible to scroll. Wait, we want it to fit perfectly.
# So if it fits perfectly, `1280px` scaled by `min(100vw, 100dvh)/1280` becomes exactly `min(100vw, 100dvh)` in size.
# BUT the layout engine still thinks it is 1280px unless we use something like CSS `zoom` or adjust the wrapper.

# Let's try CSS `zoom` property, which affects layout, or we can use absolute positioning to avoid layout issues.
# CSS zoom is actually very well supported on mobile webkit/blink. Firefox doesn't support it well but it's mobile.

content = content.replace(
"""  .mobile-board-scale {
    transform: scale(calc(min(100vw, 100dvh) / 1280));
    transform-origin: top center;
    width: 1280px;
    height: 1280px;
    flex-shrink: 0;
  }""",
"""  .mobile-board-scale {
    transform: scale(calc(min(100vw, 100dvh) / 1280));
    transform-origin: top center;
  }
  .mobile-board-wrapper {
     height: calc(min(100vw, 100dvh));
     width: 100%;
     display: flex;
     justify-content: center;
  }"""
)

with open("src/index.css", "w") as f:
    f.write(content)


with open("src/components/GameScreen.tsx", "r") as f:
    content2 = f.read()

content2 = content2.replace('className="flex justify-center origin-top mobile-board-scale pt-8"',
                            'className="mobile-board-scale pt-8 flex justify-center"')

content2 = content2.replace('className="w-full h-full flex-1 max-w-full overflow-hidden flex justify-center items-center relative z-10 lg:origin-top"',
                            'className="w-full h-full flex-1 max-w-full overflow-hidden relative z-10 lg:origin-top lg:flex lg:justify-center lg:items-center mobile-board-wrapper"')


with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content2)
