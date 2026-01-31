"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export function TopicSortTabs({
  className,
  onPendingChange,
  onSortStart,
}: TopicSortTabsProps) {
  const tc = useTranslations("Common")

  // 获取当前用户登录状态
  const { data: session } = useSession()
  const isLoggedIn = session?.user?.id !== undefined

  // 使用共享hook管理排序和过滤
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

  return (
    <Tabs
      value={selectedTab}
      onValueChange={() => {}}
      className={cn("w-full", className)}
    >
      <TabsList className="flex h-14 w-auto justify-start overflow-x-auto rounded-none border-none bg-transparent p-0 no-scrollbar">
        <TabsTrigger
          className="group relative h-full bg-transparent border-none rounded-none px-4 md:px-6 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:bg-muted/30 transition-all"
          value="latest"
          asChild
        >
          <Link
            href={getTabPath("latest")}
            onClick={(e) => handleTabClick(e, "latest")}
            className="flex items-center justify-center h-full"
          >
            <span className="relative h-full flex items-center">
              {tc("Tabs.latest")}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full opacity-0 group-data-[state=active]:opacity-100 transition-opacity" />
            </span>
          </Link>
        </TabsTrigger>
        <TabsTrigger
          className="group relative h-full bg-transparent border-none rounded-none px-4 md:px-6 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:bg-muted/30 transition-all"
          value="new"
          asChild
        >
          <Link
            href={getTabPath("new")}
            onClick={(e) => handleTabClick(e, "new")}
            className="flex items-center justify-center h-full"
          >
            <span className="relative h-full flex items-center">
              {tc("Tabs.new")}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full opacity-0 group-data-[state=active]:opacity-100 transition-opacity" />
            </span>
          </Link>
        </TabsTrigger>
        <TabsTrigger
          className="group relative h-full bg-transparent border-none rounded-none px-4 md:px-6 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:bg-muted/30 transition-all"
          value="community"
          asChild
        >
          <Link
            href={getTabPath("community")}
            onClick={(e) => handleTabClick(e, "community")}
            className="flex items-center justify-center h-full"
          >
            <span className="relative h-full flex items-center">
              {tc("Tabs.community")}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full opacity-0 group-data-[state=active]:opacity-100 transition-opacity" />
            </span>
          </Link>
        </TabsTrigger>
        {isLoggedIn && (
          <TabsTrigger
            className="group relative h-full bg-transparent border-none rounded-none px-4 md:px-6 text-muted-foreground data-[state=active]:text-foreground data-[state=active]:font-bold data-[state=active]:bg-transparent data-[state=active]:shadow-none hover:bg-muted/30 transition-all"
            value="my"
            asChild
          >
            <Link
              href={getTabPath("my")}
              onClick={(e) => handleTabClick(e, "my")}
              className="flex items-center justify-center h-full"
            >
              <span className="relative h-full flex items-center">
                {tc("Tabs.my")}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-primary rounded-full opacity-0 group-data-[state=active]:opacity-100 transition-opacity" />
              </span>
            </Link>
          </TabsTrigger>
        )}
      </TabsList>
    </Tabs>
  )
}
