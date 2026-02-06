"use client"

import { memo, useMemo, useState, useRef, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import {
  ArrowLeft,
  Languages,
  Loader2,
  MessageCircle,
  Users,
  Settings,
  Upload,
} from "lucide-react"
import parse from "html-react-parser"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RelativeTime } from "@/components/common/relative-time"
import { parseOptions } from "@/components/topic/post-parts"
import { ConversationEditor } from "./conversation-editor"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
  isCreator: boolean
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
  const t = useTranslations("Conversations.message")
  const [languages, setLanguages] = useState<
    { locale: string; isSource: boolean }[]
  >([])
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [overrideLocale, setOverrideLocale] = useState<string | null>(null)
  const [overrideContentHtml, setOverrideContentHtml] = useState<string | null>(
    null
  )
  const [overrideContentRaw, setOverrideContentRaw] = useState<string | null>(
    null
  )
  const latestRequestedLocale = useRef<string | null>(null)

  const currentDisplayLocale =
    overrideLocale ?? message.contentLocale ?? message.sourceLocale

  const handleOpenChange = useCallback(
    async (open: boolean) => {
      setIsOpen(open)
      if (open && languages.length === 0) {
        setIsLoadingLanguages(true)
        try {
          const res = await fetch(`/api/messages/${message.id}/languages`)
          if (res.ok) {
            const data = await res.json()
            setLanguages(data.languages)
          }
        } catch (e) {
          console.error(e)
        } finally {
          setIsLoadingLanguages(false)
        }
      }
    },
    [languages.length, message.id]
  )

  const handleLanguageChange = useCallback(
    async (locale: string) => {
      const initialLocale = message.contentLocale ?? message.sourceLocale
      if (locale === initialLocale) {
        latestRequestedLocale.current = locale
        setOverrideLocale(null)
        setOverrideContentHtml(null)
        setOverrideContentRaw(null)
        return
      }

      latestRequestedLocale.current = locale
      try {
        const res = await fetch(
          `/api/messages/${message.id}/translation?locale=${locale}`
        )
        if (res.ok) {
          const data = await res.json()
          if (latestRequestedLocale.current === locale) {
            setOverrideContentHtml(data.contentHtml || null)
            setOverrideContentRaw(data.content || null)
            setOverrideLocale(locale)
          }
        } else {
          if (latestRequestedLocale.current === locale) {
            toast.error(t("translationError"))
          }
        }
      } catch (e) {
        console.error(e)
        if (latestRequestedLocale.current === locale) {
          toast.error(t("translationError"))
        }
      }
    },
    [message.id, message.sourceLocale, message.contentLocale, t]
  )

  const parsedContent = useMemo(() => {
    if (overrideContentHtml) {
      return parse(overrideContentHtml, parseOptions)
    }
    if (overrideContentRaw) {
      return null
    }
    if (!message.contentHtml) return null
    return parse(message.contentHtml, parseOptions)
  }, [message.contentHtml, overrideContentHtml, overrideContentRaw])

  const displayContent = overrideContentRaw ?? message.content

  return (
    <div
      className={cn(
        "flex items-start gap-3",
        message.isMine && "flex-row-reverse"
      )}
    >
      <Avatar className="size-8 shrink-0">
        <AvatarImage
          src={message.sender.avatar || undefined}
          alt={message.sender.name}
        />
        <AvatarFallback>{message.sender.name.slice(0, 2)}</AvatarFallback>
      </Avatar>
      <div
        className={cn(
          "flex flex-col max-w-[75%]",
          message.isMine ? "items-end" : "items-start"
        )}
      >
        {isGroup && !message.isMine && (
          <div className="mb-1 px-1 text-xs text-muted-foreground">
            {message.sender.isDeleted ? deletedUserLabel : message.sender.name}
          </div>
        )}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            message.isMine
              ? "bg-neutral-800 text-white dark:bg-neutral-700"
              : "bg-neutral-100 dark:bg-neutral-800/50"
          )}
        >
          {parsedContent ? (
            <div
              className={cn(
                "prose prose-sm max-w-none",
                message.isMine
                  ? "**:text-white [&_a]:text-neutral-300 [&_a:hover]:text-white"
                  : "dark:prose-invert"
              )}
            >
              {parsedContent}
            </div>
          ) : (
            <div className="whitespace-pre-wrap">{displayContent}</div>
          )}
        </div>
        <div
          className={cn(
            "mt-1 px-1 text-[11px] text-muted-foreground flex items-center gap-1.5",
            message.isMine && "flex-row-reverse"
          )}
        >
          <RelativeTime date={message.createdAt} />
          <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 text-muted-foreground hover:text-foreground"
                title={t("originallyWrittenIn", {
                  locale: message.sourceLocale,
                })}
              >
                <Languages className="size-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align={message.isMine ? "start" : "end"}>
              <DropdownMenuLabel>{t("languageSelection")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {isLoadingLanguages ? (
                <div className="p-2 flex justify-center items-center">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              ) : (
                <DropdownMenuRadioGroup
                  value={currentDisplayLocale}
                  onValueChange={handleLanguageChange}
                >
                  {languages.map((lang) => (
                    <DropdownMenuRadioItem
                      key={lang.locale}
                      value={lang.locale}
                    >
                      {lang.locale}
                      {lang.isSource && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          {t("source")}
                        </span>
                      )}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
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
  const router = useRouter()
  const [joining, setJoining] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editTitle, setEditTitle] = useState("")
  const [editAvatar, setEditAvatar] = useState<File | null>(null)
  const [editAvatarPreview, setEditAvatarPreview] = useState<string | null>(
    null
  )
  const [saving, setSaving] = useState(false)
  const editAvatarInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const previousLengthRef = useRef(0)

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

  const isCreator = detail?.isCreator ?? false

  const handleOpenEditDialog = useCallback(() => {
    if (conversation) {
      setEditTitle(conversation.title || "")
      setEditAvatarPreview(conversation.avatar || null)
      setEditAvatar(null)
      setEditDialogOpen(true)
    }
  }, [conversation])

  const handleEditAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if (!allowedTypes.includes(file.type) || file.size > 5 * 1024 * 1024) return
    setEditAvatar(file)
    const reader = new FileReader()
    reader.onload = (event) => {
      setEditAvatarPreview(event.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSaveEdit = async () => {
    if (saving) return
    setSaving(true)
    try {
      const formData = new FormData()
      if (editTitle.trim()) {
        formData.append("title", editTitle.trim())
      }
      if (editAvatar) {
        formData.append("avatar", editAvatar)
      }
      const res = await fetch(`/api/conversations/${conversationId}`, {
        method: "PATCH",
        body: formData,
      })
      if (!res.ok) throw new Error("failed")
      await mutateDetail()
      setEditDialogOpen(false)
      toast.success(t("editGroup.saveSuccess"))
    } catch {
      toast.error(t("editGroup.saveError"))
    } finally {
      setSaving(false)
    }
  }

  // Auto-scroll to new messages
  useEffect(() => {
    const currentLength = messagesData?.items.length || 0
    if (currentLength > previousLengthRef.current) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      })
    }
    previousLengthRef.current = currentLength
  }, [messagesData?.items.length])

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
      <div className="flex flex-col h-full">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 px-4 py-4 border-b shrink-0 sm:px-6">
          <Skeleton className="size-9 rounded-md shrink-0 lg:hidden" />
          <Skeleton className="size-10 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        {/* Messages skeleton */}
        <div className="flex-1 min-h-0 px-6 py-6 space-y-4 overflow-hidden">
          <div className="flex items-start gap-3">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <Skeleton className="h-16 w-48 rounded-2xl" />
          </div>
          <div className="flex items-start gap-3 flex-row-reverse">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <Skeleton className="h-12 w-40 rounded-2xl" />
          </div>
          <div className="flex items-start gap-3">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <Skeleton className="h-20 w-56 rounded-2xl" />
          </div>
          <div className="flex items-start gap-3 flex-row-reverse">
            <Skeleton className="size-8 rounded-full shrink-0" />
            <Skeleton className="h-14 w-36 rounded-2xl" />
          </div>
        </div>
        {/* Editor skeleton */}
        <div className="px-6 py-4 border-t shrink-0">
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>
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
      <div className="flex items-center justify-between gap-4 px-4 py-4 border-b shrink-0 sm:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            onClick={() => router.push("/conversations")}
          >
            <ArrowLeft className="size-5" />
          </Button>
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
        {isCreator && conversation.type === "GROUP" && !showJoinPrompt && (
          <Button variant="ghost" size="icon" onClick={handleOpenEditDialog}>
            <Settings className="size-4" />
          </Button>
        )}
      </div>

      {/* Edit Group Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("editGroup.title")}</DialogTitle>
            <DialogDescription>{t("editGroup.description")}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4">
              <Avatar className="size-16">
                <AvatarImage src={editAvatarPreview || undefined} />
                <AvatarFallback>
                  <Users className="size-6" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <Label>{t("editGroup.avatarLabel")}</Label>
                <p className="text-sm text-muted-foreground mb-2">
                  {t("editGroup.avatarHint")}
                </p>
                <input
                  ref={editAvatarInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleEditAvatarChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => editAvatarInputRef.current?.click()}
                >
                  <Upload className="size-4 mr-2" />
                  {t("editGroup.uploadAvatar")}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-group-title">
                {t("editGroup.nameLabel")}
              </Label>
              <Input
                id="edit-group-title"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder={t("editGroup.namePlaceholder")}
                maxLength={64}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              {t("editGroup.cancel")}
            </Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving ? t("editGroup.saving") : t("editGroup.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
        <ScrollArea className="flex-1 min-h-0">
          <div className="flex flex-col gap-4 px-6 py-6">
            {messagesLoading && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <Skeleton className="h-14 w-44 rounded-2xl" />
                </div>
                <div className="flex items-start gap-3 flex-row-reverse">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <Skeleton className="h-10 w-32 rounded-2xl" />
                </div>
                <div className="flex items-start gap-3">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <Skeleton className="h-16 w-52 rounded-2xl" />
                </div>
                <div className="flex items-start gap-3 flex-row-reverse">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <Skeleton className="h-12 w-40 rounded-2xl" />
                </div>
                <div className="flex items-start gap-3">
                  <Skeleton className="size-8 rounded-full shrink-0" />
                  <Skeleton className="h-10 w-36 rounded-2xl" />
                </div>
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
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>
      )}

      {/* Editor (only visible to members) */}
      {isMember && !showJoinPrompt && (
        <ConversationEditor
          conversationId={conversationId}
          onMessageSent={() => {
            mutateMessages()
          }}
        />
      )}
    </div>
  )
})
