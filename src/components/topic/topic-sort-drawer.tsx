"use client"

import { useState, useTransition, useEffect, useMemo } from "react"
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"
import { Separator } from "@/components/ui/separator"
import { ChevronsUpDown, Check } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter, useParams } from "next/navigation"
import { Label } from "../ui/label"
import { cn } from "@/lib/utils"
import {
  parseRouteSegments,
  buildRoutePath,
  type RouteParams,
  type SortValue as RouteSortValue,
} from "@/lib/route-utils"

type SortValue = RouteSortValue
type FilterValue = "community" | "my"
type TabValue = SortValue | FilterValue

type TopicSortDrawerProps = {
  className?: string
  onPendingChange?: (pending: boolean) => void
  onSortStart?: (next: SortValue) => void
  onFilterChange?: (filter: FilterValue) => void
}

export function TopicSortDrawer({
  className,
  onPendingChange,
  onSortStart,
  onFilterChange,
}: TopicSortDrawerProps) {
  const tc = useTranslations("Common")
  const router = useRouter()
  const params = useParams<{ segments?: string[] }>()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  // 从路由段中提取当前排序
  const routeParams = useMemo(() => {
    const parsed = parseRouteSegments(params.segments)
    return parsed.valid ? (parsed as RouteParams) : {}
  }, [params.segments])

  const currentSort: SortValue = useMemo(() => {
    // 优先使用路由中的排序参数
    if (routeParams.sort === "top") return "top"
    if (routeParams.sort === "new") return "new"
    if (routeParams.sort === "latest") return "latest"
    return "latest"
  }, [routeParams])

  // 当前激活的选项卡（可能是排序或过滤）
  const [currentTab, setCurrentTab] = useState<TabValue>(currentSort)

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

  useEffect(() => {
    onPendingChange?.(isPending)
  }, [isPending, onPendingChange])

  // 同步路由变化到当前选项卡
  useEffect(() => {
    setCurrentTab(currentSort)
  }, [currentSort])

  function handleTabClick(value: TabValue) {
    if (value === currentTab) {
      setOpen(false)
      return
    }

    setCurrentTab(value)
    setOpen(false)

    // 判断是排序还是过滤
    if (value === "community" || value === "my") {
      // 处理过滤类型
      onFilterChange?.(value)
    } else {
      // 处理排序类型
      const sortValue = value as SortValue
      onSortStart?.(sortValue)

      // 构建新路由参数
      const newParams: RouteParams = {
        ...routeParams,
        sort: sortValue,
      }

      // 生成新路由路径
      const newPath = buildRoutePath(newParams)

      startTransition(() => {
        router.push(newPath)
        router.refresh()
      })
    }
  }

  const sortOptions: Array<{ value: TabValue; label: string }> = [
    { value: "latest", label: sortLabels.latest },
    { value: "top", label: sortLabels.top },
    { value: "new", label: sortLabels.new },
    { value: "community", label: sortLabels.community },
    { value: "my", label: sortLabels.my },
  ]

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Label className={className}>
          <span>{sortLabels[currentTab]}</span>
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
                  currentTab === option.value && "bg-accent"
                )}
              >
                <span>{option.label}</span>
                {currentTab === option.value && <Check className="h-4 w-4" />}
              </button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
