import re

with open("src/index.css", "r") as f:
    content = f.read()

# I see it's shifted left now!
# wait, width is 1240px, margin-left is -620px, left: 50%.
# It should be perfectly centered, why is it shifted?
# Because the board wrapper in `src/components/Board.tsx` might actually be 1200px or `min-w-[1200px]`,
# BUT `div className="relative p-[20px]"` makes the full width `1200px + 40px padding = 1240px`.
# Wait, `w-[1200px]` is on the inner div, so it's `1200px` width! Wait, does `w-[1200px]` include padding in Tailwind? No, padding is outside if box-sizing is content-box, but Tailwind uses border-box! So `w-[1200px]` means total width is 1200px! If it has `p-4`, padding is inside.
# Ah, `div className="relative p-[20px]">` contains `div className="... w-[1200px]"`.
# So total width is 1200 + 40 = 1240px.

# Let's just use flexbox and NO absolute positioning. The problem with flexbox was we used `transform: scale`, which doesn't change layout size,
# so flexbox centers a 1240px invisible box, which pushes things off-screen.
# BUT if we use flexbox, and we just use `transform-origin: top left`, and apply a specific margin?
# Or use `zoom: ...` for real. Let's see why zoom didn't work. Because we had BOTH `zoom` and `transform`? No, we had `zoom` and `margin-top`.
# Let's just do `transform: scale(calc(min(100vw, 100dvh) / 1280))` and we can fix the layout centering by just doing `margin-left: calc((100vw - 1240px) / 2)`? No, because that margin would be negative, which is fine!
# If we do:
# .mobile-board-scale {
#   transform: scale(calc(min(100vw, 100dvh) / 1280));
#   transform-origin: top left;
#   margin-left: calc((100vw - 1240px * (min(100vw, 100dvh) / 1280)) / 2);
# }
# Wait, if `transform-origin: top left`, the scaled element is placed at its normal top-left position, then scaled down.
# Then its visual width is `1240 * scale`.
# We want it centered in `100vw`. So `left` should be `(100vw - 1240 * scale) / 2`.

# Let's simplify and use absolute positioning with `transform-origin: top left` and calculating the left position precisely.
# No, `transform-origin: center top` with `left: 50%` and `transform: translateX(-50%) scale(...)` IS mathematically correct and should center it.
# Why didn't it center?
# Because `translateX(-50%)` is applied AFTER `scale`!
# Ah! `transform: translateX(-50%) scale(...)`
# If we do `transform: translateX(-50%) scale(0.3)`, it scales it down, but the translation is 50% of the ORIGINAL width, so 50% of 1240 = 620.
# But wait, 620 is correct for centering a 1240px object!
# So `left: 50%; position: absolute; transform: translateX(-50%) scale(...); transform-origin: top center;` SHOULD perfectly center it.
# Why did my previous screenshot show it shifted left?
# Let's look at the screenshot again.
# Wait, the `mobile-board-scale` class had:
# margin-left: -620px;
# AND left: 50%;
# AND transform: scale(...)
# BUT NO `translateX(-50%)`!
# Ah, `margin-left: -620px` moves it left by 620px *before* scale? Margin isn't scaled. So it moves it left by 620 physical pixels!
# Yes! `left: 50%` is `187.5px`. `margin-left: -620px` makes it `-432.5px`.
# Then `transform-origin: top center` scales it from its center! Its center is at `187.5px` (since left edge is at -432.5 and width is 1240, center is -432.5 + 620 = 187.5px = 50vw).
# Wait, if its center is at 50vw, and it scales from its center, then it SHOULD be centered in the screen.
# Why did it shift left?
# Maybe `transform-origin: top center` calculates center based on the element's box, which is 1240px.

# Let's try the absolute simplest, most robust CSS centering for transforms:
# .mobile-board-scale {
#   transform: scale(calc(min(100vw, 100dvh) / 1280));
#   transform-origin: top left;
#   position: absolute;
#   left: 50%;
#   /* We translate left by half of its original width to center it, but wait! translateX uses the element's width, so -50% is half of 1240! */
#   /* But we scale it, so if we use `transform: translate(-50%, 0) scale(...)`, order matters! */
# }

content = content.replace(
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
  }""",
"""  .mobile-board-wrapper {
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: flex-start;
  }
  .mobile-board-scale {
    transform: scale(calc(min(100vw, 100dvh) / 1280));
    transform-origin: top center;
    /* Negative margins to pull the container size back down to the scaled size */
    /* If scale is ~0.3, it shrinks by ~70%, so we need huge negative margins */
    /* Alternatively, just use zoom, which is supported on all mobile browsers now! Firefox Android supports it since v126. */
    zoom: calc(min(100vw, 100dvh) / 1280);
    margin-top: 50px;
  }

  /* Reset transform if we use zoom */
  .mobile-board-scale {
    transform: none;
  }"""
)

with open("src/index.css", "w") as f:
    f.write(content)
