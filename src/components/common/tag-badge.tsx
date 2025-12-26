"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type TagBadgeProps = {
  icon: string
  name: string
  bgColor?: string | null
  textColor?: string | null
  className?: string
  active?: boolean
  onClick?: () => void
}

export function TagBadge({
  icon,
  name,
  bgColor,
  textColor,
  className,
  active,
  onClick,
}: TagBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        onClick && "cursor-pointer",
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
    >
      {icon} {name}
    </Badge>
  )
}
