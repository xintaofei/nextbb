"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { BadgeCheckIcon, Bookmark, Flag, Heart, Reply } from "lucide-react"
import {
  TimelineSteps,
  TimelineStepsAction,
  TimelineStepsConnector,
  TimelineStepsContent,
  TimelineStepsDescription,
  TimelineStepsIcon,
  TimelineStepsItem,
  TimelineStepsTime,
  TimelineStepsTitle,
} from "@/components/ui/timeline-steps"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { TopicNavigator } from "@/components/topic/topic-navigator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

export default function TopicPage() {
  const { id } = useParams<{ id: string }>()
  const tc = useTranslations("Common")
  const t = useTranslations("Topic")

  type Author = { id: string; name: string; avatar: string }
  type PostItem = {
    id: string
    author: Author
    content: string
    createdAt: string
    minutesAgo: number
  }
  type RelatedTopicItem = {
    id: string
    title: string
    replies: number
    views: number
    activity: string
  }
  type TopicDetail = {
    topic: {
      id: string
      title: string
      category: { id: string; name: string; icon?: string }
      tags: { id: string; name: string; icon: string }[]
    }
    posts: PostItem[]
    relatedTopics: RelatedTopicItem[]
  }

  const [data, setData] = useState<TopicDetail | null>(null)
  const topic = useMemo(
    () =>
      data?.topic ?? {
        id: id,
        title: "",
      },
    [data, id]
  )
  const posts = data?.posts ?? []

  const relatedTopics = data?.relatedTopics ?? []

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        const res = await fetch(`/api/topic/${id}`, { cache: "no-store" })
        if (!res.ok) return
        const json = (await res.json()) as TopicDetail
        if (mounted) setData(json)
      } catch {}
    }
    run()
    return () => {
      mounted = false
    }
  }, [id])

  return (
    <div className="flex min-h-screen w-full flex-col p-8 gap-8">
      <div className="flex flex-col gap-2">
        <Link href={`/topic/${topic.id}`}>
          <span className="cursor-pointer max-w-full text-2xl font-medium whitespace-normal wrap-break-word">
            {topic.title}
          </span>
        </Link>
        <div className="flex max-w-full flex-wrap gap-2 overflow-hidden">
          {data?.topic.category ? (
            <Badge variant="secondary">{data.topic.category.name}</Badge>
          ) : null}
          {data?.topic.tags.map((tag) => (
            <Badge key={tag.id} variant="outline">
              {tag.name}
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex flex-row justify-between gap-8">
        <div className="flex-1">
          <TimelineSteps>
            {posts.map((post, index) => (
              <TimelineStepsItem
                id={`post-${index + 1}`}
                data-post-anchor
                key={post.id}
              >
                <TimelineStepsConnector />
                <TimelineStepsIcon size="lg" className="overflow-hidden p-0">
                  <Avatar className="size-full">
                    <AvatarImage src={post.author.avatar} alt="@shadcn" />
                    <AvatarFallback>{post.author.name}</AvatarFallback>
                  </Avatar>
                </TimelineStepsIcon>
                <TimelineStepsContent className="border-b">
                  <div className="flex flex-row justify-between items-center w-full">
                    <div className="flex flex-row gap-2">
                      <TimelineStepsTitle>
                        {post.author.name}
                      </TimelineStepsTitle>
                      <TimelineStepsTime>
                        {tc("Time.minutesAgo", { count: post.minutesAgo })}
                      </TimelineStepsTime>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {index === 0 ? t("floor.op") : "#" + index}
                    </span>
                  </div>
                  <TimelineStepsDescription>
                    {post.content}
                  </TimelineStepsDescription>
                  <TimelineStepsAction>
                    <Button variant="ghost" size="icon">
                      <Heart />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Bookmark />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Flag />
                    </Button>
                    <Button variant="ghost">
                      <Reply className="text-foreground" />
                      {t("reply")}
                    </Button>
                  </TimelineStepsAction>
                </TimelineStepsContent>
              </TimelineStepsItem>
            ))}
          </TimelineSteps>
        </div>
        <TopicNavigator total={posts.length} />
      </div>
      <Table className="w-full table-fixed">
        <colgroup>
          <col />
          <col className="w-20" />
          <col className="w-20" />
          <col className="w-20" />
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHead>{tc("Table.topic")}</TableHead>
            <TableHead className="text-center">{tc("Table.replies")}</TableHead>
            <TableHead className="text-center">{tc("Table.views")}</TableHead>
            <TableHead className="text-center">
              {tc("Table.activity")}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {relatedTopics.map((t) => (
            <TableRow key={t.id}>
              <TableCell className="max-w-full">
                <Link href={`/topic/${t.id}`}>
                  <span className="cursor-pointer max-w-full text-lg font-medium whitespace-normal break-words">
                    {t.title}
                  </span>
                </Link>
                <div className="flex max-w-full flex-wrap gap-2 overflow-hidden mt-2">
                  <Badge variant="secondary">{tc("Badge.secondary")}</Badge>
                  <Badge
                    variant="secondary"
                    className="bg-blue-500 text-white dark:bg-blue-600"
                  >
                    <BadgeCheckIcon />
                    {tc("Badge.verified")}
                  </Badge>
                  <Badge variant="destructive">{tc("Badge.destructive")}</Badge>
                  <Badge variant="outline">{tc("Badge.outline")}</Badge>
                </div>
              </TableCell>
              <TableCell className="text-center">{t.replies}</TableCell>
              <TableCell className="text-center">{t.views}</TableCell>
              <TableCell className="text-center text-muted-foreground">
                {t.activity}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
