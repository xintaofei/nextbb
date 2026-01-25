"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "next-intl"
import Link from "next/link"
import useSWR from "swr"
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

  // 获取当前用户信息
  const { data: sessionData } = useSWR<{ userId: string }>(
    "/api/auth/session",
    {
      revalidateOnFocus: false,
      dedupingInterval: 300000, // 5分钟缓存
    }
  )
  const isLoggedIn = Boolean(sessionData?.userId)

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
    <Tabs value={selectedTab} onValueChange={() => {}} className={className}>
      <TabsList>
        <TabsTrigger className="md:px-4" value="latest" asChild>
          <Link
            href={getTabPath("latest")}
            onClick={(e) => handleTabClick(e, "latest")}
          >
            {tc("Tabs.latest")}
          </Link>
        </TabsTrigger>
        <TabsTrigger className="md:px-4" value="new" asChild>
          <Link
            href={getTabPath("new")}
            onClick={(e) => handleTabClick(e, "new")}
          >
            {tc("Tabs.new")}
          </Link>
        </TabsTrigger>
        <TabsTrigger className="md:px-4" value="community" asChild>
          <Link
            href={getTabPath("community")}
            onClick={(e) => handleTabClick(e, "community")}
          >
            {tc("Tabs.community")}
          </Link>
        </TabsTrigger>
        {isLoggedIn && (
          <TabsTrigger
            className="hidden md:px-4 md:inline-flex"
            value="my"
            asChild
          >
            <Link
              href={getTabPath("my")}
              onClick={(e) => handleTabClick(e, "my")}
            >
              {tc("Tabs.my")}
            </Link>
          </TabsTrigger>
        )}
      </TabsList>
    </Tabs>
  )
}
