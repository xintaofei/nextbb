"use client"

import { useMemo, useTransition } from "react"
import { useRouter, usePathname } from "next/navigation"
import useSWR from "swr"
import { Skeleton } from "@/components/ui/skeleton"
import { Flame } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { TagBadge } from "@/components/common/tag-badge"
import {
  extractRouteParamsFromPathname,
  buildRoutePath,
} from "@/lib/route-utils"

type TagDTO = {
  id: string
  name: string
  icon: string
  description: string
  sort: number
  bgColor?: string | null
  textColor?: string | null
}

type HotTagsProps = {
  className?: string
  count?: number
}

export function HotTags({ className, count = 5 }: HotTagsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const tc = useTranslations("Common")

  const fetcher = async (url: string): Promise<TagDTO[]> => {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return []
    const data = (await res.json()) as TagDTO[]
    return Array.isArray(data) ? data : []
  }
  const { data: tags, isLoading } = useSWR<TagDTO[]>("/api/tags", fetcher)

  // 从当前路径提取路由参数
  const currentRouteParams = useMemo(() => {
    return extractRouteParamsFromPathname(pathname)
  }, [pathname])

  const selectedTagId = currentRouteParams.tagId
  const hotTags = useMemo(() => (tags ?? []).slice(0, count), [tags, count])
  const loading = isLoading || !tags

  function cancelTag() {
    // 取消选中标签（移除tagId）
    const newParams = {
      ...currentRouteParams,
      tagId: undefined,
    }

    // 使用新路由模式
    const newPath = buildRoutePath(newParams)
    startTransition(() => {
      router.push(newPath)
    })
  }

  return (
    <div className={className} aria-label={tc("Filters.tag")}>
      <div className="flex flex-row flex-wrap items-center gap-2 bg-muted px-4 py-1.5 rounded-lg">
        <span className="inline-flex items-center gap-1 text-sm">
          <Flame className="size-4 text-destructive" />
          {tc("Tabs.hot")}
          {tc("Filters.tag")}
        </span>
        <div className="flex flex-row flex-wrap items-center gap-2">
          {loading
            ? Array.from({ length: count }).map((_, i) => {
                const widths = ["w-12", "w-10", "w-14"]
                return (
                  <Skeleton
                    key={`tag-skeleton-${i}`}
                    className={cn("h-5", widths[i % widths.length])}
                  />
                )
              })
            : hotTags.map((t) => {
                const active = selectedTagId === t.id
                // 已选中的标签：使用 onClick 支持取消选中
                // 未选中的标签：使用 id 让其渲染为 Link（SEO 友好）
                return (
                  <TagBadge
                    key={t.id}
                    id={active ? undefined : t.id}
                    icon={t.icon}
                    name={t.name}
                    description={t.description}
                    bgColor={t.bgColor}
                    textColor={t.textColor}
                    active={active}
                    onClick={active ? cancelTag : undefined}
                  />
                )
              })}
        </div>
      </div>
    </div>
  )
}
