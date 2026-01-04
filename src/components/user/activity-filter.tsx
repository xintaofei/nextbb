"use client"

import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"
import type { ActivityType } from "@/types/activity"
import {
  FileText,
  MessageSquare,
  ThumbsUp,
  Bookmark,
  Activity,
} from "lucide-react"

type ActivityFilterProps = {
  activeFilter: ActivityType
  onFilterChange: (filter: ActivityType) => void
  hasPermission: boolean
}

type FilterOption = {
  value: ActivityType
  label: string
  icon: React.ReactNode
  requiresPermission: boolean
}

export function ActivityFilter({
  activeFilter,
  onFilterChange,
  hasPermission,
}: ActivityFilterProps) {
  const t = useTranslations("User.profile.activity.filter")

  const filterOptions: FilterOption[] = [
    {
      value: "all",
      label: t("all"),
      icon: <Activity className="h-4 w-4" />,
      requiresPermission: false,
    },
    {
      value: "topics",
      label: t("topics"),
      icon: <FileText className="h-4 w-4" />,
      requiresPermission: false,
    },
    {
      value: "posts",
      label: t("posts"),
      icon: <MessageSquare className="h-4 w-4" />,
      requiresPermission: false,
    },
    {
      value: "likes",
      label: t("likes"),
      icon: <ThumbsUp className="h-4 w-4" />,
      requiresPermission: true,
    },
    {
      value: "bookmarks",
      label: t("bookmarks"),
      icon: <Bookmark className="h-4 w-4" />,
      requiresPermission: true,
    },
  ]

  return (
    <div className="w-full border-b bg-background">
      <div className="max-w-5xl mx-auto px-4">
        <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
          {filterOptions.map((option) => {
            const isDisabled = option.requiresPermission && !hasPermission
            const isActive = activeFilter === option.value

            return (
              <button
                key={option.value}
                onClick={() => !isDisabled && onFilterChange(option.value)}
                disabled={isDisabled}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap border-b-2",
                  isActive
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                {option.icon}
                <span className="max-sm:hidden">{option.label}</span>
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
