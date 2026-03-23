import re

with open('src/logic/gameLogic.test.ts', 'r') as f:
    content = f.read()

# Add sellHouse to imports from gameLogic
content = content.replace(
    "buyHouse,",
    "buyHouse,\n  sellHouse,"
)

with open('src/logic/gameLogic.test.ts', 'w') as f:
    f.write(content)
