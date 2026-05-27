import re

with open("src/index.css", "r") as f:
    content = f.read()

# Make sure `.mobile-board-scale` centres properly without overflowing the top off-screen.
content = content.replace("transform: scale(calc(min(100vw, 100dvh) / 1280));",
                          "transform: scale(calc(min(100vw, 100dvh) / 1280));\n    transform-origin: top center;")

with open("src/index.css", "w") as f:
    f.write(content)
