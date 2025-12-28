"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { buildRoutePath } from "@/lib/route-utils"

export type TagBadgeProps = {
  id?: string
  icon: string
  name: string
  description?: string | null
  bgColor?: string | null
  textColor?: string | null
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
  className,
  active,
  onClick,
}: TagBadgeProps) {
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
        style={
          !active
            ? {
                backgroundColor: bgColor || undefined,
                color: textColor || undefined,
                borderColor: bgColor
                  ? `${bgColor}40`
                  : textColor
                    ? `${textColor}40`
                    : undefined,
              }
            : undefined
        }
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
          style={
            !active
              ? {
                  backgroundColor: bgColor || undefined,
                  color: textColor || undefined,
                  borderColor: bgColor
                    ? `${bgColor}40`
                    : textColor
                      ? `${textColor}40`
                      : undefined,
                }
              : undefined
          }
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
      style={
        !active
          ? {
              backgroundColor: bgColor || undefined,
              color: textColor || undefined,
              borderColor: bgColor
                ? `${bgColor}40`
                : textColor
                  ? `${textColor}40`
                  : undefined,
            }
          : undefined
      }
      title={description || undefined}
    >
      {icon} {name}
    </Badge>
  )
}
