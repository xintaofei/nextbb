"use client"

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Highlighter } from "@/components/ui/highlighter"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import { useThemeColor } from "@/lib/hooks/use-theme-color"

export type UserBadgeProps = {
  icon: string
  name: string
  bgColor?: string | null
  textColor?: string | null
  darkBgColor?: string | null
  darkTextColor?: string | null
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
  darkBgColor,
  darkTextColor,
  level = 1,
  className,
  size = "md",
  description,
}: UserBadgeProps) {
  const t = useTranslations("AdminBadges")
  const { bgColor: currentBgColor, themeStyle } = useThemeColor({
    bgColor,
    textColor,
    darkBgColor,
    darkTextColor,
  })

  const badge = (
    <span style={themeStyle}>
      {" "}
      <Highlighter action="highlight" color={currentBgColor || "#ffd1dc"}>
        <div
          className={cn(
            "flex items-center gap-1",
            "text-(--text-light) dark:text-(--text-dark)",
            className
          )}
        >
          <span>{icon}</span>
          <span className={"text-" + size}>{name}</span>
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
