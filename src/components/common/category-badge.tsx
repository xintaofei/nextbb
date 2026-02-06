"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { buildRoutePath } from "@/lib/route-utils"
import { useThemeColor } from "@/lib/hooks/use-theme-color"

export type CategoryBadgeProps = {
  id?: string
  icon?: string
  name: string
  description?: string | null
  bgColor?: string | null
  textColor?: string | null
  darkBgColor?: string | null
  darkTextColor?: string | null
  className?: string
  onClick?: () => void
}

export function CategoryBadge({
  id,
  icon,
  name,
  description,
  bgColor,
  textColor,
  darkBgColor,
  darkTextColor,
  className,
  onClick,
}: CategoryBadgeProps) {
  const themeColor = useThemeColor({
    bgColor,
    textColor,
    darkBgColor,
    darkTextColor,
  })
  const colorStyle = {
    backgroundColor: themeColor.bgColor,
    color: themeColor.textColor,
    borderColor: themeColor.bgColor ? `${themeColor.bgColor}40` : undefined,
  }

  // 如果有自定义 onClick，使用按钮模式
  if (onClick) {
    return (
      <Badge
        variant="secondary"
        className={cn("cursor-pointer", className)}
        style={colorStyle}
        onClick={onClick}
        title={description || undefined}
      >
        {icon ?? "📁"} {name}
      </Badge>
    )
  }

  // 如果有 id，使用 Link 模式（SEO 友好）
  if (id) {
    const href = buildRoutePath({ categoryId: id })
    return (
      <Link href={href}>
        <Badge
          variant="secondary"
          className={cn("cursor-pointer", className)}
          style={colorStyle}
          title={description || undefined}
        >
          {icon ?? "📁"} {name}
        </Badge>
      </Link>
    )
  }

  // 无交互的纯展示模式
  return (
    <Badge
      variant="secondary"
      className={className}
      style={colorStyle}
      title={description || undefined}
    >
      {icon ?? "📁"} {name}
    </Badge>
  )
}
