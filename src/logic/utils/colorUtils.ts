export function getContrastColor(hexcolor: string): string {
  // Remove hash if present
  let color = hexcolor.replace('#', '')

  // Handle 3-character hex codes
  if (color.length === 3) {
    color = color
      .split('')
      .map((c) => c + c)
      .join('')
  }

  // Parse RGB components
  const r = parseInt(color.substr(0, 2), 16)
  const g = parseInt(color.substr(2, 2), 16)
  const b = parseInt(color.substr(4, 2), 16)

  // Calculate YIQ contrast ratio
  const yiq = (r * 299 + g * 587 + b * 114) / 1000

  // Return black for bright colors, white for dark colors
  return yiq >= 128 ? '#000000' : '#ffffff'
}
