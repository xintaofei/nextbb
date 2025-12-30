"use client"

import useSWR from "swr"
import useSWRMutation from "swr/mutation"
import { useState, useMemo } from "react"

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

type MeResponse = {
  user: { id: string; email: string; isAdmin: boolean; credits: number }
  profile: { id: string; email: string; username: string; avatar: string }
} | null

export function useTopicDetail(topicId: string) {
  const { data, mutate, isLoading } = useSWR<TopicDetail>(
    `/api/topic/${topicId}`
  )
  const { data: me } = useSWR<MeResponse>("/api/auth/me")
  const currentUserId = me?.user?.id ?? null
  const currentUserProfile = me
    ? {
        id: me.profile.id,
        username: me.profile.username,
        avatar: me.profile.avatar,
      }
    : null
  const [mutatingPostId, setMutatingPostId] = useState<string | null>(null)

  type LikeResult = { liked: boolean; count: number }
  type LikeArg = { postId: string }
  const { trigger: triggerLike } = useSWRMutation<
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
  const { trigger: triggerEdit } = useSWRMutation<
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
  const { trigger: triggerDelete } = useSWRMutation<
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
  >(`/mutations/topic-reply-${topicId}`, async (_key, { arg }) => {
    const res = await fetch(`/api/topic/${topicId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(arg),
    })
    if (!res.ok) throw new Error(String(res.status))
    return (await res.json()) as ReplyResult
  })

  const like = async (postId: string) => {
    const prev = data
    if (!prev) return
    setMutatingPostId(postId)
    const target = prev.posts.find((p) => p.id === postId)
    if (!target) return
    const optimisticLiked = !target.liked
    const optimisticCount = target.likes + (optimisticLiked ? 1 : -1)
    await mutate(
      {
        ...prev,
        posts: prev.posts.map((p) =>
          p.id === postId
            ? {
                ...p,
                liked: optimisticLiked,
                likes: Math.max(optimisticCount, 0),
              }
            : p
        ),
      },
      { revalidate: false }
    )
    try {
      const result = await triggerLike({ postId })
      const latest = data
      if (!latest) return
      await mutate(
        {
          ...latest,
          posts: latest.posts.map((p) =>
            p.id === postId
              ? { ...p, liked: result.liked, likes: result.count }
              : p
          ),
        },
        { revalidate: false }
      )
    } finally {
      setMutatingPostId(null)
    }
  }

  const edit = async (postId: string, content: string) => {
    const value = content.trim()
    const prev = data
    if (!prev || !value) return
    setMutatingPostId(postId)
    await mutate(
      {
        ...prev,
        posts: prev.posts.map((p) =>
          p.id === postId ? { ...p, content: value } : p
        ),
      },
      { revalidate: false }
    )
    try {
      await triggerEdit({ postId, content: value })
    } finally {
      setMutatingPostId(null)
    }
  }

  const del = async (postId: string) => {
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
    try {
      await triggerDelete({ postId })
    } finally {
      setMutatingPostId(null)
    }
  }

  const reply = async (content: string, parentId?: string) => {
    const value = content.trim()
    const prev = data
    if (!prev || !value || !currentUserProfile) return
    const tempId = `temp-${Date.now()}`
    const optimistic: PostItem = {
      id: tempId,
      author: {
        id: currentUserProfile.id,
        name: currentUserProfile.username,
        avatar: currentUserProfile.avatar,
      },
      content: value,
      createdAt: new Date().toISOString(),
      minutesAgo: 0,
      isDeleted: false,
      likes: 0,
      liked: false,
    }
    await mutate(
      {
        ...prev,
        posts: [...prev.posts, optimistic],
      },
      { revalidate: false }
    )
    await triggerReply({ content: value, parentId })
  }

  const actions = useMemo(
    () => ({ like, edit, del, reply }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, currentUserProfile]
  )

  return {
    data,
    isLoading,
    mutate,
    currentUserId,
    currentUserProfile,
    mutatingPostId,
    actions,
  }
}
