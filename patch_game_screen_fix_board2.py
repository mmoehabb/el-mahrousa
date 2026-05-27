import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

content = content.replace('className="w-full h-full flex items-center justify-center overflow-hidden origin-center lg:origin-top mobile-board-scale"',
                          'className="flex justify-center origin-top mobile-board-scale pt-8"')

with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content)
