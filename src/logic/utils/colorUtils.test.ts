import { test, describe } from 'node:test'
import assert from 'node:assert'
import { getContrastColor } from './colorUtils.ts'

describe('getContrastColor', () => {
  test('should return black for white hex (6 digits with hash)', () => {
    assert.strictEqual(getContrastColor('#ffffff'), '#000000')
  })

  test('should return white for black hex (6 digits without hash)', () => {
    assert.strictEqual(getContrastColor('000000'), '#ffffff')
  })

  test('should return black for white hex (3 digits with hash)', () => {
    assert.strictEqual(getContrastColor('#fff'), '#000000')
  })

  test('should return white for black hex (3 digits without hash)', () => {
    assert.strictEqual(getContrastColor('000'), '#ffffff')
  })

  test('should return white for dark blue (#1034A6)', () => {
    assert.strictEqual(getContrastColor('#1034A6'), '#ffffff')
  })

  test('should return black for light gray (#F0F0F0)', () => {
    assert.strictEqual(getContrastColor('#F0F0F0'), '#000000')
  })

  test('should handle edge case color at threshold (yiq = 128)', () => {
    // #808080 (128, 128, 128) -> (128 * 299 + 128 * 587 + 128 * 114) / 1000 = 128
    assert.strictEqual(getContrastColor('#808080'), '#000000')
  })

  test('should handle color just below threshold (yiq = 127)', () => {
    // #7f7f7f (127, 127, 127) -> 127
    assert.strictEqual(getContrastColor('#7f7f7f'), '#ffffff')
  })
})
