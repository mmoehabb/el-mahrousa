/**
 * Safely retrieves and parses an item from localStorage.
 * If the item is missing, invalid JSON, or fails validation, it returns the default value.
 */
export function getStoredItem<T>(
  key: string,
  defaultValue: T,
  validator?: (val: any) => val is T,
): T {
  const stored = localStorage.getItem(key)
  if (!stored) return defaultValue

  try {
    const parsed = JSON.parse(stored)
    if (validator && !validator(parsed)) {
      return defaultValue
    }
    return parsed as T
  } catch {
    return defaultValue
  }
}
