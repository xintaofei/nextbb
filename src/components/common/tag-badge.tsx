"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { buildRoutePath } from "@/lib/route-utils"
import { useThemeColor } from "@/lib/hooks/use-theme-color"

export type TagBadgeProps = {
  id?: string
  icon: string
  name: string
  description?: string | null
  bgColor?: string | null
  textColor?: string | null
  darkBgColor?: string | null
  darkTextColor?: string | null
  className?: string
  active?: boolean
  onClick?: () => void
}

export function TagBadge({
  id,
  icon,
  name,
  description,
  bgColor,
  textColor,
  darkBgColor,
  darkTextColor,
  className,
  active,
  onClick,
}: TagBadgeProps) {
  const themeColor = useThemeColor({
    bgColor,
    textColor,
    darkBgColor,
    darkTextColor,
  })

  const colorStyle = !active
    ? {
        backgroundColor: themeColor.bgColor,
        color: themeColor.textColor,
        borderColor: themeColor.bgColor
          ? `${themeColor.bgColor}40`
          : themeColor.textColor
            ? `${themeColor.textColor}40`
            : undefined,
      }
    : undefined
  // 如果有自定义 onClick，使用按钮模式
  if (onClick) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "cursor-pointer",
          active && "bg-primary/10 text-primary border-primary/20",
          className
        )}
        style={colorStyle}
        onClick={onClick}
        title={description || undefined}
      >
        {icon} {name}
      </Badge>
    )
  }

  // 如果有 id，使用 Link 模式（SEO 友好）
  if (id) {
    const href = buildRoutePath({ tagId: id })
    return (
      <Link href={href}>
        <Badge
          variant="outline"
          className={cn(
            "cursor-pointer",
            active && "bg-primary/10 text-primary border-primary/20",
            className
          )}
          style={colorStyle}
          title={description || undefined}
        >
          {icon} {name}
        </Badge>
      </Link>
    )
  }

  // 无交互的纯展示模式
  return (
    <Badge
      variant="outline"
      className={cn(
        active && "bg-primary/10 text-primary border-primary/20",
        className
      )}
      style={colorStyle}
      title={description || undefined}
    >
      {icon} {name}
    </Badge>
  )
}
