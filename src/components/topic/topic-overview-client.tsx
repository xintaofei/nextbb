"use client"

import { useParams } from "next/navigation"
import { TimelineSteps } from "@/components/ui/timeline-steps"
import { TopicNavigator } from "@/components/topic/topic-navigator"
import { useTranslations } from "next-intl"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { toast } from "sonner"
import useSWR from "swr"
import useSWRInfinite from "swr/infinite"
import useSWRMutation from "swr/mutation"
import { PostSkeletonList } from "@/components/topic/post-skeleton-list"
import { TopicPostItem } from "@/components/topic/topic-post-item"
import { TopicHeader } from "@/components/topic/topic-header"
import { TopicStats } from "@/components/topic/topic-stats"
import { RelatedTopicsSection } from "@/components/topic/related-topics-section"
import { TopicTypeSlot } from "@/components/topic/topic-type-slot"
import dynamic from "next/dynamic"
import {
  PostItem,
  PostPage,
  RelatedResult,
  TopicInfoResult,
} from "@/types/topic"
import { BountyType, TopicType } from "@/types/topic-type"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Loader2 } from "lucide-react"

const DrawerEditor = dynamic(
  () =>
    import("@/components/editor/drawer-editor").then((mod) => mod.DrawerEditor),
  {
    ssr: false,
    loading: () => null,
  }
)

const fetcherPosts = async (url: string): Promise<PostPage> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load")
  return (await res.json()) as PostPage
}

const fetcherBounty = async (url: string) => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load")
  return (await res.json()) as {
    bountyTotal: number
    bountyType: string
    remainingSlots: number
    singleAmount: number | null
  }
}

const fetcherRelated = async (url: string): Promise<RelatedResult> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to load")
  return (await res.json()) as RelatedResult
}

type TopicOverviewClientProps = {
  topicInfo: TopicInfoResult["topic"]
  initialPosts?: PostPage
  pageSize?: number
}

export default function TopicOverviewClient({
  topicInfo,
  initialPosts,
  pageSize = 15,
}: TopicOverviewClientProps) {
  const { id, locale } = useParams() as { id: string; locale: string }
  const tc = useTranslations("Common")
  const t = useTranslations("Topic")
  const tb = useTranslations("Topic.Bounty")
  const tq = useTranslations("Topic.Question")
  const te = useTranslations("Error")
  const tEditor = useTranslations("Editor")

  // 使用 ref 存储初始数据，fetcher 消费一次后清除，避免第一页重复网络请求
  const initialPostsRef = useRef(initialPosts)
  const initialIdRef = useRef(id)

  // 当话题切换时重置初始数据
  if (id !== initialIdRef.current) {
    initialIdRef.current = id
    initialPostsRef.current = initialPosts
  }

  const [replyContent, setReplyContent] = useState<string>("")
  const [replyToPostId, setReplyToPostId] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [replyOpen, setReplyOpen] = useState<boolean>(false)
  const [editOpen, setEditOpen] = useState<boolean>(false)
  const [editSubmitting, setEditSubmitting] = useState<boolean>(false)
  const [editPostId, setEditPostId] = useState<string | null>(null)
  const [editInitial, setEditInitial] = useState<string>("")
  const [mutatingPostId, setMutatingPostId] = useState<string | null>(null)
  const [highlightIndex, setHighlightIndex] = useState<number | null>(null)
  const [targetFloor, setTargetFloor] = useState<number | null>(null)
  const [isLoadingFloor, setIsLoadingFloor] = useState<boolean>(false)
  const previousPostsLengthRef = useRef(0)
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(
    null
  )

  useEffect(() => {
    const el = document.getElementById("topic-aside-portal")
    if (el) setPortalContainer(el)
  }, [])

  const getKey = useCallback(
    (index: number, previousPageData: PostPage | null) => {
      if (previousPageData && !previousPageData.hasMore) return null
      return [
        `/api/topic/${id}/posts?page=${index + 1}&pageSize=${pageSize}`,
        locale,
      ]
    },
    [id, pageSize, locale]
  )

  // 使用 useCallback 包装 fetcher，避免每次渲染都创建新函数
  // 首次请求 page=1 时返回服务端预取的数据（无网络请求），之后清除以允许真实刷新
  const postsFetcher = useCallback((args: string | [string, string]) => {
    const url = Array.isArray(args) ? args[0] : args
    if (url.includes("page=1") && initialPostsRef.current) {
      const data = initialPostsRef.current
      initialPostsRef.current = undefined
      return Promise.resolve(data)
    }
    return fetcherPosts(url)
  }, [])

  const {
    data: postsPages,
    mutate: mutatePosts,
    setSize,
    isLoading: loadingPosts,
    isValidating: validatingPosts,
  } = useSWRInfinite<PostPage>(getKey, postsFetcher, {
    revalidateOnFocus: false,
    revalidateFirstPage: false,
    fallbackData: initialPosts ? [initialPosts] : undefined,
  })
  const posts = useMemo(
    () => (postsPages ? postsPages.flatMap((p) => p.items) : []),
    [postsPages]
  )

  // 当 ID 变化时重置，避免不同话题切换时的高亮残留
  useEffect(() => {
    previousPostsLengthRef.current = 0
  }, [id])

  useEffect(() => {
    const previousLength = previousPostsLengthRef.current
    // 只有在已有帖子且长度增加时才高亮（加载更多场景）
    if (posts.length > previousLength && previousLength > 0) {
      setHighlightIndex(previousLength)
      const timer = setTimeout(() => {
        setHighlightIndex(null)
      }, 2000)
      previousPostsLengthRef.current = posts.length
      return () => clearTimeout(timer)
    }
    // 更新长度记录
    previousPostsLengthRef.current = posts.length
  }, [posts.length])

  const lastPage =
    postsPages && postsPages.length > 0
      ? postsPages[postsPages.length - 1]
      : undefined
  const totalPosts = lastPage?.total ?? posts.length
  const hasMore = lastPage?.hasMore ?? false

  const { data: relatedData, isLoading: loadingRelated } =
    useSWR<RelatedResult>(`/api/topic/${id}/related`, fetcherRelated, {
      revalidateOnFocus: false,
    })

  const relatedTopics = relatedData?.relatedTopics ?? []

  const replyDescription = useMemo(() => {
    if (!replyToPostId) return undefined
    const index = posts.findIndex((p) => p.id === replyToPostId)
    if (index === -1) return undefined
    return index === 0 ? t("floor.op") : "#" + index
  }, [replyToPostId, posts, t])

  const postsRef = useRef<PostItem[]>([])
  useEffect(() => {
    postsRef.current = posts
  }, [posts])

  const postListLoading = loadingPosts && posts.length === 0
  const sentinelRef = useRef<HTMLDivElement | null>(null)

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

  type EditArg = { postId: string; content: string; contentHtml?: string }
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
        content_html: arg.contentHtml,
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

  type ReplyArg = { content: string; contentHtml?: string; parentId?: string }
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
      body: JSON.stringify({
        content: arg.content,
        content_html: arg.contentHtml,
        parentId: arg.parentId,
      }),
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

  const likeAction = useCallback(
    async (postId: string) => {
      const target = postsRef.current.find((p) => p.id === postId)
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
    },
    [mutatePosts, tc, triggerLike]
  )

  const bookmarkAction = useCallback(
    async (postId: string) => {
      const target = postsRef.current.find((p) => p.id === postId)
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
    },
    [mutatePosts, tc, triggerBookmark]
  )

  const { user: currentUserData } = useCurrentUser()
  const currentUserId = currentUserData?.id ?? null
  const currentUserProfile = useMemo(
    () =>
      currentUserData
        ? {
            id: currentUserData.id,
            name: currentUserData.name,
            avatar: currentUserData.avatar,
          }
        : null,
    [currentUserData]
  )

  // 获取悬赏配置
  const topicType = topicInfo?.type
  const { data: bountyData, mutate: mutateBounty } = useSWR(
    topicType === TopicType.BOUNTY ? `/api/topic/${id}/bounty` : null,
    fetcherBounty,
    {
      revalidateOnFocus: false,
    }
  )
  const bountyConfig = useMemo(
    () =>
      bountyData
        ? {
            bountyTotal: bountyData.bountyTotal,
            bountyType: bountyData.bountyType,
            remainingSlots: bountyData.remainingSlots,
            singleAmount: bountyData.singleAmount,
          }
        : null,
    [bountyData]
  )

  const onClickReply = useCallback((postId: string, authorName: string) => {
    setReplyToPostId(postId)
    setReplyContent(authorName)
    setReplyOpen(true)
  }, [])

  const submitReply = useCallback(
    async (overrideContent?: string, contentHtml?: string) => {
      const content = (overrideContent ?? replyContent).trim()
      if (!content) {
        toast.error(tc("Form.required"))
        return
      }
      setSubmitting(true)
      try {
        const tempId = `temp-${Date.now()}`
        const optimistic: PostItem = {
          id: tempId,
          floorNumber: postsRef.current.length,
          author: {
            id: currentUserId ?? "0",
            name: currentUserProfile?.name ?? "",
            avatar: currentUserProfile?.avatar ?? "",
          },
          content,
          contentHtml,
          sourceLocale: locale,
          contentLocale: locale,
          isFirstUserPost: false,
          createdAt: new Date().toISOString(),
          minutesAgo: 0,
          isDeleted: false,
          likes: 0,
          liked: false,
          bookmarks: 0,
          bookmarked: false,
          replyCount: 0,
          parentId: replyToPostId,
        }
        setReplyOpen(false)
        setReplyContent("")
        setReplyToPostId(null)
        const updatedPages = await mutatePosts((pages) => {
          if (!pages || pages.length === 0) return pages
          const next = [...pages]
          const lastIndex = next.length - 1
          const last = { ...next[lastIndex] }
          last.items = [...last.items, optimistic]
          last.total = (last.total ?? postsRef.current.length) + 1
          next[lastIndex] = last
          return next
        }, false)
        await triggerReply({
          content,
          contentHtml,
          parentId: replyToPostId ?? undefined,
        })
        await mutatePosts((pages) => pages, true)
        toast.success(tc("Action.success"))
        const totalCount =
          updatedPages?.reduce((acc, p) => acc + p.items.length, 0) || 0
        const el = document.getElementById(`post-${totalCount}`)
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" })
      } catch (e) {
        const status = Number((e as Error).message)
        if (status === 401) toast.error(tc("Error.unauthorized"))
        else toast.error(tc("Error.requestFailed"))
        await mutatePosts((pages) => pages, true)
      } finally {
        setSubmitting(false)
      }
    },
    [
      replyContent,
      tc,
      currentUserId,
      currentUserProfile,
      replyToPostId,
      mutatePosts,
      triggerReply,
      locale,
    ]
  )

  const onClickEdit = useCallback((postId: string, initialContent: string) => {
    setEditPostId(postId)
    setEditInitial(initialContent)
    setEditOpen(true)
  }, [])
  const submitEdit = useCallback(
    async (content: string, contentHtml?: string) => {
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
                p.id === editPostId ? { ...p, content: value, contentHtml } : p
              ),
            })) ?? pages,
          false
        )
        await triggerEdit({ postId: editPostId, content: value, contentHtml })
        setEditOpen(false)
        await mutatePosts((pages) => pages, true)
        toast.success(tc("Action.success"))
        const idx = postsRef.current.findIndex((p) => p.id === editPostId)
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
    },
    [editPostId, tc, mutatePosts, triggerEdit]
  )
  const onClickDelete = useCallback(
    async (postId: string) => {
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
    },
    [t, mutatePosts, triggerDelete, tc]
  )

  const onReward = useCallback(
    async (postId: string, receiverId: string, amount: number) => {
      if (
        !window.confirm(
          tb("action.confirmMessage", {
            user:
              postsRef.current.find((p) => p.id === postId)?.author.name ?? "",
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
        await mutateBounty(
          (data) =>
            data
              ? {
                  ...data,
                  remainingSlots: result.remainingSlots,
                }
              : data,
          false
        )
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
    },
    [tb, triggerReward, mutatePosts, te, mutateBounty]
  )

  const onAccept = useCallback(
    async (postId: string, isAccepted: boolean) => {
      const target = postsRef.current.find((p) => p.id === postId)
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
                              name: currentUserProfile_.name,
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

        await triggerAccept({
          postId: isAccepted ? null : postId,
        })

        // 重新验证数据，确保与服务器一致
        await mutatePosts((pages) => pages, true)

        toast.success(
          isAccepted
            ? tq("messages.cancelSuccess")
            : tq("messages.acceptSuccess")
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
    },
    [currentUserId, currentUserProfile, mutatePosts, triggerAccept, tq, tc]
  )

  const parseFloorFromHash = useCallback((hash: string): number | null => {
    const match = hash.match(/^#floor-(\d+)$/)
    if (!match) return null
    const floor = Number.parseInt(match[1], 10)
    if (!Number.isFinite(floor) || floor < 0) return null
    return floor
  }, [])

  // Effect 1: 解析 URL hash 获取目标楼层号
  useEffect(() => {
    const handleHashChange = (): void => {
      const parsedFloor: number | null = parseFloorFromHash(
        window.location.hash
      )
      if (parsedFloor !== null) {
        setTargetFloor(parsedFloor)
        setIsLoadingFloor(true)
      }
    }

    handleHashChange()
    window.addEventListener("hashchange", handleHashChange)
    return () => {
      window.removeEventListener("hashchange", handleHashChange)
    }
  }, [parseFloorFromHash])

  // Effect 2: 自动加载所需页面
  useEffect(() => {
    if (targetFloor === null || !postsPages) return

    // 计算需要加载的页数
    const postsNeeded: number = targetFloor + 1
    const pagesNeeded: number = Math.ceil(postsNeeded / pageSize)
    const currentPages: number = postsPages.length

    if (currentPages < pagesNeeded) {
      setSize(pagesNeeded)
    }
  }, [targetFloor, postsPages, setSize, pageSize])

  // Effect 3: 滚动到目标楼层
  useEffect(() => {
    if (targetFloor === null || !posts.length || loadingPosts) return

    // 查找目标楼层的帖子
    const targetPost = posts.find(
      (p: PostItem) => p.floorNumber === targetFloor
    )
    if (!targetPost) {
      // 所有数据加载完毕但未找到目标楼层
      if (posts.length >= totalPosts) {
        toast.error(t("floor.notFound", { floor: targetFloor }))
        setTargetFloor(null)
        setIsLoadingFloor(false)
      }
      return
    }

    // 找到目标帖子，滚动到该位置
    const targetIndex = posts.indexOf(targetPost)
    const anchorId = `post-${targetIndex + 1}`
    const element = document.getElementById(anchorId)

    if (element) {
      setTimeout(() => {
        element.scrollIntoView({ behavior: "smooth", block: "center" })
        setHighlightIndex(targetIndex)
        setTargetFloor(null)
        setIsLoadingFloor(false)
      }, 100)
    }
  }, [targetFloor, posts, loadingPosts, totalPosts, t])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver((entries) => {
      const entry = entries[0]
      if (
        entry.isIntersecting &&
        hasMore &&
        !loadingPosts &&
        !validatingPosts
      ) {
        setSize((s) => s + 1)
      }
    })
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingPosts, validatingPosts, setSize, sentinelRef])

  return (
    <div className="flex min-h-screen w-full flex-col p-8 max-sm:p-4 gap-4">
      {isLoadingFloor && targetFloor !== null && (
        <div className="fixed top-4 right-4 bg-background/80 backdrop-blur p-3 rounded-md shadow-lg z-50 border">
          <div className="flex items-center gap-2">
            <Loader2 className="animate-spin size-4" />
            <span className="text-sm">
              {t("floor.loading", { floor: targetFloor })}
            </span>
          </div>
        </div>
      )}
      <TopicHeader topicInfo={topicInfo} />

      <div className="w-full">
        <div className="flex-1">
          <TopicStats topicInfo={topicInfo} />
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
                    floorAnchorId={`floor-${post.floorNumber}`}
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
                    repliesText={t("replies")}
                    deletedText={t("deleted")}
                    highlight={highlightIndex === index}
                    topicTypeSlot={
                      <TopicTypeSlot
                        index={index}
                        topicId={id}
                        topicInfo={topicInfo}
                      />
                    }
                    showBountyButton={showBountyButton}
                    onReward={onReward}
                    rewardMutating={rewardMutating}
                    bountyAmount={bountyAmount ?? undefined}
                    showAcceptButton={showAcceptButton}
                    onAccept={onAccept}
                    acceptMutating={acceptMutating}
                    topicAuthorId={topicAuthorId}
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
      </div>
      {portalContainer &&
        createPortal(
          <TopicNavigator
            total={totalPosts}
            loadedCount={posts.length}
            isAuthenticated={!!currentUserId}
            onReplyTopic={() => {
              setReplyToPostId(null)
              setReplyOpen(true)
            }}
            topicLoading={false}
            repliesLoading={postListLoading}
            className="w-full h-auto static"
          />,
          portalContainer
        )}
      <DrawerEditor
        key={`reply-${replyToPostId ?? "topic"}-${replyOpen ? replyContent : ""}`}
        title={t("reply")}
        description={replyDescription}
        open={replyOpen}
        onOpenChange={setReplyOpen}
        initialValue={replyContent}
        submitting={submitting}
        onSubmit={(content: string, contentHtml?: string) => {
          submitReply(content, contentHtml)
        }}
        submitText={t("reply")}
        cancelText={tc("Action.cancel")}
        placeholder={t("replyPlaceholder")}
        slashPlaceholder={tEditor("SlashCommand.slashPlaceholder")}
      />
      <DrawerEditor
        key={`edit-${editPostId ?? "none"}-${editOpen ? editInitial : ""}`}
        title={t("edit")}
        open={editOpen}
        onOpenChange={setEditOpen}
        initialValue={editInitial}
        submitting={editSubmitting}
        onSubmit={(content: string, contentHtml?: string) => {
          submitEdit(content, contentHtml)
        }}
        submitText={tc("Action.save")}
        cancelText={tc("Action.cancel")}
        placeholder={t("replyPlaceholder")}
        slashPlaceholder={tEditor("SlashCommand.slashPlaceholder")}
      />
      <RelatedTopicsSection
        relatedTopics={relatedTopics}
        loading={loadingRelated}
      />
    </div>
  )
}
