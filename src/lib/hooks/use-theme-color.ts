"use client"

import { useTheme } from "next-themes"

type ThemeColorOptions = {
  bgColor?: string | null
  textColor?: string | null
  darkBgColor?: string | null
  darkTextColor?: string | null
}

/**
 * 混合策略：同时返回固定值和 CSS 变量
 * - bgColor: 固定值，给 rough-notation 等需要具体颜色值的库使用
 * - themeStyle: CSS 变量，给普通元素使用，完全无水合问题
 */
export function useThemeColor({
  bgColor,
  textColor,
  darkBgColor,
  darkTextColor,
}: ThemeColorOptions): {
  bgColor: string | undefined
  themeStyle: React.CSSProperties
} {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  return {
    bgColor: (isDark && darkBgColor ? darkBgColor : bgColor) || undefined,
    themeStyle: {
      "--bg-light": bgColor || "transparent",
      "--bg-dark": darkBgColor || bgColor || "transparent",
      "--text-light": textColor || "inherit",
      "--text-dark": darkTextColor || textColor || "inherit",
    } as React.CSSProperties,
  }
}
