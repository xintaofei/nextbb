"use client"

import { useRouter, useParams } from "next/navigation"
import { useTransition } from "react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { buildRoutePath } from "@/lib/route-utils"

export type CategoryBadgeProps = {
  id?: string
  icon?: string
  name: string
  description?: string | null
  bgColor?: string | null
  textColor?: string | null
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
  className,
  onClick,
}: CategoryBadgeProps) {
  const router = useRouter()
  const params = useParams<{ locale?: string }>()
  const [, startTransition] = useTransition()

  const handleClick = () => {
    if (onClick) {
      onClick()
      return
    }

    if (id) {
      // 构建分类路由
      const newPath = buildRoutePath({ categoryId: id }, params.locale)
      startTransition(() => {
        router.push(newPath)
      })
    }
  }

  return (
    <Badge
      variant="secondary"
      className={cn(id && "cursor-pointer", className)}
      style={{
        backgroundColor: bgColor || undefined,
        color: textColor || undefined,
        borderColor: bgColor ? `${bgColor}40` : undefined,
      }}
      onClick={id ? handleClick : undefined}
      title={description || undefined}
    >
      {icon ?? "📁"} {name}
    </Badge>
  )
}
