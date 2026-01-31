"use client"

import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { useSession } from "next-auth/react"
import {
  useTopicSortFilter,
  type TabValue,
} from "@/hooks/use-topic-sort-filter"
import type { SortValue } from "@/lib/route-utils"

type TopicSortTabsProps = {
  className?: string
  onPendingChange?: (pending: boolean) => void
  onSortStart?: (next: SortValue) => void
}

type TabConfig = {
  value: TabValue
  labelKey: "latest" | "new" | "community" | "my"
  requiresAuth?: boolean
}

const TABS: TabConfig[] = [
  { value: "latest", labelKey: "latest" },
  { value: "new", labelKey: "new" },
  { value: "community", labelKey: "community" },
  { value: "my", labelKey: "my", requiresAuth: true },
]

export function TopicSortTabs({
  className,
  onPendingChange,
  onSortStart,
}: TopicSortTabsProps) {
  const tc = useTranslations("Common")

  const { data: session } = useSession()
  const isLoggedIn = session?.user?.id !== undefined

  const { selectedTab, getTabPath, setTab } = useTopicSortFilter({
    onPendingChange,
    onSortStart,
  })

  function handleTabClick(e: React.MouseEvent, value: TabValue): void {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      e.stopPropagation()
      return
    }
    e.preventDefault()
    setTab(value)
  }

  const visibleTabs = TABS.filter((tab) => !tab.requiresAuth || isLoggedIn)

  return (
    <nav
      role="tablist"
      className={cn(
        "grid h-14 w-full bg-transparent p-0",
        isLoggedIn ? "grid-cols-4" : "grid-cols-3",
        className
      )}
    >
      {visibleTabs.map((tab) => {
        const isActive = selectedTab === tab.value
        return (
          <Link
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            href={getTabPath(tab.value)}
            onClick={(e) => handleTabClick(e, tab.value)}
            className={cn(
              "group relative flex h-full items-center justify-center px-4 md:px-6 transition-all hover:bg-muted/50",
              isActive ? "text-foreground font-bold" : "text-muted-foreground"
            )}
          >
            <span className="relative h-full flex items-center">
              {tc(`Tabs.${tab.labelKey}`)}
              <span
                className={cn(
                  "absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full transition-opacity",
                  isActive ? "opacity-100" : "opacity-0"
                )}
              />
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
