"use client"

import { SearchIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useConfig } from "@/components/providers/config-provider"
import { useTranslations, useLocale } from "next-intl"
import Link from "next/link"
import useSWR from "swr"
import { stripHtmlAndTruncate } from "@/lib/utils"
import { parseRouteSegments } from "@/lib/route-utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RelativeTime } from "@/components/common/relative-time"
import { Skeleton } from "@/components/ui/skeleton"
import { UserInfoCard } from "@/components/common/user-info-card"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group"
import { TopicControls } from "../topic/topic-controls"
import { useStickySidebar } from "@/hooks/use-sticky-sidebar"

export function Aside() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)
  const isMainListPage = parseRouteSegments(segments).valid
  const isTopicPage = pathname.includes("/topic/")
  const isConversationPage = pathname.includes("/conversations")
  const t = useTranslations("Index")
  const tc = useTranslations("Common")
  const locale = useLocale()
  const sidebarRef = useStickySidebar()

  const { configs } = useConfig()
  const welcomeMessage = configs?.["basic.welcome_message"] as
    | string
    | undefined
  const icp = configs?.["basic.icp"] as string | undefined

  const { data: comments, isLoading: commentsLoading } = useSWR<
    {
      id: string
      content: string
      contentHtml?: string
      floorNumber: number
      createdAt: string
      user: { id: string; name: string; avatar: string }
      topic: { id: string; title: string }
    }[]
  >(
    !isTopicPage ? ["/api/comments/latest", locale] : null,
    async (arg: [string, string]) => {
      const url = Array.isArray(arg) ? arg[0] : arg
      const res = await fetch(url, { cache: "no-store" })
      return await res.json()
    }
  )

  // Hide aside in conversation pages
  if (isConversationPage) {
    return null
  }

  return (
    <aside
      ref={sidebarRef}
      className="hidden lg:flex w-64 flex-col gap-4 ml-7 max-xl:mr-7 py-8 px-1 sticky self-start"
    >
      {isTopicPage ? (
        <div id="topic-aside-portal" className="w-full" />
      ) : (
        <>
          {/* Search */}
          <InputGroup className="w-full h-10 rounded-full bg-linear-to-b from-muted-foreground/5 to-card">
            <InputGroupInput
              className="h-full"
              placeholder={tc("Search.placeholder")}
            />
            <InputGroupAddon>
              <SearchIcon />
            </InputGroupAddon>
          </InputGroup>

          {/* Welcome */}
          <div className="w-full border rounded-xl flex flex-col overflow-hidden bg-linear-to-b from-muted-foreground/5 to-card">
            <div className="p-3 border-b bg-muted/30 font-bold text-base flex items-center gap-2">
              <span>{tc("welcome")}</span>
            </div>
            <span className="p-3 text-sm text-muted-foreground break-all">
              {welcomeMessage || t("title")}
            </span>
          </div>

          {/* Topic Filter */}
          {isMainListPage && (
            <div className="w-full border rounded-xl flex flex-col overflow-hidden bg-linear-to-b from-muted-foreground/5 to-card">
              <div className="p-3 border-b bg-muted/30 font-bold text-base flex items-center gap-2">
                <span>{tc("Filters.title")}</span>
              </div>
              <div className="p-3 text-sm text-muted-foreground break-all">
                <TopicControls />
              </div>
            </div>
          )}

          {/* Latest Comments */}
          <div className="w-full border rounded-xl flex flex-col overflow-hidden bg-linear-to-b from-muted-foreground/5 to-card">
            <div className="p-3 border-b bg-muted/30 font-bold text-base flex items-center gap-2">
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
                    <div className="flex gap-2">
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
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-muted-foreground truncate">
                            {comment.user.name}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            <RelativeTime date={comment.createdAt} />
                          </span>
                        </div>
                        <Link
                          href={`/topic/${comment.topic.id}#floor-${comment.floorNumber}`}
                          className="text-sm text-foreground line-clamp-2 hover:text-foreground transition-colors break-all"
                        >
                          {stripHtmlAndTruncate(
                            comment.contentHtml || comment.content,
                            60
                          )}
                        </Link>
                        <Link
                          href={`/topic/${comment.topic.id}`}
                          className="text-xs text-muted-foreground hover:text-primary truncate"
                        >
                          {tc("Table.inTopic", { topic: comment.topic.title })}
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
            {icp && (
              <a
                href="https://beian.miit.gov.cn"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline"
              >
                {icp}
              </a>
            )}
          </div>
        </>
      )}
    </aside>
  )
}
