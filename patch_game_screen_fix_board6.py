import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

content = content.replace('className="mobile-board-scale pt-8 flex justify-center"',
                            'className="mobile-board-scale"')

content = content.replace('className="w-full h-full flex-1 max-w-full overflow-hidden relative z-10 lg:origin-top lg:flex lg:justify-center lg:items-center mobile-board-wrapper"',
                          'className="w-full h-full flex-1 max-w-full relative z-10 lg:origin-top lg:flex lg:justify-center lg:items-center mobile-board-wrapper"')

with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content)
