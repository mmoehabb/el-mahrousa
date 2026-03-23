import re

with open('src/logic/gameLogic.test.ts', 'r') as f:
    content = f.read()

# Fix the duplicate declaration error by changing const p1 to something else if needed,
# or just changing the assertion lookups from `const p1 = newState...` to `const newP1 = newState...`
content = content.replace("const p1 = newState.players.find((p) => p.id === 'p1')!", "const newP1 = newState.players.find((p) => p.id === 'p1')!")
content = content.replace("const p2 = newState.players.find((p) => p.id === 'p2')!", "const newP2 = newState.players.find((p) => p.id === 'p2')!")

# And fixing the references
content = re.sub(r"assert\.strictEqual\(p1\.balance", "assert.strictEqual(newP1.balance", content)
content = re.sub(r"assert\.deepStrictEqual\(p1\.properties", "assert.deepStrictEqual(newP1.properties", content)

content = re.sub(r"assert\.strictEqual\(p2\.balance", "assert.strictEqual(newP2.balance", content)
content = re.sub(r"assert\.deepStrictEqual\(p2\.properties", "assert.deepStrictEqual(newP2.properties", content)

with open('src/logic/gameLogic.test.ts', 'w') as f:
    f.write(content)
