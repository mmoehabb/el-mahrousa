import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

# Ah! It's completely empty! Why is it empty?
# Wait! In landscape mode (width=812, height=375), we set `scale(245 / 1280)` which is 0.19.
# Is the board rendering? Yes, but maybe the container has `overflow-hidden` and `height: 100%` and the transform is weird?
# Wait, look at the `GameScreen.tsx` again:
# `<div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:static lg:transform-none lg:flex lg:justify-center lg:items-center" style={{ transform: scale !== 1 ? \`translate(-50%, -50%) scale(${scale})\` : undefined, }}>`
# `top-1/2 left-1/2` combined with `translate(-50%, -50%)` perfectly centers it!
# Why is it black? Because the user hasn't clicked OK on the dialog? No, I clicked OK.
# Maybe the game hasn't started? No, the dialog wouldn't exist.
# Maybe it's shifted completely off-screen because `translate(-50%, -50%) scale(...)` works weirdly in Safari/Chrome when combined?
# Wait, `translate(-50%, -50%) scale(0.19)`
# In CSS, `transform: translate(-50%, -50%) scale(0.19)` scales the object from its center, then translates it?
# NO! Transform functions are applied from right to left!
# So it scales first, THEN translates!
# If it translates after scaling, the translation is ALSO scaled! So `-50%` of the ALREADY SCALED width/height!
# No wait, % in translate is based on the element's bounding box BEFORE transforms.
# So `translate(-50%, -50%)` is always exactly half the original size.
# BUT wait, the center is at 50% 50%.
# Actually, the simplest fix is to NOT use translate, but use flexbox centering on the parent and `transform-origin: center`!
# Let's fix this layout properly.

content = content.replace(
"""          <div className="w-full h-full flex-1 max-w-full overflow-hidden relative z-10 lg:flex lg:justify-center lg:items-center">
            <div
              className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 lg:static lg:transform-none lg:flex lg:justify-center lg:items-center"
              style={{
                transform: scale !== 1 ? `translate(-50%, -50%) scale(${scale})` : undefined,
              }}
            >""",
"""          <div className="w-full h-full flex-1 max-w-full overflow-hidden relative z-10 flex justify-center items-center">
            <div
              className="origin-center"
              style={{
                transform: scale !== 1 ? `scale(${scale})` : undefined,
              }}
            >"""
)

with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content)
