import re

with open("src/index.css", "r") as f:
    content = f.read()

# Let's verify what happen when scale is applied.
# If scale is applied to a flex child with `w-full h-full`, it might get confused.
# It is better to use `zoom` or use `transform` on a fixed size wrapper.

content = content.replace("transform: scale(calc(min(100vw, 100dvh) / 1280));", "transform: scale(calc(min(100vw, 100dvh) / 1280));\n    width: 1280px;\n    height: 1280px;\n    flex-shrink: 0;")

with open("src/index.css", "w") as f:
    f.write(content)
