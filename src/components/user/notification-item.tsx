"use client"

import Link from "next/link"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RelativeTime } from "@/components/common/relative-time"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { NotificationType } from "@prisma/client"

export type NotificationData = {
  badge_name?: string
  message?: string
}

export type NotificationItemData = {
  id: string
  type: NotificationType
  read: boolean
  created_at: Date
  data: NotificationData | null
  sender: {
    name: string
    avatar: string
  } | null
  topic: {
    id: string
    title: string
  } | null
  post: {
    id: string
    floor_number: number
  } | null
}

type NotificationItemProps = {
  notification: NotificationItemData
}

export function NotificationItem({ notification }: NotificationItemProps) {
  const t = useTranslations("User.notifications.item")
  const { type, sender, topic, post, data, read, created_at } = notification

  // 构建跳转链接
  let href = "#"
  if (topic) {
    href = `/topic/${topic.id}`
    if (post) {
      href += `#floor-${post.floor_number}`
    }
  } else if (type === "BADGE_AWARD") {
    href = `/u/${sender?.name}/badges` // 这里假设 sender 是本人，或者是系统
  }

  // 构建消息内容
  const renderMessage = () => {
    const values: Record<string, string> = {
      topic: topic?.title || "...",
      badge: data?.badge_name || "...",
      message: data?.message || "...",
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return t(type as any, values)
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex items-start gap-4 p-4 rounded-lg transition-colors hover:bg-muted/50 border",
        read
          ? "bg-background border-transparent"
          : "bg-primary/5 border-primary/20"
      )}
    >
      <Avatar className="h-10 w-10 border mt-1">
        <AvatarImage src={sender?.avatar} alt={sender?.name} />
        <AvatarFallback>{sender?.name?.[0]}</AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start gap-2">
          <p
            className={cn(
              "text-sm leading-relaxed wrap-break-word",
              !read && "font-medium text-foreground"
            )}
          >
            {sender && <span className="font-bold mr-1">{sender.name}</span>}
            {renderMessage()}
          </p>
          {!read && (
            <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <RelativeTime
            date={created_at}
            className="text-xs text-muted-foreground"
          />
        </div>
      </div>
    </Link>
  )
}
