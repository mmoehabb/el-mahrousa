import re

with open("src/index.css", "r") as f:
    content = f.read()

# The zoom approach is breaking because `zoom: 0.29` makes the layout size very small.
# 1280 * 0.29 = ~371px. But it also affects descendants.
# In webkit, zoom works properly on absolute elements, but it's tricky.
# Alternatively, using pure CSS `transform` on an absolutely positioned element inside a fixed ratio container is much safer.
# Let's revert back to `transform`, but properly structure the container:
# We need a wrapper that's 100vw wide, and its height scales.
# The container `1280px` wide inside `100vw` wide with `scale(100vw/1280)` will visually be 100vw, but will still occupy 1280px layout size unless wrapped.
# BUT if we use `position: absolute; top: 0; left: 50%; transform: translateX(-50%) scale(...); transform-origin: top center;` it won't affect layout.

# Let's fix GameScreen and index.css

content = content.replace(
"""  .mobile-board-scale {
    /* Using zoom so layout size shrinks, solving centering and clipping issues */
    zoom: calc(min(100vw, 100dvh) / 1280);
    transform-origin: center center;
    margin-top: calc(min(100vw, 100dvh) * 0.1); /* Add a bit of space on top */
  }

  /* Fallback for Firefox which doesn't support zoom well */
  @-moz-document url-prefix() {
    .mobile-board-scale {
      transform: scale(calc(min(100vw, 100dvh) / 1280));
      transform-origin: top center;
      margin-top: 0;
    }
    .mobile-board-wrapper {
       height: calc(min(100vw, 100dvh));
       width: 100%;
       display: flex;
       justify-content: center;
    }
  }""",
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
  }"""
)

with open("src/index.css", "w") as f:
    f.write(content)
