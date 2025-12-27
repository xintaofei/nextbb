"use client"

import { useState } from "react"
import { UserBadge } from "./user-badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

export type BadgeItem = {
  id: string
  name: string
  icon: string
  level: number
  bgColor: string | null
  textColor: string | null
  description?: string | null
}

export type UserBadgesDisplayProps = {
  badges: BadgeItem[]
  maxDisplay?: number
  size?: "sm" | "md" | "lg"
}

export function UserBadgesDisplay({
  badges,
  maxDisplay = 3,
  size = "sm",
}: UserBadgesDisplayProps) {
  const [open, setOpen] = useState(false)

  if (!badges || badges.length === 0) {
    return null
  }

  const displayBadges = badges.slice(0, maxDisplay)
  const remainingCount = badges.length - maxDisplay

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {displayBadges.map((badge) => (
        <UserBadge
          key={badge.id}
          icon={badge.icon}
          name={badge.name}
          bgColor={badge.bgColor}
          textColor={badge.textColor}
          level={badge.level}
          size={size}
          description={badge.description}
        />
      ))}
      {remainingCount > 0 && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Badge
              variant="outline"
              className="text-xs px-2 py-0.5 cursor-pointer hover:bg-accent transition-colors"
            >
              +{remainingCount}
            </Badge>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-3">
              <h4 className="font-medium text-sm">所有徽章</h4>
              <div className="flex flex-wrap gap-1.5">
                {badges.map((badge) => (
                  <UserBadge
                    key={badge.id}
                    icon={badge.icon}
                    name={badge.name}
                    bgColor={badge.bgColor}
                    textColor={badge.textColor}
                    level={badge.level}
                    size={size}
                    description={badge.description}
                  />
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
