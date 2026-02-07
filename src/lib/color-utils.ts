/**
 * 颜色转换工具函数
 * 用于在浅色和深色主题之间自动转换颜色
 */

/**
 * 将 HEX 颜色转换为 HSL
 */
function hexToHsl(hex: string): { h: number; s: number; l: number } {
  // 移除 # 符号
  const cleanHex = hex.replace("#", "")

  // 转换为 RGB
  const r = parseInt(cleanHex.substring(0, 2), 16) / 255
  const g = parseInt(cleanHex.substring(2, 4), 16) / 255
  const b = parseInt(cleanHex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

/**
 * 将 HSL 转换为 HEX 颜色
 */
function hslToHex(h: number, s: number, l: number): string {
  const hDecimal = h / 360
  const sDecimal = s / 100
  const lDecimal = l / 100

  let r: number, g: number, b: number

  if (s === 0) {
    r = g = b = lDecimal
  } else {
    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1
      if (t > 1) t -= 1
      if (t < 1 / 6) return p + (q - p) * 6 * t
      if (t < 1 / 2) return q
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
      return p
    }

    const q =
      lDecimal < 0.5
        ? lDecimal * (1 + sDecimal)
        : lDecimal + sDecimal - lDecimal * sDecimal
    const p = 2 * lDecimal - q

    r = hue2rgb(p, q, hDecimal + 1 / 3)
    g = hue2rgb(p, q, hDecimal)
    b = hue2rgb(p, q, hDecimal - 1 / 3)
  }

  const toHex = (x: number): string => {
    const hex = Math.round(x * 255).toString(16)
    return hex.length === 1 ? "0" + hex : hex
  }

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * 将浅色模式的背景色转换为深色模式
 * 策略：降低亮度，使其适合深色主题
 */
export function convertLightBgToDark(lightBgColor: string): string {
  const hsl = hexToHsl(lightBgColor)

  // 将亮度降低到 15-30% 之间
  // 如果原色很亮（L > 70），降到 20-25%
  // 如果原色中等（L 40-70），降到 18-22%
  // 如果原色较暗（L < 40），降到 15-18%
  let newL: number
  if (hsl.l > 70) {
    newL = 20 + (hsl.l - 70) * 0.15
  } else if (hsl.l > 40) {
    newL = 18 + (hsl.l - 40) * 0.1
  } else {
    newL = 15 + hsl.l * 0.05
  }

  // 稍微提高饱和度，使颜色更鲜明
  const newS = Math.min(100, hsl.s * 1.1)

  return hslToHex(hsl.h, newS, Math.round(newL))
}

/**
 * 将浅色模式的文字色转换为深色模式
 * 策略：提高亮度，确保在深色背景上可读
 */
export function convertLightTextToDark(lightTextColor: string): string {
  const hsl = hexToHsl(lightTextColor)

  // 如果原文字色较暗（适合浅色背景），则提高亮度
  // 如果原文字色已经较亮，稍微调整即可
  let newL: number
  if (hsl.l < 50) {
    // 暗色文字 → 亮色文字（85-95%）
    newL = 85 + (50 - hsl.l) * 0.2
  } else {
    // 已经是亮色，保持或稍微调整
    newL = Math.max(85, hsl.l)
  }

  // 降低饱和度，使文字更柔和
  const newS = hsl.s * 0.7

  return hslToHex(hsl.h, Math.round(newS), Math.round(newL))
}

/**
 * 将深色模式的背景色转换为浅色模式
 * 策略：提高亮度，使其适合浅色主题
 */
export function convertDarkBgToLight(darkBgColor: string): string {
  const hsl = hexToHsl(darkBgColor)

  // 将亮度提高到 85-95% 之间
  // 如果原色很暗（L < 30），提高到 90-95%
  // 如果原色中等（L 30-50），提高到 88-92%
  // 如果原色较亮（L > 50），提高到 85-90%
  let newL: number
  if (hsl.l < 30) {
    newL = 90 + (30 - hsl.l) * 0.15
  } else if (hsl.l < 50) {
    newL = 88 + (50 - hsl.l) * 0.1
  } else {
    newL = 85 + (100 - hsl.l) * 0.1
  }

  // 稍微降低饱和度，使颜色更柔和
  const newS = hsl.s * 0.85

  return hslToHex(hsl.h, Math.round(newS), Math.round(newL))
}

/**
 * 将深色模式的文字色转换为浅色模式
 * 策略：降低亮度，确保在浅色背景上可读
 */
export function convertDarkTextToLight(darkTextColor: string): string {
  const hsl = hexToHsl(darkTextColor)

  // 如果原文字色较亮（适合深色背景），则降低亮度
  // 如果原文字色已经较暗，稍微调整即可
  let newL: number
  if (hsl.l > 50) {
    // 亮色文字 → 暗色文字（15-30%）
    newL = 30 - (hsl.l - 50) * 0.3
  } else {
    // 已经是暗色，保持或稍微调整
    newL = Math.min(30, hsl.l)
  }

  // 提高饱和度，使文字更鲜明
  const newS = Math.min(100, hsl.s * 1.2)

  return hslToHex(hsl.h, Math.round(newS), Math.round(newL))
}
