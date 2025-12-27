"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export type UserBadgeProps = {
  icon: string
  name: string
  bgColor?: string | null
  textColor?: string | null
  level?: number
  className?: string
  size?: "sm" | "md" | "lg"
}

export function UserBadge({
  icon,
  name,
  bgColor,
  textColor,
  level = 1,
  className,
  size = "md",
}: UserBadgeProps) {
  const sizeClasses = {
    sm: "text-xs px-1.5 py-0.5",
    md: "text-sm px-2 py-1",
    lg: "text-base px-3 py-1.5",
  }

  const levelClasses = {
    1: "",
    2: "border-2",
    3: "border-2 shadow-sm",
    4: "border-2 shadow-md ring-1 ring-offset-1",
    5: "border-2 shadow-lg ring-2 ring-offset-2 animate-pulse",
  }

  return (
    <Badge
      variant="secondary"
      className={cn(
        sizeClasses[size],
        levelClasses[level as keyof typeof levelClasses] || "",
        className
      )}
      style={{
        backgroundColor: bgColor || undefined,
        color: textColor || undefined,
        borderColor: bgColor ? `${bgColor}80` : undefined,
      }}
    >
      {icon} {name}
    </Badge>
  )
}
