"use client"

import { memo, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import useSWRInfinite from "swr/infinite"
import { useTranslations } from "next-intl"
import { Users, MessageCircle, Plus, Upload } from "lucide-react"
import { cn, stripHtmlAndTruncate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { RelativeTime } from "@/components/common/relative-time"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type ConversationListItem = {
  id: string
  type: "SINGLE" | "GROUP"
  otherUser?: {
    id: string
    name: string
    avatar: string | null
    isDeleted: boolean
  } | null
  title?: string | null
  avatar?: string | null
  memberCount?: number
  lastMessage?: {
    id: string
    content: string
    isRead: boolean
    isSentByMe: boolean
    createdAt: string
  } | null
  updatedAt: string
}

type ConversationListResult = {
  items: ConversationListItem[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

type DiscoverItem = {
  id: string
  title: string
  avatar: string | null
  memberCount: number
  updatedAt: string
  lastMessage: {
    id: string
    content: string
    createdAt: string
  } | null
}

type DiscoverResult = {
  items: DiscoverItem[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    throw new Error("failed")
  }
  return res.json()
}

export const ConversationsSidebar = memo(function ConversationsSidebar() {
  const t = useTranslations("Conversations")
  const router = useRouter()
  const params = useParams()
  const [tab, setTab] = useState("mine")
  const [joiningId, setJoiningId] = useState<string | null>(null)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [groupTitle, setGroupTitle] = useState("")
  const [groupAvatar, setGroupAvatar] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const selectedId =
    typeof params?.id === "string" ? (params.id as string) : null

  // 使用 ref 保存初始选中的会话 ID，避免切换会话时触发列表刷新
  const initialSelectedIdRef = useRef(selectedId)

  const getConversationsKey = (
    pageIndex: number,
    previousPageData: ConversationListResult | null
  ) => {
    if (previousPageData && !previousPageData.hasMore) return null
    const page = pageIndex + 1
    const initialId = initialSelectedIdRef.current
    const highlight = page === 1 && initialId ? `&highlightId=${initialId}` : ""
    return `/api/conversations?page=${page}&pageSize=30${highlight}`
  }

  const {
    data: conversationPages,
    isLoading: conversationsLoading,
    size: conversationSize,
    setSize: setConversationSize,
    mutate: mutateConversations,
  } = useSWRInfinite<ConversationListResult>(getConversationsKey, fetcher)

  const getDiscoverKey = (
    pageIndex: number,
    previousPageData: DiscoverResult | null
  ) => {
    if (tab !== "discover") return null
    if (previousPageData && !previousPageData.hasMore) return null
    const page = pageIndex + 1
    return `/api/conversations/discover?page=${page}&pageSize=20`
  }

  const {
    data: discoverPages,
    isLoading: discoverLoading,
    size: discoverSize,
    setSize: setDiscoverSize,
    mutate: mutateDiscover,
  } = useSWRInfinite<DiscoverResult>(getDiscoverKey, fetcher)

  const conversations = useMemo(() => {
    if (!conversationPages) return []
    const seen = new Set<string>()
    const items: ConversationListItem[] = []
    for (const page of conversationPages) {
      for (const item of page.items) {
        if (seen.has(item.id)) continue
        seen.add(item.id)
        items.push(item)
      }
    }
    return items
  }, [conversationPages])

  const discoverItems = useMemo(() => {
    if (!discoverPages) return []
    const seen = new Set<string>()
    const items: DiscoverItem[] = []
    for (const page of discoverPages) {
      for (const item of page.items) {
        if (seen.has(item.id)) continue
        seen.add(item.id)
        items.push(item)
      }
    }
    return items
  }, [discoverPages])

  const hasMoreConversations =
    conversationPages?.[conversationPages.length - 1]?.hasMore ?? false
  const hasMoreDiscover =
    discoverPages?.[discoverPages.length - 1]?.hasMore ?? false

  const handleJoin = async (conversationId: string) => {
    if (joiningId) return
    setJoiningId(conversationId)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/join`, {
        method: "POST",
      })
      if (!res.ok) {
        throw new Error("failed")
      }
      await Promise.all([mutateConversations(), mutateDiscover()])
      router.push(`/conversations/${conversationId}`)
    } catch (error) {
      console.error("Failed to join conversation:", error)
    } finally {
      setJoiningId(null)
    }
  }

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type)) {
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      return
    }

    setGroupAvatar(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      setAvatarPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleCreateGroup = async () => {
    if (creating || !groupTitle.trim()) return
    setCreating(true)
    try {
      const formData = new FormData()
      formData.append("type", "GROUP")
      formData.append("title", groupTitle.trim())
      if (groupAvatar) {
        formData.append("avatar", groupAvatar)
      }

      const res = await fetch("/api/conversations", {
        method: "POST",
        body: formData,
      })
      if (!res.ok) {
        throw new Error("failed")
      }
      const data: { conversation: { id: string } } = await res.json()
      await mutateConversations()
      setCreateDialogOpen(false)
      setGroupTitle("")
      setGroupAvatar(null)
      setAvatarPreview(null)
      setTab("mine")
      router.push(`/conversations/${data.conversation.id}`)
    } catch (error) {
      console.error("Failed to create group:", error)
    } finally {
      setCreating(false)
    }
  }

  return (
    <aside className="flex flex-col w-full max-lg:border-b max-lg:max-h-[40vh] lg:w-80 bg-background shrink-0">
      <div className="flex items-center justify-between px-4 py-4 border-b shrink-0">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <MessageCircle className="size-5 text-muted-foreground" />
          {t("title")}
        </div>
      </div>
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="flex flex-col flex-1 min-h-0 w-full gap-0"
      >
        <div className="px-4 py-3 border-b shrink-0">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="mine">{t("tabs.mine")}</TabsTrigger>
            <TabsTrigger value="discover">{t("tabs.discover")}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="mine" className="mt-0 flex-1 min-h-0">
          <ScrollArea className="h-full">
            <div className="px-4 py-4 space-y-2">
              {conversationsLoading && (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-xl border px-3 py-3"
                    >
                      <Skeleton className="size-10 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                        <Skeleton className="h-3 w-full" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {!conversationsLoading && conversations.length === 0 && (
                <div className="text-sm text-muted-foreground py-10 text-center">
                  {t("empty.mine")}
                </div>
              )}
              {conversations.map((item) => {
                const isActive = selectedId === item.id
                const title =
                  item.type === "SINGLE"
                    ? item.otherUser?.isDeleted
                      ? t("meta.deletedUser")
                      : item.otherUser?.name || t("meta.unknownUser")
                    : item.title || t("meta.untitledGroup")
                const avatar =
                  item.type === "SINGLE"
                    ? item.otherUser?.avatar || undefined
                    : item.avatar || undefined
                const lastMessage = item.lastMessage
                const preview = lastMessage
                  ? stripHtmlAndTruncate(lastMessage.content, 80)
                  : t("empty.noMessages")

                return (
                  <Link
                    key={item.id}
                    href={`/conversations/${item.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-3 border transition-colors",
                      isActive
                        ? "bg-accent border-accent"
                        : "hover:bg-accent/50"
                    )}
                  >
                    <Avatar className="size-10">
                      <AvatarImage src={avatar} alt={title} />
                      <AvatarFallback>{title.slice(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <div className="text-sm font-semibold truncate">
                          {title}
                        </div>
                        <div className="text-xs text-muted-foreground shrink-0">
                          <RelativeTime
                            date={
                              lastMessage?.createdAt
                                ? lastMessage.createdAt
                                : item.updatedAt
                            }
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">
                          {lastMessage?.isSentByMe ? `${t("meta.you")}: ` : ""}
                          {preview}
                        </span>
                        {!lastMessage?.isRead && (
                          <span className="size-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
              {hasMoreConversations && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setConversationSize(conversationSize + 1)}
                  >
                    {t("actions.loadMore")}
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent
          value="discover"
          className="mt-0 flex-1 min-h-0 flex flex-col"
        >
          <ScrollArea className="flex-1 min-h-0">
            <div className="px-4 py-4 space-y-3">
              {discoverLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-xl border px-3 py-3"
                    >
                      <Skeleton className="size-10 rounded-full shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-10" />
                        </div>
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                      <Skeleton className="h-8 w-12 rounded-md shrink-0" />
                    </div>
                  ))}
                </div>
              )}
              {!discoverLoading && discoverItems.length === 0 && (
                <div className="text-sm text-muted-foreground py-10 text-center">
                  {t("empty.discover")}
                </div>
              )}
              {discoverItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-3 rounded-xl border px-3 py-3"
                >
                  <Avatar className="size-10">
                    <AvatarImage
                      src={item.avatar || undefined}
                      alt={item.title}
                    />
                    <AvatarFallback>
                      <Users className="size-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold truncate">
                        {item.title || t("meta.untitledGroup")}
                      </div>
                      <div className="text-xs text-muted-foreground shrink-0">
                        <RelativeTime date={item.updatedAt} />
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {t("meta.members", { count: item.memberCount })}
                    </div>
                    {item.lastMessage && (
                      <div className="text-xs text-muted-foreground truncate">
                        {stripHtmlAndTruncate(item.lastMessage.content, 60)}
                      </div>
                    )}
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleJoin(item.id)}
                    disabled={joiningId === item.id}
                  >
                    {joiningId === item.id
                      ? t("actions.joining")
                      : t("actions.join")}
                  </Button>
                </div>
              ))}
              {hasMoreDiscover && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => setDiscoverSize(discoverSize + 1)}
                  >
                    {t("actions.loadMore")}
                  </Button>
                </div>
              )}
            </div>
          </ScrollArea>
          <div className="px-4 py-3 border-t shrink-0">
            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button className="w-full gap-2">
                  <Plus className="size-4" />
                  {t("actions.createGroup")}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t("createGroup.title")}</DialogTitle>
                  <DialogDescription>
                    {t("createGroup.description")}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="size-16">
                      <AvatarImage src={avatarPreview || undefined} />
                      <AvatarFallback>
                        <Users className="size-6" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <Label>{t("createGroup.avatarLabel")}</Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        {t("createGroup.avatarHint")}
                      </p>
                      <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/jpeg,image/png,image/webp,image/gif"
                        onChange={handleAvatarChange}
                        className="hidden"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => avatarInputRef.current?.click()}
                      >
                        <Upload className="size-4 mr-2" />
                        {t("createGroup.uploadAvatar")}
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="group-title">
                      {t("createGroup.nameLabel")}
                    </Label>
                    <Input
                      id="group-title"
                      value={groupTitle}
                      onChange={(e) => setGroupTitle(e.target.value)}
                      placeholder={t("createGroup.namePlaceholder")}
                      maxLength={64}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCreateDialogOpen(false)}
                  >
                    {t("createGroup.cancel")}
                  </Button>
                  <Button
                    onClick={handleCreateGroup}
                    disabled={creating || !groupTitle.trim()}
                  >
                    {creating
                      ? t("createGroup.creating")
                      : t("createGroup.create")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>
      </Tabs>
    </aside>
  )
})
