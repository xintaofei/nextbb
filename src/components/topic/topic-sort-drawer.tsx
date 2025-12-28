"use client"

import { useState, useTransition, useEffect, useMemo, useRef } from "react"
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
import { usePathname, useRouter, useParams } from "next/navigation"
import { Label } from "../ui/label"
import { cn } from "@/lib/utils"
import {
  parseRouteSegments,
  buildRoutePath,
  type RouteParams,
  type SortValue as RouteSortValue,
} from "@/lib/route-utils"

type SortValue = RouteSortValue

type TopicSortDrawerProps = {
  className?: string
  onPendingChange?: (pending: boolean) => void
  onSortStart?: (next: SortValue) => void
}

export function TopicSortDrawer({
  className,
  onPendingChange,
  onSortStart,
}: TopicSortDrawerProps) {
  const tc = useTranslations("Common")
  const router = useRouter()
  const pathname = usePathname()
  const params = useParams<{ segments?: string[]; locale?: string }>()
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

  function setSort(next: SortValue) {
    if (next === currentSort) {
      setOpen(false)
      return
    }
    onSortStart?.(next)
    setOpen(false)

    // 构建新路由参数
    const newParams: RouteParams = {
      ...routeParams,
      sort: next,
    }

    // 生成新路由路径
    const newPath = buildRoutePath(newParams, params.locale)

    startTransition(() => {
      router.push(newPath)
      router.refresh()
    })
  }

  const sortOptions = [
    { value: "latest" as SortValue, label: sortLabels.latest },
    { value: "top" as SortValue, label: sortLabels.top },
    { value: "new" as SortValue, label: sortLabels.new },
  ]

  const disabledOptions = [
    { value: "hot" as const, label: sortLabels.hot },
    { value: "community" as const, label: sortLabels.community },
  ]

  const userOptions = [
    { value: "my" as const, label: sortLabels.my },
    { value: "bookmark" as const, label: sortLabels.bookmark },
    { value: "like" as const, label: sortLabels.like },
  ]

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        <Label className={className}>
          <span>{sortLabels[currentSort]}</span>
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
                onClick={() => setSort(option.value)}
                className={cn(
                  "flex items-center justify-between rounded-md px-4 py-3 text-sm font-medium transition-colors hover:bg-accent",
                  currentSort === option.value && "bg-accent"
                )}
              >
                <span>{option.label}</span>
                {currentSort === option.value && <Check className="h-4 w-4" />}
              </button>
            ))}

            <Separator className="my-2" />

            {disabledOptions.map((option) => (
              <button
                key={option.value}
                disabled
                className="flex items-center justify-between rounded-md px-4 py-3 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed"
              >
                <span>{option.label}</span>
              </button>
            ))}

            <Separator className="my-2" />

            {userOptions.map((option) => (
              <button
                key={option.value}
                disabled
                className="flex items-center justify-between rounded-md px-4 py-3 text-sm font-medium text-muted-foreground opacity-50 cursor-not-allowed"
              >
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  )
}
