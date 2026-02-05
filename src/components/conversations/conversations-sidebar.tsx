"use client"

import { memo, useMemo, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import useSWR, { mutate } from "swr"
import { useTranslations } from "next-intl"
import { Users, MessageCircle } from "lucide-react"
import { cn, stripHtmlAndTruncate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { RelativeTime } from "@/components/common/relative-time"

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
  conversations: ConversationListItem[]
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
  const selectedId =
    typeof params?.id === "string" ? (params.id as string) : null

  const conversationsUrl = useMemo(() => {
    if (!selectedId) return "/api/conversations"
    return `/api/conversations?highlightId=${selectedId}`
  }, [selectedId])

  const { data, isLoading } = useSWR<ConversationListResult>(
    conversationsUrl,
    fetcher
  )

  const discoverKey = tab === "discover" ? "/api/conversations/discover" : null
  const { data: discoverData, isLoading: discoverLoading } =
    useSWR<DiscoverResult>(discoverKey, fetcher)

  const conversations = data?.conversations || []
  const discoverItems = discoverData?.items || []

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
      await Promise.all([
        mutate(conversationsUrl),
        mutate("/api/conversations/discover"),
      ])
      router.push(`/conversations/${conversationId}`)
    } catch (error) {
      console.error("Failed to join conversation:", error)
    } finally {
      setJoiningId(null)
    }
  }

  return (
    <aside className="w-full max-lg:border-b lg:w-64 bg-background">
      <div className="flex items-center justify-between px-4 py-4 border-b">
        <div className="flex items-center gap-2 font-semibold text-lg">
          <MessageCircle className="size-5 text-muted-foreground" />
          {t("title")}
        </div>
      </div>
      <Tabs value={tab} onValueChange={setTab} className="w-full gap-0">
        <div className="px-4 py-3 border-b">
          <TabsList className="w-full grid grid-cols-2">
            <TabsTrigger value="mine">{t("tabs.mine")}</TabsTrigger>
            <TabsTrigger value="discover">{t("tabs.discover")}</TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="mine" className="mt-0">
          <ScrollArea className="h-[calc(100vh-210px)] max-lg:h-auto max-lg:max-h-[45vh]">
            <div className="px-4 py-4 space-y-2">
              {isLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 6 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-16 w-full rounded-xl" />
                  ))}
                </div>
              )}
              {!isLoading && conversations.length === 0 && (
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
            </div>
          </ScrollArea>
        </TabsContent>
        <TabsContent value="discover" className="mt-0">
          <ScrollArea className="h-[calc(100vh-210px)] max-lg:h-auto max-lg:max-h-[45vh]">
            <div className="px-4 py-4 space-y-3">
              {discoverLoading && (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, idx) => (
                    <Skeleton key={idx} className="h-20 w-full rounded-xl" />
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
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </aside>
  )
})
