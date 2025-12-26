"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type CategoryBadgeProps = {
  icon?: string
  name: string
  bgColor?: string | null
  textColor?: string | null
  className?: string
}

export function CategoryBadge({
  icon,
  name,
  bgColor,
  textColor,
  className,
}: CategoryBadgeProps) {
  return (
    <Badge
      variant="secondary"
      className={cn(className)}
      style={{
        backgroundColor: bgColor || undefined,
        color: textColor || undefined,
        borderColor: bgColor ? `${bgColor}40` : undefined,
      }}
    >
      {icon ?? "📁"} {name}
    </Badge>
  )
}
