import re

with open("src/index.css", "r") as f:
    content = f.read()

# Make the wrapper 100% of the screen height if needed, but flex should be ok.
# Maybe `.mobile-board-wrapper` height should be explicitly restricted, but the issue is the board itself
# is `1200px` minimum. So if it is `1200px` but we scale it by `100vw / 1280`, it visually fits,
# but it occupies 1280px in layout! Wait, transform doesn't change layout size.
# Since we didn't specify width/height on the transformed element, its layout size is 1200px x 1200px.
# This causes the container to have 1200px width/height and scrollbars appear.
# Wait, `overflow-hidden` is on the parent. So it shouldn't scroll, but the alignment might be wrong.
# If `origin-top center` is used, the 1200px box is scaled, and its *center* is scaled down, leaving huge margins.

# Let's fix this using CSS zoom, which does change layout size, or absolute centering!
# `zoom` is perfect for this: `zoom: calc(min(100vw, 100dvh) / 1280);`

content = content.replace(
"""  .mobile-board-scale {
    transform: scale(calc(min(100vw, 100dvh) / 1280));
    transform-origin: top center;
  }
  .mobile-board-wrapper {
     height: calc(min(100vw, 100dvh));
     width: 100%;
     display: flex;
     justify-content: center;
  }""",
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
  }"""
)

with open("src/index.css", "w") as f:
    f.write(content)
