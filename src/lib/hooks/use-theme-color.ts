"use client"

import { useTheme } from "next-themes"

type ThemeColorOptions = {
  bgColor?: string | null
  textColor?: string | null
  darkBgColor?: string | null
  darkTextColor?: string | null
}

export function useThemeColor({
  bgColor,
  textColor,
  darkBgColor,
  darkTextColor,
}: ThemeColorOptions): {
  bgColor: string | undefined
  textColor: string | undefined
} {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  return {
    bgColor: (isDark && darkBgColor ? darkBgColor : bgColor) || undefined,
    textColor:
      (isDark && darkTextColor ? darkTextColor : textColor) || undefined,
  }
}
