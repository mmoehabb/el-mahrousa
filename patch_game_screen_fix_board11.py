import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

content = content.replace(
"""              style={{
                transform: typeof window !== 'undefined' && window.innerWidth < 1024 ? `scale(${scale})` : undefined,
              }}""",
"""              style={{
                transform: scale !== 1 ? `scale(${scale})` : undefined,
              }}"""
)

with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content)
