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
import useSWRInfinite from "swr/infinite"
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
  type TopicInfo = {
    id: string
    title: string
    category: { id: string; name: string; icon?: string }
    tags: { id: string; name: string; icon: string }[]
  }
  type TopicInfoResult = { topic: TopicInfo }
  type PostPage = {
    items: PostItem[]
    page: number
    pageSize: number
    total: number
    hasMore: boolean
  }
  type RelatedResult = { relatedTopics: RelatedTopicItem[] }

  const fetcherInfo = async (url: string): Promise<TopicInfoResult> => {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to load")
    return (await res.json()) as TopicInfoResult
  }
  const {
    data: infoData,
    mutate: mutateInfo,
    isLoading: loadingInfo,
  } = useSWR<TopicInfoResult>(`/api/topic/${id}/info`, fetcherInfo, {
    revalidateOnFocus: false,
  })
  const topic = useMemo(
    () =>
      infoData?.topic ?? {
        id: id,
        title: "",
      },
    [infoData, id]
  )
  const topicInfo = infoData?.topic

  const [pageSize] = useState<number>(15)

  const fetcherPosts = async (url: string): Promise<PostPage> => {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to load")
    return (await res.json()) as PostPage
  }
  const getKey = (index: number) =>
    `/api/topic/${id}/posts?page=${index + 1}&pageSize=${pageSize}`
  const {
    data: postsPages,
    mutate: mutatePosts,
    size,
    setSize,
    isLoading: loadingPosts,
    isValidating: validatingPosts,
  } = useSWRInfinite<PostPage>(getKey, fetcherPosts, {
    revalidateOnFocus: false,
  })
  const posts = useMemo(
    () => (postsPages ? postsPages.flatMap((p) => p.items) : []),
    [postsPages]
  )
  const lastPage =
    postsPages && postsPages.length > 0
      ? postsPages[postsPages.length - 1]
      : undefined
  const totalPosts = lastPage?.total ?? posts.length
  const hasMore = lastPage?.hasMore ?? false

  const fetcherRelated = async (url: string): Promise<RelatedResult> => {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to load")
    return (await res.json()) as RelatedResult
  }
  const {
    data: relatedData,
    isLoading: loadingRelated,
    mutate: mutateRelated,
  } = useSWR<RelatedResult>(`/api/topic/${id}/related`, fetcherRelated, {
    revalidateOnFocus: false,
  })

  const relatedTopics = relatedData?.relatedTopics ?? []

  useEffect(() => {}, [id])

  const [replyContent, setReplyContent] = useState<string>("")
  const [replyToPostId, setReplyToPostId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [replyOpen, setReplyOpen] = useState<boolean>(false)
  const loading = loadingInfo || (loadingPosts && posts.length === 0)
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
  const { trigger: triggerReply } = useSWRMutation<
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
      const prevPages = postsPages
      if (!prevPages) {
        toast.error(tc("Error.requestFailed"))
        return
      }
      const tempId = `temp-${Date.now()}`
      const optimistic: PostItem = {
        id: tempId,
        author: {
          id: currentUserId ?? "0",
          name: currentUserProfile?.username ?? "",
          avatar: currentUserProfile?.avatar ?? "",
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
      await mutatePosts((pages) => {
        if (!pages || pages.length === 0) {
          return [
            {
              items: [optimistic],
              page: 1,
              pageSize,
              total: 1,
              hasMore: false,
            },
          ]
        }
        const next = [...pages]
        const last = { ...next[next.length - 1] }
        last.items = [...last.items, optimistic]
        last.total = (last.total ?? posts.length) + 1
        next[next.length - 1] = last
        return next
      }, false)
      await triggerReply({
        content,
        parentId: replyToPostId ?? undefined,
      })
      await mutatePosts(undefined, true)
      const nextPosts = postsPages ? postsPages.flatMap((p) => p.items) : []
      toast.success(tc("Action.success"))
      const newIndex = nextPosts.length
      const el = document.getElementById(`post-${newIndex}`)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
    } catch (e) {
      const status = Number((e as Error).message)
      if (status === 401) toast.error(tc("Error.unauthorized"))
      else toast.error(tc("Error.requestFailed"))
      await mutatePosts(undefined, false)
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
      if (!editPostId) return
      setMutatingPostId(editPostId)
      await mutatePosts(
        (pages) =>
          pages?.map((pg) => ({
            ...pg,
            items: pg.items.map((p) =>
              p.id === editPostId ? { ...p, content: value } : p
            ),
          })) ?? pages,
        false
      )
      await triggerEdit({ postId: editPostId, content: value })
      setEditOpen(false)
      await mutatePosts(undefined, true)
      const nextFlat = postsPages ? postsPages.flatMap((p) => p.items) : []
      toast.success(tc("Action.success"))
      const idx = nextFlat.findIndex((p) => p.id === editPostId)
      const el = document.getElementById(`post-${idx + 1}`)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
    } catch (e) {
      const status = Number((e as Error).message)
      if (status === 401) toast.error(tc("Error.unauthorized"))
      else if (status === 403) toast.error(tc("Error.forbidden"))
      else toast.error(tc("Error.requestFailed"))
      await mutatePosts(undefined, false)
    } finally {
      setEditSubmitting(false)
      setMutatingPostId(null)
    }
  }
  const onClickDelete = async (postId: string) => {
    if (!window.confirm(t("deleteConfirm"))) return
    try {
      setMutatingPostId(postId)
      await mutatePosts(
        (pages) =>
          pages?.map((pg) => ({
            ...pg,
            items: pg.items.map((p) =>
              p.id === postId ? { ...p, isDeleted: true } : p
            ),
          })) ?? pages,
        false
      )
      await triggerDelete({ postId })
      await mutatePosts(undefined, true)
      toast.success(tc("Action.success"))
    } catch (e) {
      const status = Number((e as Error).message)
      if (status === 401) toast.error(tc("Error.unauthorized"))
      else if (status === 403) toast.error(tc("Error.forbidden"))
      else toast.error(tc("Error.requestFailed"))
      await mutatePosts(undefined, false)
    } finally {
      setMutatingPostId(null)
    }
  }

  useEffect(() => {
    const sentinel = document.getElementById("posts-sentinel")
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (
        entry.isIntersecting &&
        hasMore &&
        !validatingPosts &&
        !loadingPosts
      ) {
        setSize(size + 1)
      }
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, validatingPosts, loadingPosts, size, setSize])

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
              {topicInfo?.category ? (
                <Badge variant="secondary">
                  {topicInfo.category.icon ?? "📁"} {topicInfo.category.name}
                </Badge>
              ) : null}
              {(topicInfo?.tags ?? []).map((tag) => (
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
                                  setMutatingPostId(post.id)
                                  const optimisticLiked = !post.liked
                                  const optimisticCount =
                                    post.likes + (optimisticLiked ? 1 : -1)
                                  await mutatePosts(
                                    (pages) =>
                                      pages?.map((pg) => ({
                                        ...pg,
                                        items: pg.items.map((p) =>
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
                                      })) ?? pages,
                                    false
                                  )
                                  try {
                                    const result = await triggerLike({
                                      postId: post.id,
                                    })
                                    await mutatePosts(
                                      (pages) =>
                                        pages?.map((pg) => ({
                                          ...pg,
                                          items: pg.items.map((p) =>
                                            p.id === post.id
                                              ? {
                                                  ...p,
                                                  liked: result.liked,
                                                  likes: result.count,
                                                }
                                              : p
                                          ),
                                        })) ?? pages,
                                      false
                                    )
                                  } catch (e) {
                                    const status = Number((e as Error).message)
                                    if (status === 401) {
                                      toast.error(tc("Error.unauthorized"))
                                    } else {
                                      toast.error(tc("Error.requestFailed"))
                                    }
                                    await mutatePosts(undefined, false)
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
              {hasMore && (
                <>
                  {Array.from({ length: 3 }, (_, i) => i).map((i) => (
                    <TimelineStepsItem
                      key={`next-s-${i}`}
                      id={i === 2 ? "posts-sentinel" : undefined}
                    >
                      <TimelineStepsConnector />
                      <TimelineStepsIcon
                        size="lg"
                        className="overflow-hidden p-0"
                      >
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
                </>
              )}
            </TimelineSteps>
          )}
        </div>
        {loading ? (
          <div className="w-48">
            <Skeleton className="h-64 w-full" />
          </div>
        ) : (
          <TopicNavigator total={totalPosts} />
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
