"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Bookmark, Flag, Heart, Reply, Pencil, Trash } from "lucide-react"
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
import { DrawerEditor } from "@/components/editor/drawer-editor"
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
import { toast } from "sonner"
import { formatRelative } from "@/lib/time"
import { Skeleton } from "@/components/ui/skeleton"
import useSWR from "swr"
import useSWRMutation from "swr/mutation"

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
    isDeleted: boolean
    likes: number
    liked: boolean
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

  const fetcher = async (url: string): Promise<TopicDetail> => {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to load")
    return (await res.json()) as TopicDetail
  }
  const { data, mutate, isLoading } = useSWR<TopicDetail>(
    `/api/topic/${id}`,
    fetcher,
    {
      revalidateOnFocus: false,
    }
  )
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

  useEffect(() => {}, [id])

  const [replyContent, setReplyContent] = useState<string>("")
  const [replyToPostId, setReplyToPostId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [replyOpen, setReplyOpen] = useState<boolean>(false)
  const loading = isLoading
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    id: string
    username: string
    avatar: string
  } | null>(null)
  const [editOpen, setEditOpen] = useState<boolean>(false)
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false)
  const [editPostId, setEditPostId] = useState<string | null>(null)
  const [editInitial, setEditInitial] = useState<string>("")
  const [mutatingPostId, setMutatingPostId] = useState<string | null>(null)

  type LikeResult = { liked: boolean; count: number }
  type LikeArg = { postId: string }
  const { trigger: triggerLike, isMutating: likeMutating } = useSWRMutation<
    LikeResult,
    Error,
    string,
    LikeArg
  >("/mutations/post-like", async (_key, { arg }) => {
    const res = await fetch(`/api/post/${arg.postId}/like`, { method: "POST" })
    if (!res.ok) throw new Error(String(res.status))
    return (await res.json()) as LikeResult
  })
  type EditArg = { postId: string; content: string }
  const { trigger: triggerEdit, isMutating: editMutating } = useSWRMutation<
    { ok: boolean },
    Error,
    string,
    EditArg
  >("/mutations/post-edit", async (_key, { arg }) => {
    const res = await fetch(`/api/post/${arg.postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: arg.content }),
    })
    if (!res.ok) throw new Error(String(res.status))
    return { ok: true }
  })
  type DeleteArg = { postId: string }
  const { trigger: triggerDelete, isMutating: deleteMutating } = useSWRMutation<
    { ok: boolean },
    Error,
    string,
    DeleteArg
  >("/mutations/post-delete", async (_key, { arg }) => {
    const res = await fetch(`/api/post/${arg.postId}`, { method: "DELETE" })
    if (!res.ok) throw new Error(String(res.status))
    return { ok: true }
  })
  type ReplyArg = { content: string; parentId?: string }
  type ReplyResult = { postId: string; floorNumber: number }
  const { trigger: triggerReply, isMutating: replyMutating } = useSWRMutation<
    ReplyResult,
    Error,
    string,
    ReplyArg
  >(`/mutations/topic-reply-${id}`, async (_key, { arg }) => {
    const res = await fetch(`/api/topic/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(arg),
    })
    if (!res.ok) throw new Error(String(res.status))
    return (await res.json()) as ReplyResult
  })

  useEffect(() => {
    let mounted = true
    const run = async () => {
      try {
        const res = await fetch("/api/auth/me", { cache: "no-store" })
        if (res.ok) {
          const json = (await res.json()) as {
            user: {
              id: string
              email: string
            }
            profile: {
              id: string
              email: string
              username: string
              avatar: string
            }
          }
          if (mounted) setCurrentUserId(json.user.id)
          if (mounted)
            setCurrentUserProfile({
              id: json.profile.id,
              username: json.profile.username,
              avatar: json.profile.avatar,
            })
        }
      } catch {}
    }
    run()
    return () => {
      mounted = false
    }
  }, [])

  const onClickReply = (postId: string, authorName: string) => {
    setReplyToPostId(postId)
    if (!replyContent.trim()) {
      setReplyContent(`@${authorName} `)
    }
    setReplyOpen(true)
  }

  const submitReply = async (overrideContent?: string) => {
    const content = (overrideContent ?? replyContent).trim()
    if (!content) {
      toast.error(tc("Form.required"))
      return
    }
    setSubmitting(true)
    try {
      const prev = data
      if (!prev || !currentUserProfile) {
        toast.error(tc("Error.requestFailed"))
        return
      }
      const tempId = `temp-${Date.now()}`
      const optimistic: PostItem = {
        id: tempId,
        author: {
          id: currentUserProfile.id,
          name: currentUserProfile.username,
          avatar: currentUserProfile.avatar,
        },
        content,
        createdAt: new Date().toISOString(),
        minutesAgo: 0,
        isDeleted: false,
        likes: 0,
        liked: false,
      }
      setReplyOpen(false)
      setReplyContent("")
      setReplyToPostId(null)
      await mutate(
        {
          ...prev,
          posts: [...prev.posts, optimistic],
        },
        { revalidate: false }
      )
      await triggerReply({
        content,
        parentId: replyToPostId ?? undefined,
      })
      const next = await mutate()
      toast.success(tc("Action.success"))
      if (next) {
        const newIndex = next.posts.length
        const el = document.getElementById(`post-${newIndex}`)
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    } catch (e) {
      const status = Number((e as Error).message)
      if (status === 401) toast.error(tc("Error.unauthorized"))
      else toast.error(tc("Error.requestFailed"))
      const prev = data
      if (prev) await mutate(prev, { revalidate: false })
    } finally {
      setSubmitting(false)
    }
  }

  const onClickEdit = (postId: string, initialContent: string) => {
    setEditPostId(postId)
    setEditInitial(initialContent)
    setEditOpen(true)
  }
  const submitEdit = async (content: string) => {
    const value = content.trim()
    if (!value) {
      toast.error(tc("Form.required"))
      return
    }
    setEditSubmitting(true)
    try {
      const prev = data
      if (!prev || !editPostId) return
      setMutatingPostId(editPostId)
      await mutate(
        {
          ...prev,
          posts: prev.posts.map((p) =>
            p.id === editPostId ? { ...p, content: value } : p
          ),
        },
        { revalidate: false }
      )
      await triggerEdit({ postId: editPostId, content: value })
      setEditOpen(false)
      const next = await mutate()
      toast.success(tc("Action.success"))
      if (next) {
        const idx = next.posts.findIndex((p) => p.id === editPostId)
        const el = document.getElementById(`post-${idx + 1}`)
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    } catch (e) {
      const status = Number((e as Error).message)
      if (status === 401) toast.error(tc("Error.unauthorized"))
      else if (status === 403) toast.error(tc("Error.forbidden"))
      else toast.error(tc("Error.requestFailed"))
      const prev = data
      if (prev && editPostId) await mutate(prev, { revalidate: false })
    } finally {
      setEditSubmitting(false)
      setMutatingPostId(null)
    }
  }
  const onClickDelete = async (postId: string) => {
    if (!window.confirm(t("deleteConfirm"))) return
    try {
      const prev = data
      if (!prev) return
      setMutatingPostId(postId)
      await mutate(
        {
          ...prev,
          posts: prev.posts.map((p) =>
            p.id === postId ? { ...p, isDeleted: true } : p
          ),
        },
        { revalidate: false }
      )
      await triggerDelete({ postId })
      await mutate()
      toast.success(tc("Action.success"))
    } catch (e) {
      const status = Number((e as Error).message)
      if (status === 401) toast.error(tc("Error.unauthorized"))
      else if (status === 403) toast.error(tc("Error.forbidden"))
      else toast.error(tc("Error.requestFailed"))
      const prev = data
      if (prev) await mutate(prev, { revalidate: false })
    } finally {
      setMutatingPostId(null)
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
                      <div className="flex flex-row gap-2 items-center">
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
                      {post.isDeleted ? (
                        <span className="text-muted-foreground">
                          {t("deleted")}
                        </span>
                      ) : (
                        post.content
                      )}
                    </TimelineStepsDescription>
                    <TimelineStepsAction>
                      {post.isDeleted ? null : (
                        <>
                          {post.author.id !== currentUserId ? (
                            <>
                              <Button
                                variant="ghost"
                                disabled={
                                  mutatingPostId === post.id || likeMutating
                                }
                                onClick={async () => {
                                  const prev = data
                                  if (!prev) return
                                  setMutatingPostId(post.id)
                                  const optimisticLiked = !post.liked
                                  const optimisticCount =
                                    post.likes + (optimisticLiked ? 1 : -1)
                                  await mutate(
                                    {
                                      ...prev,
                                      posts: prev.posts.map((p) =>
                                        p.id === post.id
                                          ? {
                                              ...p,
                                              liked: optimisticLiked,
                                              likes: Math.max(
                                                optimisticCount,
                                                0
                                              ),
                                            }
                                          : p
                                      ),
                                    },
                                    { revalidate: false }
                                  )
                                  try {
                                    const result = await triggerLike({
                                      postId: post.id,
                                    })
                                    const latest = data
                                    if (!latest) return
                                    await mutate(
                                      {
                                        ...latest,
                                        posts: latest.posts.map((p) =>
                                          p.id === post.id
                                            ? {
                                                ...p,
                                                liked: result.liked,
                                                likes: result.count,
                                              }
                                            : p
                                        ),
                                      },
                                      { revalidate: false }
                                    )
                                  } catch (e) {
                                    const status = Number((e as Error).message)
                                    if (status === 401) {
                                      toast.error(tc("Error.unauthorized"))
                                    } else {
                                      toast.error(tc("Error.requestFailed"))
                                    }
                                    if (prev)
                                      await mutate(prev, { revalidate: false })
                                  } finally {
                                    setMutatingPostId(null)
                                  }
                                }}
                              >
                                <Heart
                                  className={
                                    post.liked ? "text-red-500" : undefined
                                  }
                                  fill={post.liked ? "currentColor" : "none"}
                                />
                                <span className="ml-1 text-sm">
                                  {post.likes}
                                </span>
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Bookmark />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  onClickEdit(post.id, post.content)
                                }}
                                disabled={
                                  mutatingPostId === post.id || editMutating
                                }
                              >
                                <Pencil />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => onClickDelete(post.id)}
                                disabled={
                                  mutatingPostId === post.id || deleteMutating
                                }
                              >
                                <Trash />
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="icon">
                            <Flag />
                          </Button>
                          <Button
                            variant="ghost"
                            onClick={() => {
                              onClickReply(post.id, post.author.name)
                            }}
                          >
                            <Reply className="text-foreground" />
                            {t("reply")}
                          </Button>
                        </>
                      )}
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
      <DrawerEditor
        key={`reply-${replyToPostId ?? "topic"}-${replyOpen ? replyContent : ""}`}
        title={t("reply")}
        description={
          replyToPostId
            ? `#${posts.findIndex((p) => p.id === replyToPostId)}`
            : undefined
        }
        open={replyOpen}
        onOpenChange={setReplyOpen}
        initialValue={replyContent}
        submitting={submitting}
        onSubmit={(content: string) => {
          submitReply(content)
        }}
        submitText={t("reply")}
        cancelText={tc("Action.cancel")}
      />
      <DrawerEditor
        key={`edit-${editPostId ?? "none"}-${editOpen ? editInitial : ""}`}
        title={t("edit")}
        open={editOpen}
        onOpenChange={setEditOpen}
        initialValue={editInitial}
        submitting={editSubmitting}
        onSubmit={submitEdit}
        submitText={tc("Action.save")}
        cancelText={tc("Action.cancel")}
      />
      <div className="flex flex-col gap-4 mt-8">
        <Table className="w-full table-fixed">
          <colgroup>
            <col />
            <col className="w-20" />
            <col className="w-20" />
            <col className="w-20" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("Table.related")}</TableHead>
              <TableHead className="text-center">
                {tc("Table.replies")}
              </TableHead>
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
    </div>
  )
}
