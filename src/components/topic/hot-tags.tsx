"use client"

import { useMemo, useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import useSWR from "swr"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Flame } from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

type TagDTO = {
  id: string
  name: string
  icon: string
  description: string
  sort: number
}

type HotTagsProps = {
  className?: string
  count?: number
}

export function HotTags({ className, count = 5 }: HotTagsProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const tc = useTranslations("Common")

  const fetcher = async (url: string): Promise<TagDTO[]> => {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return []
    const data = (await res.json()) as TagDTO[]
    return Array.isArray(data) ? data : []
  }
  const { data: tags, isLoading } = useSWR<TagDTO[]>("/api/tags", fetcher)

  const selectedTagId = searchParams.get("tagId") ?? undefined
  const hotTags = useMemo(() => (tags ?? []).slice(0, count), [tags, count])
  const loading = isLoading || !tags

  function applyTag(tagId: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (tagId && tagId.length > 0) {
      params.set("tagId", tagId)
    } else {
      params.delete("tagId")
    }
    params.delete("page")
    const url = `${pathname}?${params.toString()}`
    startTransition(() => {
      router.replace(url)
      router.refresh()
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
                  <Badge
                    key={t.id}
                    variant="outline"
                    className={cn(
                      "cursor-pointer",
                      active && "bg-primary/10 text-primary border-primary/20"
                    )}
                    onClick={() => applyTag(t.id)}
                  >
                    {t.icon} {t.name}
                  </Badge>
                )
              })}
        </div>
      </div>
    </div>
  )
}
