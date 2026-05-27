import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

# Let's fix GameScreen so that it definitely adapts to screen height gracefully in all situations.
# The user's goal was to zoom the board OUT so it fits entirely on the screen.
# My last attempt:
# `const availableHeight = window.innerHeight - (window.innerWidth < 1024 ? 130 : 50);`
# `const minDimension = Math.min(window.innerWidth, availableHeight);`
# `const targetSize = minDimension * 0.95;`
# `setScale(targetSize / 1280);`

# This is absolutely correct logic for a square board (1280x1280).
# Let's check what the GameScreen component is doing with this scale now.
# `<div className="w-full h-full flex-1 max-w-full overflow-hidden relative z-10">`
#   `<div className="absolute left-1/2 top-1/2 origin-top-left"`
#   `style={{ transform: scale !== 1 ? \`scale(${scale}) translate(-50%, -50%)\` : 'translate(-50%, -50%)', }}`

# Wait, `scale(${scale}) translate(-50%, -50%)` translates AFTER scaling, which scales the translation vector itself.
# To perfectly center, it MUST be `translate(-50%, -50%) scale(${scale})` because transforms are applied from RIGHT to LEFT!
# NO, in CSS `transform: translate(...) scale(...)` applies translate FIRST, then scale.
# Wait, let's look at the MDN documentation for CSS transform.
# "The transform functions are multiplied in order from left to right, meaning that composite transforms are effectively applied in order from right to left."
# Let's verify this in the browser if possible. Or just use `left: 50%; top: 50%;` and standard flexbox alignment to be 100% safe.

# Why not just use `zoom` again? Wait, Firefox Android DOES support zoom since version 126.
# Why not use `aspect-ratio` container?
# The board is currently `min-w-[1200px] min-h-[1200px]`.
# If we simply apply `transform: scale(...)` with `transformOrigin: 'center center'` on a Flex container, it WILL center perfectly!
# The only issue we had before was that the flex container STILL had a layout size of 1240x1240, which pushed other flex items or caused scrollbars.
# BUT we have `overflow-hidden` on the parent, so scrollbars won't appear.
# And we have `absolute` positioning on the top controls, so they don't get pushed!
# Let's just use `transformOrigin: 'center center'` and flexbox centering!

content = content.replace(
"""          <div className="w-full h-full flex-1 max-w-full overflow-hidden relative z-10">
            <div
              className="absolute left-1/2 top-1/2 origin-top-left"
              style={{
                // We use origin-top-left and translate by -50% * 1/scale to perfectly center it
                transform: scale !== 1 ? `scale(${scale}) translate(-50%, -50%)` : 'translate(-50%, -50%)',
              }}
            >""",
"""          <div className="w-full h-full flex-1 max-w-full overflow-hidden relative z-10 flex justify-center items-center">
            <div
              style={{
                transform: scale !== 1 ? `scale(${scale})` : undefined,
                transformOrigin: 'center center',
              }}
            >"""
)

with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content)
