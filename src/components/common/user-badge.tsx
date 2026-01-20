"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Highlighter } from "@/components/ui/highlighter"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export type UserBadgeProps = {
  icon: string
  name: string
  bgColor?: string | null
  textColor?: string | null
  level?: number
  className?: string
  size?: "xs" | "sm" | "md" | "lg"
  description?: string | null
}

export function UserBadge({
  icon,
  name,
  bgColor,
  textColor,
  level = 1,
  className,
  size = "md",
  description,
}: UserBadgeProps) {
  const t = useTranslations("AdminBadges")
  const badge = (
    <span>
      {" "}
      <Highlighter action="highlight" color={bgColor || undefined}>
        <div className={cn("flex items-center gap-1", className)}>
          <span>{icon}</span>
          <span
            className={"text-" + size}
            style={{ color: textColor || undefined }}
          >
            {name}
          </span>
        </div>
      </Highlighter>{" "}
    </span>
  )

  if (description) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{badge}</TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs">
            {"(" + t("filter.levelOptions." + level) + ") " + description}
          </p>
        </TooltipContent>
      </Tooltip>
    )
  }

  return badge
}
