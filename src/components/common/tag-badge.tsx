"use client"

import { useRouter, useParams } from "next/navigation"
import { useTransition } from "react"
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
  const router = useRouter()
  const params = useParams<{ locale?: string }>()
  const [, startTransition] = useTransition()

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }

    if (id) {
      // 构建标签路由
      const newPath = buildRoutePath({ tagId: id }, params.locale)
      startTransition(() => {
        router.push(newPath)
      })
    }
  }

  return (
    <Badge
      variant="outline"
      className={cn(
        (onClick || id) && "cursor-pointer",
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
      onClick={onClick || id ? handleClick : undefined}
      title={description || undefined}
    >
      {icon} {name}
    </Badge>
  )
}
