"use client"

import { useParams } from "next/navigation"
import Link from "next/link"
import { TimelineSteps } from "@/components/ui/timeline-steps"
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
import { useEffect, useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { RelativeTime } from "@/components/common/relative-time"
import { Skeleton } from "@/components/ui/skeleton"
import useSWR from "swr"
import useSWRInfinite from "swr/infinite"
import useSWRMutation from "swr/mutation"
import { PostSkeletonList } from "@/components/topic/post-skeleton-list"
import { TopicPostItem } from "@/components/topic/topic-post-item"
import {
  PostItem,
  TopicInfoResult,
  PostPage,
  RelatedResult,
} from "@/types/topic"
import { CategoryBadge } from "@/components/common/category-badge"
import { TagBadge } from "@/components/common/tag-badge"
import { TopicStatusTags } from "@/components/common/topic-status-tags"
import { PollDisplay } from "@/components/topic/poll-display"
import { BountyDisplay } from "@/components/topic/bounty-display"
import { QuestionAcceptanceDisplay } from "@/components/topic/question-acceptance-display"
import { LotteryDisplay } from "@/components/topic/lottery-display"
import { type TopicTypeValue, TopicType, BountyType } from "@/types/topic-type"
import { ReactNode } from "react"
import { type Value } from "platejs"

export default function TopicPage() {
  const { id } = useParams<{ id: string }>()
  const tc = useTranslations("Common")
  const t = useTranslations("Topic")
  const tb = useTranslations("Topic.Bounty")
  const tq = useTranslations("Topic.Question")
  const te = useTranslations("Error")

  const fetcherInfo = async (url: string): Promise<TopicInfoResult> => {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to load")
    return (await res.json()) as TopicInfoResult
  }
  const { data: infoData, isLoading: loadingInfo } = useSWR<TopicInfoResult>(
    `/api/topic/${id}/info`,
    fetcherInfo,
    {
      revalidateOnFocus: false,
    }
  )
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
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [currentUserProfile, setCurrentUserProfile] = useState<{
    id: string
    username: string
    avatar: string
  } | null>(null)
  const [replyContent, setReplyContent] = useState<Value | undefined>(undefined)
  const [replyToPostId, setReplyToPostId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [replyOpen, setReplyOpen] = useState<boolean>(false)
  const [editOpen, setEditOpen] = useState<boolean>(false)
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false)
  const [editPostId, setEditPostId] = useState<string | null>(null)
  const [editInitial, setEditInitial] = useState<Value | undefined>(undefined)
  const [mutatingPostId, setMutatingPostId] = useState<string | null>(null)
  const [previousPostsLength, setPreviousPostsLength] = useState<number>(0)
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null)
  const [bountyConfig, setBountyConfig] = useState<{
    bountyTotal: number
    bountyType: string
    remainingSlots: number
    singleAmount: number | null
  } | null>(null)

  const fetcherPosts = async (url: string): Promise<PostPage> => {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error("Failed to load")
    return (await res.json()) as PostPage
  }
  const getKey = (
    index: number,
    previousPageData: PostPage | null
  ): string | null => {
    if (previousPageData && !previousPageData.hasMore) return null
    return `/api/topic/${id}/posts?page=${index + 1}&pageSize=${pageSize}`
  }
  const {
    data: postsPages,
    mutate: mutatePosts,
    setSize,
    isLoading: loadingPosts,
    isValidating: validatingPosts,
  } = useSWRInfinite<PostPage>(getKey, fetcherPosts, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
  })
  const posts = useMemo(
    () => (postsPages ? postsPages.flatMap((p) => p.items) : []),
    [postsPages]
  )

  useEffect(() => {
    if (posts.length > previousPostsLength && previousPostsLength > 0) {
      setHighlightIndex(previousPostsLength)
      const timer = setTimeout(() => {
        setHighlightIndex(null)
      }, 2000)
      return () => clearTimeout(timer)
    }
    setPreviousPostsLength(posts.length)
  }, [posts.length, previousPostsLength])

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
  const { data: relatedData, isLoading: loadingRelated } =
    useSWR<RelatedResult>(`/api/topic/${id}/related`, fetcherRelated, {
      revalidateOnFocus: false,
    })

  const relatedTopics = relatedData?.relatedTopics ?? []

  useEffect(() => {}, [id])

  const postListLoading = loadingPosts && posts.length === 0
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const likeAction = async (postId: string) => {
    const target = posts.find((p) => p.id === postId)
    if (!target) return
    setMutatingPostId(postId)
    const optimisticLiked = !target.liked
    const optimisticCount = target.likes + (optimisticLiked ? 1 : -1)
    await mutatePosts(
      (pages) =>
        pages?.map((pg) => ({
          ...pg,
          items: pg.items.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  liked: optimisticLiked,
                  likes: Math.max(optimisticCount, 0),
                }
              : p
          ),
        })) ?? pages,
      false
    )
    try {
      const result = await triggerLike({ postId })
      await mutatePosts(
        (pages) =>
          pages?.map((pg) => ({
            ...pg,
            items: pg.items.map((p) =>
              p.id === postId
                ? { ...p, liked: result.liked, likes: result.count }
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
  }

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
  const bookmarkAction = async (postId: string) => {
    const target = posts.find((p) => p.id === postId)
    if (!target) return
    setMutatingPostId(postId)
    const optimisticBookmarked = !target.bookmarked
    const optimisticCount = target.bookmarks + (optimisticBookmarked ? 1 : -1)
    await mutatePosts(
      (pages) =>
        pages?.map((pg) => ({
          ...pg,
          items: pg.items.map((p) =>
            p.id === postId
              ? {
                  ...p,
                  bookmarked: optimisticBookmarked,
                  bookmarks: Math.max(optimisticCount, 0),
                }
              : p
          ),
        })) ?? pages,
      false
    )
    try {
      const result = await triggerBookmark({ postId })
      await mutatePosts(
        (pages) =>
          pages?.map((pg) => ({
            ...pg,
            items: pg.items.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    bookmarked: result.bookmarked,
                    bookmarks: result.count,
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
  }
  type BookmarkResult = { bookmarked: boolean; count: number }
  type BookmarkArg = { postId: string }
  const { trigger: triggerBookmark, isMutating: bookmarkMutating } =
    useSWRMutation<BookmarkResult, Error, string, BookmarkArg>(
      "/mutations/post-bookmark",
      async (_key, { arg }) => {
        const res = await fetch(`/api/post/${arg.postId}/bookmark`, {
          method: "POST",
        })
        if (!res.ok) throw new Error(String(res.status))
        return (await res.json()) as BookmarkResult
      }
    )
  type EditArg = { postId: string; content: Value; contentHtml: string }
  const { trigger: triggerEdit, isMutating: editMutating } = useSWRMutation<
    { ok: boolean },
    Error,
    string,
    EditArg
  >("/mutations/post-edit", async (_key, { arg }) => {
    const res = await fetch(`/api/post/${arg.postId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content: arg.content,
        contentHtml: arg.contentHtml,
      }),
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
  type ReplyArg = { content: Value; contentHtml: string; parentId?: string }
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

  type RewardArg = { postId: string; receiverId: string }
  type RewardResult = {
    success: boolean
    amount: number
    remainingSlots: number
    isSettled: boolean
  }
  const { trigger: triggerReward, isMutating: rewardMutating } = useSWRMutation<
    RewardResult,
    Error,
    string,
    RewardArg
  >(`/mutations/bounty-reward-${id}`, async (_key, { arg }) => {
    const res = await fetch(`/api/topic/${id}/reward`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: arg.postId }),
    })
    if (!res.ok) throw new Error(String(res.status))
    return (await res.json()) as RewardResult
  })

  type AcceptArg = { postId: string | null }
  type AcceptResult = {
    success: boolean
    isSettled: boolean
    acceptedPostId: string | null
  }
  const { trigger: triggerAccept, isMutating: acceptMutating } = useSWRMutation<
    AcceptResult,
    Error,
    string,
    AcceptArg
  >(`/mutations/question-accept-${id}`, async (_key, { arg }) => {
    const res = await fetch(`/api/topic/${id}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: arg.postId }),
    })
    if (!res.ok) throw new Error(String(res.status))
    return (await res.json()) as AcceptResult
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
              isAdmin: boolean
              credits: number
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

  // 获取悬赏配置
  useEffect(() => {
    if (!topicInfo || topicInfo.type !== TopicType.BOUNTY) return
    const fetchBountyConfig = async () => {
      try {
        const res = await fetch(`/api/topic/${id}/bounty`, {
          cache: "no-store",
        })
        if (res.ok) {
          const data = await res.json()
          setBountyConfig({
            bountyTotal: data.bountyTotal,
            bountyType: data.bountyType,
            remainingSlots: data.remainingSlots,
            singleAmount: data.singleAmount,
          })
        }
      } catch {}
    }
    fetchBountyConfig()
  }, [id, topicInfo])

  const onClickReply = (postId: string, authorName: string) => {
    setReplyToPostId(postId)
    setReplyContent([
      {
        type: "p",
        children: [{ text: `@${authorName} ` }],
      },
    ] as Value)
    setReplyOpen(true)
  }

  const submitReply = async (content: Value, html: string) => {
    if (!content || content.length === 0) {
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
        content: JSON.stringify(content),
        contentHtml: html,
        createdAt: new Date().toISOString(),
        minutesAgo: 0,
        isDeleted: false,
        likes: 0,
        liked: false,
        bookmarks: 0,
        bookmarked: false,
      }
      setReplyOpen(false)
      setReplyContent(undefined)
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
        contentHtml: html,
        parentId: replyToPostId ?? undefined,
      })
      await mutatePosts((pages) => pages, true)
      const nextPosts = postsPages ? postsPages.flatMap((p) => p.items) : []
      toast.success(tc("Action.success"))
      const newIndex = nextPosts.length
      const el = document.getElementById(`post-${newIndex}`)
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
    } catch (e) {
      const status = Number((e as Error).message)
      if (status === 401) toast.error(tc("Error.unauthorized"))
      else toast.error(tc("Error.requestFailed"))
      await mutatePosts((pages) => pages, true)
    } finally {
      setSubmitting(false)
    }
  }

  const onClickEdit = (postId: string, initialContent: string) => {
    setEditPostId(postId)
    try {
      setEditInitial(JSON.parse(initialContent) as Value)
    } catch (e) {
      // 如果不是有效的 JSON，包装成段落（处理可能的脏数据）
      setEditInitial([
        {
          type: "p",
          children: [{ text: initialContent }],
        },
      ])
    }
    setEditOpen(true)
  }
  const submitEdit = async (content: Value, html: string) => {
    if (!content || content.length === 0) {
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
              p.id === editPostId
                ? {
                    ...p,
                    content: JSON.stringify(content),
                    contentHtml: html,
                  }
                : p
            ),
          })) ?? pages,
        false
      )
      await triggerEdit({
        postId: editPostId,
        content,
        contentHtml: html,
      })
      setEditOpen(false)
      await mutatePosts((pages) => pages, true)
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
      await mutatePosts((pages) => pages, true)
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
      await mutatePosts((pages) => pages, true)
      toast.success(tc("Action.success"))
    } catch (e) {
      const status = Number((e as Error).message)
      if (status === 401) toast.error(tc("Error.unauthorized"))
      else if (status === 403) toast.error(tc("Error.forbidden"))
      else toast.error(tc("Error.requestFailed"))
      await mutatePosts((pages) => pages, true)
    } finally {
      setMutatingPostId(null)
    }
  }

  const onReward = async (
    postId: string,
    receiverId: string,
    amount: number
  ) => {
    if (
      !window.confirm(
        tb("action.confirmMessage", {
          user: posts.find((p) => p.id === postId)?.author.name ?? "",
          amount,
        })
      )
    )
      return
    try {
      setMutatingPostId(postId)
      const result = await triggerReward({ postId, receiverId })
      await mutatePosts((pages) => pages, true)
      toast.success(
        tb("success.rewarded", { remaining: result.remainingSlots })
      )
      // 更新悬赏配置
      if (bountyConfig) {
        setBountyConfig({
          ...bountyConfig,
          remainingSlots: result.remainingSlots,
        })
      }
    } catch (e) {
      const status = Number((e as Error).message)
      if (status === 401) toast.error(te("unauthorized"))
      else if (status === 403) toast.error(tb("error.onlyOwnerCanReward"))
      else if (status === 400) toast.error(tb("error.alreadyRewarded"))
      else if (status === 409) toast.error(tb("error.noRemainingSlots"))
      else if (status === 410) toast.error(tb("error.alreadySettled"))
      else toast.error(te("requestFailed"))
    } finally {
      setMutatingPostId(null)
    }
  }

  const onAccept = async (postId: string, isAccepted: boolean) => {
    const target = posts.find((p) => p.id === postId)
    if (!target) return
    try {
      setMutatingPostId(postId)
      const currentUserId_ = currentUserId
      const currentUserProfile_ = currentUserProfile

      // 乐观更新：立即更新 UI
      await mutatePosts(
        (pages) =>
          pages?.map((pg) => ({
            ...pg,
            items: pg.items.map((p) => {
              // 如果是取消采纳，清除所有帖子的采纳状态
              if (isAccepted) {
                return {
                  ...p,
                  questionAcceptance: null,
                }
              }
              // 如果是新采纳，只给当前帖子设置采纳状态，其他帖子清除
              if (p.id === postId) {
                return {
                  ...p,
                  questionAcceptance:
                    currentUserId_ && currentUserProfile_
                      ? {
                          acceptedBy: {
                            id: currentUserId_,
                            name: currentUserProfile_.username,
                            avatar: currentUserProfile_.avatar,
                          },
                          acceptedAt: new Date().toISOString(),
                        }
                      : null,
                }
              }
              // 其他帖子清除采纳状态（因为同一时刻只能有一个被采纳的答案）
              return {
                ...p,
                questionAcceptance: null,
              }
            }),
          })) ?? pages,
        false
      )

      const result = await triggerAccept({
        postId: isAccepted ? null : postId,
      })

      // 重新验证数据，确保与服务器一致
      await mutatePosts((pages) => pages, true)

      toast.success(
        isAccepted ? tq("messages.cancelSuccess") : tq("messages.acceptSuccess")
      )
    } catch (e) {
      const status = Number((e as Error).message)
      if (status === 401) toast.error(tc("Error.unauthorized"))
      else if (status === 403) toast.error(tc("Error.forbidden"))
      else
        toast.error(
          isAccepted ? tq("messages.cancelError") : tq("messages.acceptError")
        )
      // 错误时恢复数据
      await mutatePosts((pages) => pages, true)
    } finally {
      setMutatingPostId(null)
    }
  }

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (entry.isIntersecting && hasMore && !loadingPosts) {
        setSize((s) => s + 1)
      }
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingPosts, setSize, sentinelRef])

  /**
   * 根据主题类型渲染特定内容插槽
   * @param index - 帖子索引
   * @returns 主题类型特定的内容组件，仅在第一个帖子（楼主）显示
   */
  const renderTopicTypeSlot = (index: number): ReactNode => {
    // 只在第一个帖子（楼主）显示主题类型特定内容
    if (index !== 0 || !topicInfo) return undefined

    switch (topicInfo.type) {
      case TopicType.POLL:
        return (
          <PollDisplay
            topicId={id}
            topicStatus={topicInfo.status || "ACTIVE"}
            endTime={topicInfo.endTime || null}
          />
        )
      case TopicType.BOUNTY:
        return (
          <BountyDisplay
            topicId={id}
            topicIsSettled={topicInfo.isSettled || false}
          />
        )
      case TopicType.QUESTION:
        return (
          <QuestionAcceptanceDisplay
            topicId={id}
            topicIsSettled={topicInfo.isSettled || false}
          />
        )
      case TopicType.LOTTERY:
        return <LotteryDisplay topicId={id} />
      // 未来可以在这里添加其他主题类型的特殊内容
      // case TopicType.EVENT:
      //   return <EventDisplay ... />
      // case TopicType.ANNOUNCEMENT:
      //   return <AnnouncementDisplay ... />
      default:
        return undefined
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col p-8 max-sm:p-4 gap-8">
      <div className="flex flex-col gap-2">
        {loadingInfo ? (
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
            <div>
              {topicInfo && (
                <TopicStatusTags
                  isPinned={topicInfo.isPinned}
                  topicType={topicInfo.type as TopicTypeValue}
                  size="size-5"
                  className="align-middle mr-1"
                />
              )}
              <Link href={`/topic/${topic.id}`} className="align-middle">
                <span className="cursor-pointer max-w-full text-2xl font-medium whitespace-normal wrap-break-word">
                  {topic.title}
                </span>
              </Link>
            </div>
            <div className="flex max-w-full flex-wrap gap-2 overflow-hidden">
              {topicInfo?.category ? (
                <>
                  <CategoryBadge
                    id={topicInfo.category.id}
                    icon={topicInfo.category.icon}
                    name={topicInfo.category.name}
                    description={topicInfo.category.description}
                    bgColor={topicInfo.category.bgColor}
                    textColor={topicInfo.category.textColor}
                  />
                </>
              ) : null}
              {(topicInfo?.tags ?? []).map((tag) => (
                <TagBadge
                  key={tag.id}
                  id={tag.id}
                  icon={tag.icon}
                  name={tag.name}
                  description={tag.description}
                  bgColor={tag.bgColor}
                  textColor={tag.textColor}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className="flex flex-row justify-between gap-16">
        <div className="flex-1">
          {postListLoading ? (
            <TimelineSteps>
              <PostSkeletonList count={8} />
            </TimelineSteps>
          ) : (
            <TimelineSteps>
              {posts.map((post, index) => {
                const isBountyTopic = topicInfo?.type === TopicType.BOUNTY
                const isQuestionTopic = topicInfo?.type === TopicType.QUESTION
                // 通过第一个帖子的作者判断是否为主题作者
                const topicAuthorId = posts[0]?.author.id
                const isTopicOwner =
                  currentUserId && topicAuthorId === currentUserId
                const showBountyButton = Boolean(
                  isBountyTopic &&
                  isTopicOwner &&
                  index !== 0 &&
                  post.author.id !== currentUserId &&
                  bountyConfig &&
                  bountyConfig.remainingSlots > 0
                )
                const bountyAmount = isBountyTopic
                  ? bountyConfig?.bountyType === BountyType.SINGLE
                    ? bountyConfig.bountyTotal
                    : bountyConfig?.singleAmount
                  : undefined

                // 检查是否已有采纳的答案
                const hasAcceptedAnswer = posts.some(
                  (p) =>
                    p.questionAcceptance !== null &&
                    p.questionAcceptance !== undefined
                )
                // 只在以下条件下显示采纳按钮：
                // 1. 是问答类型主题
                // 2. 是主题作者
                // 3. 不是首楼
                // 4. 不是自己的回复
                // 5. 帖子未被删除
                // 6. 还没有已采纳的答案，或者当前就是被采纳的楼层
                const showAcceptButton = Boolean(
                  isQuestionTopic &&
                  isTopicOwner &&
                  index !== 0 &&
                  post.author.id !== currentUserId &&
                  !post.isDeleted &&
                  (!hasAcceptedAnswer || post.questionAcceptance)
                )

                return (
                  <TopicPostItem
                    key={post.id}
                    post={post}
                    index={index}
                    anchorId={`post-${index + 1}`}
                    currentUserId={currentUserId}
                    mutatingPostId={mutatingPostId}
                    likeMutating={likeMutating}
                    bookmarkMutating={bookmarkMutating}
                    editMutating={editMutating}
                    deleteMutating={deleteMutating}
                    onLike={likeAction}
                    onBookmark={bookmarkAction}
                    onEdit={onClickEdit}
                    onDelete={onClickDelete}
                    onReply={onClickReply}
                    floorOpText={t("floor.op")}
                    replyText={t("reply")}
                    deletedText={t("deleted")}
                    highlight={highlightIndex === index}
                    topicTypeSlot={renderTopicTypeSlot(index)}
                    showBountyButton={showBountyButton}
                    onReward={onReward}
                    rewardMutating={rewardMutating}
                    bountyAmount={bountyAmount ?? undefined}
                    showAcceptButton={showAcceptButton}
                    onAccept={onAccept}
                    acceptMutating={acceptMutating}
                  />
                )
              })}
              {validatingPosts && hasMore && <PostSkeletonList count={3} />}
            </TimelineSteps>
          )}
          {!postListLoading && hasMore && (
            <div ref={sentinelRef} className="h-1 w-full" />
          )}
        </div>
        <TopicNavigator
          total={totalPosts}
          loadedCount={posts.length}
          isAuthenticated={!!currentUserId}
          onReplyTopic={() => {
            setReplyToPostId(null)
            setReplyOpen(true)
          }}
          topicLoading={loadingInfo}
          repliesLoading={postListLoading}
        />
      </div>
      <DrawerEditor
        key={`reply-${replyToPostId ?? "topic"}-${replyOpen ? JSON.stringify(replyContent) : ""}`}
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
        onSubmit={submitReply}
        submitText={t("reply")}
        cancelText={tc("Action.cancel")}
        mentionContext={{
          type: "reply",
          topicAuthorId: posts[0]?.author.id,
        }}
      />
      <DrawerEditor
        key={`edit-${editPostId ?? "none"}-${editOpen ? JSON.stringify(editInitial) : ""}`}
        title={t("edit")}
        open={editOpen}
        onOpenChange={setEditOpen}
        initialValue={editInitial}
        submitting={editSubmitting}
        onSubmit={submitEdit}
        submitText={tc("Action.save")}
        cancelText={tc("Action.cancel")}
        mentionContext={{
          type: "reply",
          topicAuthorId: posts[0]?.author.id,
        }}
      />
      <div className="flex flex-col gap-4 mt-12">
        <Table className="w-full table-fixed max-sm:table-auto">
          <colgroup>
            <col />
            <col className="w-20 max-sm:hidden" />
            <col className="w-20 max-sm:hidden" />
            <col className="w-20 max-sm:hidden" />
            <col className="w-16 hidden max-sm:table-cell" />
          </colgroup>
          <TableHeader>
            <TableRow>
              <TableHead className="text-2xl">{tc("Table.related")}</TableHead>
              <TableHead className="text-center max-sm:hidden">
                {tc("Table.replies")}
              </TableHead>
              <TableHead className="text-center max-sm:hidden">
                {tc("Table.views")}
              </TableHead>
              <TableHead className="text-center max-sm:hidden">
                {tc("Table.activity")}
              </TableHead>
              <TableHead className="text-right hidden max-sm:table-cell"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loadingRelated
              ? Array.from({ length: 4 }, (_, i) => i).map((i) => (
                  <TableRow key={`rt-s-${i}`}>
                    <TableCell className="max-w-full">
                      <Skeleton className="h-7 w-80 max-sm:w-64" />
                      <div className="flex max-w-full flex-wrap gap-2 overflow-hidden mt-2">
                        <Skeleton className="h-5 w-24 max-sm:w-20" />
                        <Skeleton className="h-5 w-20 max-sm:w-16" />
                        <Skeleton className="h-5 w-20 max-sm:w-16" />
                      </div>
                    </TableCell>
                    <TableCell className="text-center max-sm:hidden">
                      <Skeleton className="h-4 w-10 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center max-sm:hidden">
                      <Skeleton className="h-4 w-10 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center max-sm:hidden">
                      <Skeleton className="h-4 w-10 mx-auto" />
                    </TableCell>
                    <TableCell className="text-center hidden max-sm:table-cell">
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
                        <CategoryBadge
                          id={t.category.id}
                          icon={t.category.icon}
                          name={t.category.name}
                          description={t.category.description}
                          bgColor={t.category.bgColor}
                          textColor={t.category.textColor}
                        />
                        {t.tags.map((tag) => (
                          <TagBadge
                            key={tag.id}
                            id={tag.id}
                            icon={tag.icon}
                            name={tag.name}
                            description={tag.description}
                            bgColor={tag.bgColor}
                            textColor={tag.textColor}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground max-sm:hidden">
                      {t.replies}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground max-sm:hidden">
                      {t.views}
                    </TableCell>
                    <TableCell className="text-center text-muted-foreground max-sm:hidden">
                      <RelativeTime date={t.activity} />
                    </TableCell>
                    <TableCell className="w-16 text-center text-muted-foreground hidden max-sm:table-cell relative">
                      <span className="absolute top-2 right-0 text-primary">
                        {t.replies}
                      </span>
                      <span className="absolute bottom-2 right-0">
                        <RelativeTime date={t.activity} />
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
