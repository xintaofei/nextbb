"use client"

import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { SearchIcon } from "lucide-react"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { useSearchParams } from "next/navigation"
import { TopicControls } from "@/components/topic/topic-controls"
import { TopicList, TopicListItem } from "@/components/topic/topic-list"
import { NewTopicButton } from "@/components/new-topic/new-topic-button"
import { NewTopicDialog } from "@/components/new-topic/new-topic-dialog"
import { TopicSortTabs } from "@/components/topic/topic-sort-tabs"

type TopicListResult = {
  items: TopicListItem[]
  page: number
  pageSize: number
  total: number
}

export default function Home() {
  const t = useTranslations("Index")
  const tc = useTranslations("Common")
  const searchParams = useSearchParams()
  const [isNewTopicDialogOpen, setIsNewTopicDialogOpen] = useState(false)

  const [loading, setLoading] = useState<boolean>(true)
  const [topics, setTopics] = useState<TopicListItem[]>([])
  async function loadTopics() {
    try {
      setLoading(true)
      const categoryId = searchParams.get("categoryId")
      const tagId = searchParams.get("tagId")
      const sort = searchParams.get("sort")
      const qs = new URLSearchParams()
      if (categoryId) qs.set("categoryId", categoryId)
      if (tagId) qs.set("tagId", tagId)
      if (sort) qs.set("sort", sort)
      qs.set("page", "1")
      qs.set("pageSize", "20")
      const res = await fetch(`/api/topics?${qs.toString()}`, {
        cache: "no-store",
      })
      if (!res.ok) return
      const data: TopicListResult = await res.json()
      setTopics(data.items)
    } catch {
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      await loadTopics()
    })()
    return () => {
      cancelled = true
    }
  }, [searchParams])

  return (
    <div className="flex min-h-screen w-full flex-col px-8 gap-4">
      <div className="flex flex-row justify-between items-center py-8">
        <h1 className="text-5xl">{t("title")}</h1>
        <InputGroup className="w-80">
          <InputGroupInput placeholder={tc("Search.placeholder")} />
          <InputGroupAddon>
            <SearchIcon />
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className="flex flex-row justify-between items-center">
        <div className="flex flex-row gap-4">
          <TopicControls className="flex flex-row gap-2" />
          <TopicSortTabs />
        </div>
        <div className="flex flex-row gap-2">
          <NewTopicButton onClick={() => setIsNewTopicDialogOpen(true)} />
        </div>
      </div>
      <TopicList items={topics} loading={loading} />
      <NewTopicDialog
        open={isNewTopicDialogOpen}
        onOpenChange={setIsNewTopicDialogOpen}
        onPublished={() => {
          loadTopics()
        }}
      />
    </div>
  )
}
