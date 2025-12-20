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
import { NewTopicButton } from "@/components/new-topic/new-topic-button"
import { NewTopicDialog } from "@/components/new-topic/new-topic-dialog"
import { CategorySelect } from "@/components/filters/category-select"
import { TagSelect } from "@/components/filters/tag-select"
import { TopicList, TopicListItem } from "@/components/topic/topic-list"

type TopicListResult = {
  items: TopicListItem[]
  page: number
  pageSize: number
  total: number
}

export default function Home() {
  const t = useTranslations("Index")
  const tc = useTranslations("Common")
  const [isNewTopicDialogOpen, setIsNewTopicDialogOpen] = useState(false)

  const [loading, setLoading] = useState<boolean>(true)
  const [topics, setTopics] = useState<TopicListItem[]>([])
  async function loadTopics() {
    try {
      setLoading(true)
      const res = await fetch(`/api/topics?page=1&pageSize=20`, {
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
  }, [])

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
          <div className="flex flex-row gap-2">
            <CategorySelect className="w-30" />
            <TagSelect className="w-30" />
          </div>
          <Tabs defaultValue="1">
            <TabsList>
              <TabsTrigger value="1">{tc("Tabs.latest")}</TabsTrigger>
              <TabsTrigger value="2">{tc("Tabs.hot")}</TabsTrigger>
              <TabsTrigger value="3">{tc("Tabs.leaderboard")}</TabsTrigger>
              <TabsTrigger value="4">{tc("Tabs.categories")}</TabsTrigger>
              <TabsTrigger value="5">{tc("Tabs.myPosts")}</TabsTrigger>
              <TabsTrigger value="6">{tc("Tabs.favorites")}</TabsTrigger>
            </TabsList>
          </Tabs>
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
