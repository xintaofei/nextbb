"use client"

import { useState, useEffect } from "react"
import useSWR from "swr"
import { motion, AnimatePresence } from "motion/react"
import { Skeleton } from "@/components/ui/skeleton"
import {
  NotificationItem,
  type NotificationItemData,
} from "./notification-item"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { useTranslations } from "next-intl"

type NotificationListProps = {
  filter: string
}

export function NotificationList({ filter }: NotificationListProps) {
  const [page, setPage] = useState(1)
  const t = useTranslations("User.notifications")

  const { data, isLoading, mutate } = useSWR(
    `/api/users/me/notifications?filter=${filter}&page=${page}`,
    (url) => fetch(url).then((res) => res.json())
  )

  // 当进入页面或切换 filter 时，标记通知为已读
  useEffect(() => {
    const markAsRead = async () => {
      try {
        await fetch("/api/users/me/notifications", { method: "POST" })
        // 标记成功后，刷新当前页面的数据（为了更新 UI 上的未读状态）
        mutate()
      } catch (error) {
        console.error("Failed to mark notifications as read:", error)
      }
    }

    if (data?.items?.some((item: NotificationItemData) => !item.read)) {
      markAsRead()
    }
  }, [data?.items, mutate])

  // 当 filter 改变时重置页码
  const [prevFilter, setPrevFilter] = useState(filter)
  if (filter !== prevFilter) {
    setPrevFilter(filter)
    setPage(1)
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-24 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  const items: NotificationItemData[] = data?.items || []
  const hasMore = data?.hasMore || false

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center border rounded-xl bg-muted/10">
        <div className="text-6xl mb-4">🔔</div>
        <h3 className="text-lg font-semibold text-muted-foreground">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {t(`empty.${filter}` as any)}
        </h3>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {items.map((item: NotificationItemData) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              layout
            >
              <NotificationItem notification={item} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* 分页控制 */}
      <div className="flex items-center justify-center gap-2 pt-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          {t("nav.prevPage") || "上一页"}
        </Button>
        <span className="text-sm text-muted-foreground px-4">
          {t("nav.pageCounter", { page }) || `第 ${page} 页`}
        </span>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setPage(page + 1)}
          disabled={!hasMore}
        >
          {t("nav.nextPage") || "下一页"}
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
