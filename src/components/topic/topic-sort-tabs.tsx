"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useState, useTransition } from "react"

type SortValue = "latest" | "hot"

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
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const currentSort: SortValue = useMemo(() => {
    const v = searchParams.get("sort")
    return v === "hot" ? "hot" : "latest"
  }, [searchParams])
  const [selectedSort, setSelectedSort] = useState<SortValue>(currentSort)

  useEffect(() => {
    onPendingChange?.(isPending)
  }, [isPending, onPendingChange])

  useEffect(() => {
    setSelectedSort(currentSort)
  }, [currentSort])

  function setSort(next: SortValue) {
    if (next === currentSort) {
      setSelectedSort(next)
      return
    }
    onSortStart?.(next)
    setSelectedSort(next)
    const params = new URLSearchParams(searchParams.toString())
    params.set("sort", next)
    params.delete("page")
    const url = `${pathname}?${params.toString()}`
    startTransition(() => {
      router.replace(url)
      router.refresh()
    })
  }

  return (
    <Tabs
      value={selectedSort}
      onValueChange={(v) => setSort(v as SortValue)}
      className={className}
    >
      <TabsList>
        <TabsTrigger value="latest">{tc("Tabs.latest")}</TabsTrigger>
        <TabsTrigger value="hot">{tc("Tabs.hot")}</TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
