"use client"

import { SearchIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useConfig } from "@/components/providers/config-provider"
import { useTranslations, useLocale } from "next-intl"
import Link from "next/link"
import useSWR from "swr"
import { stripHtmlAndTruncate } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RelativeTime } from "@/components/common/relative-time"
import { Skeleton } from "@/components/ui/skeleton"
import { UserInfoCard } from "@/components/common/user-info-card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"

export function Aside() {
  const pathname = usePathname()
  const isTopicPage = pathname.includes("/topic/")
  const t = useTranslations("Index")
  const tc = useTranslations("Common")
  const locale = useLocale()

  const { configs } = useConfig()
  const welcomeMessage = configs?.["basic.welcome_message"] as
    | string
    | undefined

  const { data: comments, isLoading: commentsLoading } = useSWR<
    {
      id: string
      content: string
      contentHtml?: string
      createdAt: string
      user: { id: string; name: string; avatar: string }
      topic: { id: string; title: string }
    }[]
  >(
    !isTopicPage ? ["/api/comments/latest", locale] : null,
    async (arg: any) => {
      const url = Array.isArray(arg) ? arg[0] : arg
      const res = await fetch(url, { cache: "no-store" })
      return await res.json()
    }
  )

  return (
    <aside className="hidden lg:flex w-64 flex-col gap-4 ml-7 max-xl:mr-8 py-8 pl-1 sticky top-0 h-screen overflow-y-auto scrollbar-none">
      {isTopicPage ? (
        <div id="topic-aside-portal" className="w-full" />
      ) : (
        <>
          {/* Search */}
          <InputGroup className="w-full h-10 rounded-full">
            <InputGroupInput
              className="h-full"
              placeholder={tc("Search.placeholder")}
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>

          {/* Welcome */}
          <div className="w-full border rounded-xl flex flex-col overflow-hidden bg-card">
            <div className="p-3 border-b bg-muted/30 font-medium text-sm flex items-center gap-2">
              <span>{tc("welcome")}</span>
            </div>
            <span className="p-3 text-lg break-all">
              {welcomeMessage || t("title")}
            </span>
          </div>

          {/* Latest Comments */}
          <div className="w-full border rounded-xl flex flex-col overflow-hidden bg-card">
            <div className="p-3 border-b bg-muted/30 font-medium text-sm flex items-center gap-2">
              <span>{tc("Title.latestComments")}</span>
            </div>

            {commentsLoading ? (
              <div className="p-3 space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex gap-3">
                    <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-3 w-3/4" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col">
                {comments?.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 border-b last:border-0 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex gap-3">
                      <UserInfoCard
                        userId={comment.user.id}
                        userName={comment.user.name}
                        userAvatar={comment.user.avatar}
                      >
                        <Avatar className="h-8 w-8 shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                          <AvatarImage
                            src={comment.user.avatar}
                            alt={comment.user.name}
                          />
                          <AvatarFallback>
                            {comment.user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </UserInfoCard>
                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-medium text-muted-foreground truncate">
                            {comment.user.name}
                          </span>
                          <span className="text-sm text-muted-foreground shrink-0">
                            <RelativeTime date={comment.createdAt} />
                          </span>
                        </div>
                        <Link
                          href={`/topic/${comment.topic.id}#post-${comment.id}`}
                          className="text-sm text-foreground line-clamp-2 hover:text-foreground transition-colors break-all"
                        >
                          {stripHtmlAndTruncate(
                            comment.contentHtml || comment.content,
                            60
                          )}
                        </Link>
                        <Link
                          href={`/topic/${comment.topic.id}`}
                          className="text-xs text-primary/80 hover:text-primary truncate mt-0.5"
                        >
                          In: {comment.topic.title}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
                {comments?.length === 0 && (
                  <div className="p-4 text-center text-xs text-muted-foreground">
                    {tc("Table.empty")}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="text-xs text-muted-foreground flex flex-wrap gap-x-2 gap-y-1">
            <span className="hover:underline cursor-pointer">
              {tc("Footer.terms")}
            </span>
            <span className="hover:underline cursor-pointer">
              {tc("Footer.privacy")}
            </span>
            <span className="hover:underline cursor-pointer">
              {tc("Footer.cookie")}
            </span>
            <span>{tc("Footer.copyright")}</span>
          </div>
        </>
      )}
    </aside>
  )
}
