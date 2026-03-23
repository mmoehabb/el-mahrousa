import re

with open('src/logic/gameLogic.test.ts', 'r') as f:
    content = f.read()

content = content.replace("describe('sellHouse', () => {\n  // We'll write the tests in the next steps\n})", """describe('sellHouse', () => {
  test('should return original state if turnPhase is not ROLL', () => {
    const player = createMockPlayer({ properties: [1] })
    const tile = createMockTile({ id: 1, housePrice: 50, houses: 1 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile], { turnPhase: 'ACTION' })

    const newState = sellHouse(state, 1)

    assert.strictEqual(newState, state)
  })

  test('should return original state if player does not own the tile', () => {
    const player = createMockPlayer({ properties: [] })
    const tile = createMockTile({ id: 1, housePrice: 50, houses: 1 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile])

    const newState = sellHouse(state, 1)

    assert.strictEqual(newState, state)
  })

  test('should return original state if tile has no housePrice', () => {
    const player = createMockPlayer({ properties: [1] })
    // Missing housePrice
    const tile = createMockTile({ id: 1, housePrice: undefined, houses: 1 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile])

    const newState = sellHouse(state, 1)

    assert.strictEqual(newState, state)
  })

  test('should return original state if tile has 0 houses', () => {
    const player = createMockPlayer({ properties: [1] })
    const tile = createMockTile({ id: 1, housePrice: 50, houses: 0 })
    const state = createMockState([player], [createMockTile({ id: 0 }), tile])

    const newState = sellHouse(state, 1)

    assert.strictEqual(newState, state)
  })
})""")

with open('src/logic/gameLogic.test.ts', 'w') as f:
    f.write(content)
