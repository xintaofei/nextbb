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
  const { themeStyle } = useThemeColor({
    bgColor: bgColor || "var(--bg-muted)",
    textColor,
    darkBgColor,
    darkTextColor,
  })

  // 如果有自定义 onClick，使用按钮模式
  if (onClick) {
    return (
      <Badge
        variant="secondary"
        className={cn(
          "cursor-pointer",
          "bg-(--bg-light) dark:bg-(--bg-dark) text-(--text-light) dark:text-(--text-dark) border-(--text-light)/10 dark:border-(--text-dark)/10",
          className
        )}
        style={themeStyle}
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
          className={cn(
            "cursor-pointer",
            "bg-(--bg-light) dark:bg-(--bg-dark) text-(--text-light) dark:text-(--text-dark) border-(--text-light)/10 dark:border-(--text-dark)/10",
            className
          )}
          style={themeStyle}
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
      className={cn(
        "bg-(--bg-light) dark:bg-(--bg-dark) text-(--text-light) dark:text-(--text-dark) border-(--text-light)/10 dark:border-(--text-dark)/10",
        className
      )}
      style={themeStyle}
      title={description || undefined}
    >
      {icon ?? "📁"} {name}
    </Badge>
  )
}
