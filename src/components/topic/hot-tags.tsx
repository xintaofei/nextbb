"use client"

import { useMemo, useTransition } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
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
  const params = useParams<{ locale?: string; segments?: string[] }>()
  const [isPending, startTransition] = useTransition()
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
    return extractRouteParamsFromPathname(pathname, params.locale)
  }, [pathname, params.locale])

  const selectedTagId = currentRouteParams.tagId
  const hotTags = useMemo(() => (tags ?? []).slice(0, count), [tags, count])
  const loading = isLoading || !tags

  function applyTag(tagId: string) {
    // 构建新的路由参数
    const newParams = {
      ...currentRouteParams,
      tagId: tagId && tagId.length > 0 ? tagId : undefined,
    }

    // 使用新路由模式
    const newPath = buildRoutePath(newParams, params.locale)
    startTransition(() => {
      router.push(newPath)
    })
  }

  return (
    <div className={className} aria-label={tc("Filters.tag")}>
      <div className="flex flex-row items-center gap-2">
        <span className="inline-flex items-center gap-1 text-sm text-destructive">
          <Flame className="size-4" />
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
                return (
                  <TagBadge
                    key={t.id}
                    icon={t.icon}
                    name={t.name}
                    bgColor={t.bgColor}
                    textColor={t.textColor}
                    active={active}
                    onClick={() => applyTag(t.id)}
                  />
                )
              })}
        </div>
      </div>
    </div>
  )
}
