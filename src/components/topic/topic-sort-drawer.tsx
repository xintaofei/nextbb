"use client"

import { useState } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { ChevronsUpDown, Check } from "lucide-react"
import { useTranslations } from "next-intl"
import { useSession } from "next-auth/react"
import { Label } from "../ui/label"
import { cn } from "@/lib/utils"
import {
  useTopicSortFilter,
  type TabValue,
} from "@/hooks/use-topic-sort-filter"
import type { SortValue, FilterValue } from "@/lib/route-utils"

type TopicSortDrawerProps = {
  className?: string
  onPendingChange?: (pending: boolean) => void
  onSortStart?: (next: SortValue) => void
  onFilterStart?: (filter: FilterValue) => void
}

export function TopicSortDrawer({
  className,
  onPendingChange,
  onSortStart,
  onFilterStart,
}: TopicSortDrawerProps) {
  const tc = useTranslations("Common")
  const [open, setOpen] = useState(false)

  // 获取当前用户登录状态
  const { data: session } = useSession()
  const isLoggedIn = session?.user?.id !== undefined

  // 使用共享hook管理排序和过滤
  const { selectedTab, setTab } = useTopicSortFilter({
    onPendingChange,
    onSortStart,
    onFilterStart,
  })

  const sortLabels: Record<string, string> = {
    latest: tc("Tabs.latest"),
    hot: tc("Tabs.hot"),
    community: tc("Tabs.community"),
    new: tc("Tabs.new"),
    top: tc("Tabs.top"),
    my: tc("Tabs.my"),
    bookmark: tc("Tabs.bookmark"),
    like: tc("Tabs.like"),
  }

  function handleTabClick(value: TabValue): void {
    if (value === selectedTab) {
      setOpen(false)
      return
    }

    setTab(value)
    setOpen(false)
  }

  const sortOptions: Array<{ value: TabValue; label: string }> = [
    { value: "latest", label: sortLabels.latest },
    { value: "new", label: sortLabels.new },
    { value: "community", label: sortLabels.community },
    ...(isLoggedIn ? [{ value: "my" as const, label: sortLabels.my }] : []),
  ]

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Label className={className}>
          <span>{sortLabels[selectedTab]}</span>
          <ChevronsUpDown className="h-4 w-4" />
        </Label>
      </DrawerTrigger>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{tc("Tabs.categories")}</DrawerTitle>
        </DrawerHeader>
        <div className="w-full px-4 pb-8">
          <div className="flex flex-col gap-1">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => handleTabClick(option.value)}
                className={cn(
                  "flex items-center justify-between rounded-md px-4 py-3 text-sm font-medium transition-colors hover:bg-accent",
                  selectedTab === option.value && "bg-accent"
                )}
              >
                <span>{option.label}</span>
                {selectedTab === option.value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
