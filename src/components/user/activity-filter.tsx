"use client"

import { cn, encodeUsername } from "@/lib/utils"
import { useTranslations } from "next-intl"
import type { ActivityType } from "@/types/activity"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import {
  FileText,
  MessageSquare,
  ThumbsUp,
  Bookmark,
  Activity,
} from "lucide-react"

type ActivityFilterProps = {
  activeFilter: ActivityType
  hasPermission: boolean
  username: string
  isLoading?: boolean
}

type FilterOption = {
  value: ActivityType
  label: string
  icon: React.ReactNode
  requiresPermission: boolean
}

export function ActivityFilter({
  activeFilter,
  hasPermission,
  username,
  isLoading = false,
}: ActivityFilterProps) {
  const t = useTranslations("User.profile.activity.filter")
  const encodedUsername = encodeUsername(username)

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
    <div className="flex flex-wrap gap-2 justify-center">
      {filterOptions.map((option) => {
        const isDisabled =
          isLoading || (option.requiresPermission && !hasPermission)
        const isActive = activeFilter === option.value
        const href =
          option.value === "all"
            ? `/u/${encodedUsername}/activity`
            : `/u/${encodedUsername}/activity/${option.value}`

        return (
          <Badge
            key={option.value}
            variant={isLoading ? "outline" : isActive ? "default" : "outline"}
            className={cn(
              "transition-all",
              !isLoading && !isDisabled && "cursor-pointer",
              isDisabled && "opacity-50 cursor-not-allowed"
            )}
            asChild={!isDisabled}
          >
            {isDisabled ? (
              <span className="flex items-center gap-1">
                {option.icon}
                <span className="max-sm:hidden">{option.label}</span>
              </span>
            ) : (
              <Link href={href} className="flex items-center gap-1">
                {option.icon}
                <span className="max-sm:hidden">{option.label}</span>
              </Link>
            )}
          </Badge>
        )
      })}
    </div>
  )
}
