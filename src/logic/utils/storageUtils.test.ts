import { test, describe, beforeEach } from 'node:test'
import assert from 'node:assert'
import { getStoredItem } from './storageUtils.ts'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString()
    },
    clear: () => {
      store = {}
    },
  }
})()

Object.defineProperty(global, 'localStorage', {
  value: localStorageMock,
})

describe('getStoredItem', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  test('should return default value when item is missing', () => {
    const result = getStoredItem('missing', 'default')
    assert.strictEqual(result, 'default')
  })

  test('should return parsed value when item exists and is valid JSON', () => {
    localStorage.setItem('key', JSON.stringify('stored'))
    const result = getStoredItem('key', 'default')
    assert.strictEqual(result, 'stored')
  })

  test('should return default value when JSON is invalid', () => {
    localStorage.setItem('key', 'invalid-json')
    const result = getStoredItem('key', 'default')
    assert.strictEqual(result, 'default')
  })

  test('should return parsed value when validator passes', () => {
    localStorage.setItem('key', JSON.stringify(['a', 'b']))
    const result = getStoredItem(
      'key',
      [],
      (v): v is string[] => Array.isArray(v) && v.every((s) => typeof s === 'string'),
    )
    assert.deepStrictEqual(result, ['a', 'b'])
  })

  test('should return default value when validator fails', () => {
    localStorage.setItem('key', JSON.stringify([1, 2]))
    const result = getStoredItem(
      'key',
      [],
      (v): v is string[] => Array.isArray(v) && v.every((s) => typeof s === 'string'),
    )
    assert.deepStrictEqual(result, [])
  })

  test('should handle primitive types correctly', () => {
    localStorage.setItem('volume', JSON.stringify(0.8))
    const result = getStoredItem('volume', 0.5, (v): v is number => typeof v === 'number')
    assert.strictEqual(result, 0.8)

    localStorage.setItem('enabled', JSON.stringify(false))
    const result2 = getStoredItem('enabled', true, (v): v is boolean => typeof v === 'boolean')
    assert.strictEqual(result2, false)
  })
})
