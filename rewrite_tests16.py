import re

with open('src/logic/gameLogic.test.ts', 'r') as f:
    content = f.read()

content = content.replace("describe('sellHouse', () => {", """describe('sellHouse', () => {
  test('should successfully sell a house and refund correct amount based on house count', () => {
    // Current houses: 2, housePrice: 50
    // Refund: (50 * Math.pow(2, 2 - 1)) / 2 = (50 * 2) / 2 = 50
    const player = createMockPlayer({ properties: [1], balance: 500 })
    const tile = createMockTile({ id: 1, housePrice: 50, houses: 2 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile])

    const newState = sellHouse(state, 1)

    assert.notStrictEqual(newState, state)
    // Decreased house count
    assert.strictEqual(newState.tiles[1].houses, 1)
    // Refund = 50, New balance = 500 + 50 = 550
    assert.strictEqual(newState.players[0].balance, 550)
  })

  test('should successfully sell a house and refund for higher house level', () => {
    // Current houses: 3, housePrice: 50
    // Refund: (50 * Math.pow(2, 3 - 1)) / 2 = (50 * 4) / 2 = 100
    const player = createMockPlayer({ properties: [1], balance: 500 })
    const tile = createMockTile({ id: 1, housePrice: 50, houses: 3 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile])

    const newState = sellHouse(state, 1)

    assert.notStrictEqual(newState, state)
    // Decreased house count
    assert.strictEqual(newState.tiles[1].houses, 2)
    // Refund = 100, New balance = 500 + 100 = 600
    assert.strictEqual(newState.players[0].balance, 600)
  })
""")

with open('src/logic/gameLogic.test.ts', 'w') as f:
    f.write(content)
