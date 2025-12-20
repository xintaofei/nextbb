"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Bookmark, Flag, Heart, Reply } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { TopicNavigator } from "@/components/topic/topic-navigator"
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer"
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
import { toast } from "sonner"
import { formatRelative } from "@/lib/time"
import { Skeleton } from "@/components/ui/skeleton"

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
    category: { id: string; name: string; icon?: string }
    tags: { id: string; name: string; icon: string }[]
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

  const [replyContent, setReplyContent] = useState<string>("")
  const [replyToPostId, setReplyToPostId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [replyOpen, setReplyOpen] = useState<boolean>(false)
  const loading = !data

  const onClickReply = (postId: string, authorName: string) => {
    setReplyToPostId(postId)
    if (!replyContent.trim()) {
      setReplyContent(`@${authorName} `)
    }
    setReplyOpen(true)
  }

  const submitReply = async () => {
    const content = replyContent.trim()
    if (!content) {
      toast.error(tc("Form.required"))
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch(`/api/topic/${id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content,
          parentId: replyToPostId ?? undefined,
        }),
      })
      if (res.status === 401) {
        toast.error(tc("Error.unauthorized"))
        return
      }
      if (!res.ok) {
        toast.error(tc("Error.requestFailed"))
        return
      }
      setReplyContent("")
      setReplyToPostId(null)
      setReplyOpen(false)
      const detailRes = await fetch(`/api/topic/${id}`, { cache: "no-store" })
      if (detailRes.ok) {
        const json = (await detailRes.json()) as TopicDetail
        setData(json)
        toast.success(tc("Action.success"))
        const newIndex = json.posts.length
        const el = document.getElementById(`post-${newIndex}`)
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
      } else {
        toast.success(tc("Action.success"))
      }
    } catch {
      toast.error(tc("Error.network"))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-8 gap-8">
      <div className="flex flex-col gap-2">
        {loading ? (
          <>
            <Skeleton className="h-8 w-3/4" />
            <div className="flex max-w-full flex-wrap gap-2 overflow-hidden">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-28" />
            </div>
          </>
        ) : (
          <>
            <Link href={`/topic/${topic.id}`}>
              <span className="cursor-pointer max-w-full text-2xl font-medium whitespace-normal wrap-break-word">
                {topic.title}
              </span>
            </Link>
            <div className="flex max-w-full flex-wrap gap-2 overflow-hidden">
              {data?.topic.category ? (
                <Badge variant="secondary">
                  {data.topic.category.icon ?? "📁"} {data.topic.category.name}
                </Badge>
              ) : null}
              {data?.topic.tags.map((tag) => (
                <Badge key={tag.id} variant="outline">
                  {tag.icon} {tag.name}
                </Badge>
              ))}
            </div>
          </>
        )}
      </div>
      <div className="flex flex-row justify-between gap-8">
        <div className="flex-1">
          {loading ? (
            <TimelineSteps>
              {Array.from({ length: 3 }, (_, i) => i).map((i) => (
                <TimelineStepsItem key={`s-${i}`}>
                  <TimelineStepsConnector />
                  <TimelineStepsIcon size="lg" className="overflow-hidden p-0">
                    <Skeleton className="h-10 w-10 rounded-full" />
                  </TimelineStepsIcon>
                  <TimelineStepsContent className="border-b">
                    <div className="flex flex-row justify-between items-center w-full">
                      <div className="flex flex-row gap-2">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                      <Skeleton className="h-4 w-10" />
                    </div>
                    <div className="mt-2 flex flex-col gap-2">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-11/12" />
                      <Skeleton className="h-4 w-10/12" />
                    </div>
                    <TimelineStepsAction>
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-8 rounded-md" />
                      <Skeleton className="h-8 w-16 rounded-md" />
                    </TimelineStepsAction>
                  </TimelineStepsContent>
                </TimelineStepsItem>
              ))}
            </TimelineSteps>
          ) : (
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
                          {formatRelative(post.createdAt)}
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
                      <Button
                        variant="ghost"
                        onClick={() => onClickReply(post.id, post.author.name)}
                      >
                        <Reply className="text-foreground" />
                        {t("reply")}
                      </Button>
                    </TimelineStepsAction>
                  </TimelineStepsContent>
                </TimelineStepsItem>
              ))}
            </TimelineSteps>
          )}
        </div>
        {loading ? (
          <div className="w-48">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <TopicNavigator total={posts.length} />
        )}
      </div>
      <Drawer open={replyOpen} onOpenChange={setReplyOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{t("reply")}</DrawerTitle>
            {replyToPostId ? (
              <DrawerDescription>
                #{posts.findIndex((p) => p.id === replyToPostId)}
              </DrawerDescription>
            ) : null}
          </DrawerHeader>
          <div className="px-4">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              rows={5}
            />
          </div>
          <DrawerFooter>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setReplyOpen(false)}
                disabled={submitting}
              >
                {tc("Action.cancel")}
              </Button>
              <Button onClick={submitReply} disabled={submitting}>
                {t("reply")}
              </Button>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
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
          {loading
            ? Array.from({ length: 4 }, (_, i) => i).map((i) => (
                <TableRow key={`rt-s-${i}`}>
                  <TableCell className="max-w-full">
                    <Skeleton className="h-5 w-80" />
                    <div className="flex max-w-full flex-wrap gap-2 overflow-hidden mt-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-5 w-20" />
                      <Skeleton className="h-5 w-20" />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-4 w-10 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-4 w-10 mx-auto" />
                  </TableCell>
                  <TableCell className="text-center">
                    <Skeleton className="h-4 w-10 mx-auto" />
                  </TableCell>
                </TableRow>
              ))
            : relatedTopics.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="max-w-full">
                    <Link href={`/topic/${t.id}`}>
                      <span className="cursor-pointer max-w-full text-lg font-medium whitespace-normal wrap-break-word">
                        {t.title}
                      </span>
                    </Link>
                    <div className="flex max-w-full flex-wrap gap-2 overflow-hidden mt-2">
                      <Badge variant="secondary">
                        {t.category.icon ?? "📁"} {t.category.name}
                      </Badge>
                      {t.tags.map((tag) => (
                        <Badge key={tag.id} variant="outline">
                          {tag.icon} {tag.name}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">{t.replies}</TableCell>
                  <TableCell className="text-center">{t.views}</TableCell>
                  <TableCell className="text-center text-muted-foreground">
                    {formatRelative(t.activity)}
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
}
