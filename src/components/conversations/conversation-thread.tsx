"use client"

import { memo, useMemo, useState } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { MessageCircle, Users } from "lucide-react"
import parse from "html-react-parser"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RelativeTime } from "@/components/common/relative-time"
import { parseOptions } from "@/components/topic/post-parts"

type ConversationDetail = {
  id: string
  type: "SINGLE" | "GROUP"
  title: string | null
  avatar: string | null
  memberCount: number
  otherUser?: {
    id: string
    name: string
    avatar: string | null
    isDeleted: boolean
  } | null
}

type ConversationDetailResponse = {
  conversation: ConversationDetail
  isMember: boolean
}

type MessageItem = {
  id: string
  content: string
  contentHtml: string
  contentLocale: string
  sourceLocale: string
  createdAt: string
  isMine: boolean
  sender: {
    id: string
    name: string
    avatar: string | null
    isDeleted: boolean
  }
}

type MessageListResult = {
  items: MessageItem[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    throw new Error(String(res.status))
  }
  return res.json()
}

type MessageBubbleProps = {
  message: MessageItem
  isGroup: boolean
  deletedUserLabel: string
}

const MessageBubble = memo(function MessageBubble({
  message,
  isGroup,
  deletedUserLabel,
}: MessageBubbleProps) {
  const parsedContent = useMemo(() => {
    if (!message.contentHtml) return null
    return parse(message.contentHtml, parseOptions)
  }, [message.contentHtml])

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        message.isMine && "flex-row-reverse"
      )}
    >
      <Avatar className="size-8">
        <AvatarImage
          src={message.sender.avatar || undefined}
          alt={message.sender.name}
        />
        <AvatarFallback>{message.sender.name.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "max-w-[75%] rounded-2xl border px-4 py-3 text-sm",
          message.isMine
            ? "bg-primary text-primary-foreground border-primary/30"
            : "bg-muted/40"
        )}
      >
        {isGroup && !message.isMine && (
          <div className="mb-1 text-xs text-muted-foreground">
            {message.sender.isDeleted ? deletedUserLabel : message.sender.name}
          </div>
        )}
        {parsedContent ? (
          <div className="prose prose-sm dark:prose-invert max-w-none">
            {parsedContent}
          </div>
        ) : (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )}
        <div
          className={cn(
            "mt-2 text-[11px] text-muted-foreground",
            message.isMine && "text-primary-foreground/70"
          )}
        >
          <RelativeTime date={message.createdAt} />
        </div>
      </div>
    </div>
  )
})

interface ConversationThreadProps {
  conversationId: string
}

export const ConversationThread = memo(function ConversationThread({
  conversationId,
}: ConversationThreadProps) {
  const t = useTranslations("Conversations")
  const [joining, setJoining] = useState(false)

  const {
    data: detail,
    isLoading: detailLoading,
    error: detailError,
    mutate: mutateDetail,
  } = useSWR<ConversationDetailResponse, Error>(
    `/api/conversations/${conversationId}`,
    fetcher
  )

  const isMember = detail?.isMember ?? false

  const messagesKey = useMemo(() => {
    if (!detail) return null
    if (!detail.isMember) return null
    return `/api/conversations/${conversationId}/messages?page=1&pageSize=30`
  }, [conversationId, detail])

  const {
    data: messagesData,
    isLoading: messagesLoading,
    error: messagesError,
    mutate: mutateMessages,
  } = useSWR<MessageListResult, Error>(messagesKey, fetcher)

  const conversation = detail?.conversation

  const title = useMemo(() => {
    if (!conversation) return ""
    if (conversation.type === "SINGLE") {
      if (conversation.otherUser?.isDeleted) {
        return t("meta.deletedUser")
      }
      return conversation.otherUser?.name || t("meta.unknownUser")
    }
    return conversation.title || t("meta.untitledGroup")
  }, [conversation, t])
  const deletedUserLabel = useMemo(() => t("meta.deletedUser"), [t])

  const avatarSrc =
    conversation?.type === "SINGLE"
      ? conversation.otherUser?.avatar || undefined
      : conversation?.avatar || undefined

  const handleJoin = async () => {
    if (joining) return
    setJoining(true)
    try {
      const res = await fetch(`/api/conversations/${conversationId}/join`, {
        method: "POST",
      })
      if (!res.ok) {
        throw new Error("failed")
      }
      await Promise.all([mutateDetail(), mutateMessages()])
    } catch (error) {
      console.error("Failed to join conversation:", error)
    } finally {
      setJoining(false)
    }
  }

  if (detailLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-12 w-1/2" />
        <Skeleton className="h-40 w-full" />
      </div>
    )
  }

  if (detailError || !conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-20 text-center">
        <div className="flex items-center justify-center size-14 rounded-full bg-muted text-muted-foreground">
          <MessageCircle className="size-6" />
        </div>
        <h3 className="mt-4 text-lg font-semibold">{t("error.notFound")}</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("error.notFoundDescription")}
        </p>
      </div>
    )
  }

  const showJoinPrompt =
    conversation.type === "GROUP" &&
    (!isMember || messagesError?.message === "403")

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between gap-4 px-6 py-4 border-b">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar className="size-10">
            <AvatarImage src={avatarSrc} alt={title} />
            <AvatarFallback>
              {conversation.type === "GROUP" ? (
                <Users className="size-4" />
              ) : (
                title.slice(0, 2)
              )}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="font-semibold truncate">{title}</div>
            <div className="text-xs text-muted-foreground">
              {conversation.type === "GROUP"
                ? t("meta.members", { count: conversation.memberCount })
                : t("meta.privateChat")}
            </div>
          </div>
        </div>
        {showJoinPrompt && (
          <Button onClick={handleJoin} disabled={joining}>
            {joining ? t("actions.joining") : t("actions.join")}
          </Button>
        )}
      </div>

      {showJoinPrompt ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center px-6">
          <div className="flex items-center justify-center size-14 rounded-full bg-muted text-muted-foreground">
            <Users className="size-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">{t("empty.joinTitle")}</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("empty.joinDescription")}
          </p>
        </div>
      ) : (
        <ScrollArea className="flex-1">
          <div className="flex flex-col gap-4 px-6 py-6">
            {messagesLoading && (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <Skeleton key={idx} className="h-16 w-full rounded-xl" />
                ))}
              </div>
            )}
            {!messagesLoading && messagesData?.items.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-center text-sm text-muted-foreground">
                {t("empty.messages")}
              </div>
            )}
            {messagesData?.items.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                isGroup={conversation.type === "GROUP"}
                deletedUserLabel={deletedUserLabel}
              />
            ))}
          </div>
        </ScrollArea>
      )}
    </div>
  )
})
