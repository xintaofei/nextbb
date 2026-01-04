"use client"

import useSWR from "swr"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserInfoCard } from "@/components/common/user-info-card"
import { useTranslations } from "next-intl"
import { Heart } from "lucide-react"

interface InteractionUser {
  rank: number
  user: {
    id: string
    name: string
    avatar: string | null
  }
  likeCount: number
}

interface SocialInteractionData {
  topLikers: InteractionUser[]
  topLiked: InteractionUser[]
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

function UserRankItem({ item }: { item: InteractionUser }) {
  const t = useTranslations("User.profile.overview.socialInteraction")

  // 前三名特殊样式
  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "text-yellow-600 dark:text-yellow-500"
      case 2:
        return "text-slate-400 dark:text-slate-300"
      case 3:
        return "text-amber-700 dark:text-amber-600"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-accent">
      <div className="flex items-center gap-3">
        <span
          className={`w-6 text-center text-sm font-bold ${getRankColor(item.rank)}`}
        >
          {item.rank}
        </span>
        <UserInfoCard
          userId={item.user.id}
          userName={item.user.name}
          userAvatar={item.user.avatar || ""}
        >
          <button className="flex items-center gap-2 hover:opacity-80">
            <Avatar className="h-10 w-10">
              <AvatarImage src={item.user.avatar || undefined} />
              <AvatarFallback>
                {item.user.name.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium">{item.user.name}</span>
          </button>
        </UserInfoCard>
      </div>
      <div className="flex items-center gap-1 text-sm text-muted-foreground">
        <Heart className="h-4 w-4 fill-current" />
        <span>{t("likesCount", { count: item.likeCount })}</span>
      </div>
    </div>
  )
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          className="flex items-center justify-between rounded-lg border p-3"
        >
          <div className="flex items-center gap-3">
            <Skeleton className="h-4 w-6" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

export function SocialInteractionSection({ userId }: { userId: string }) {
  const t = useTranslations("User.profile.overview.socialInteraction")
  const { data, error, isLoading } = useSWR<SocialInteractionData>(
    `/api/users/${userId}/social-interactions`,
    fetcher
  )

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4 text-center text-sm text-destructive">
        Failed to load social interactions
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* 赞我最多 */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{t("topLikers")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSkeleton />
          ) : data && data.topLikers.length > 0 ? (
            <div className="space-y-3">
              {data.topLikers.map((item) => (
                <UserRankItem key={item.user.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("emptyLikers")}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 我赞最多 */}
      <Card className="shadow-none">
        <CardHeader>
          <CardTitle>{t("topLiked")}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <LoadingSkeleton />
          ) : data && data.topLiked.length > 0 ? (
            <div className="space-y-3">
              {data.topLiked.map((item) => (
                <UserRankItem key={item.user.id} item={item} />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {t("emptyLiked")}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
