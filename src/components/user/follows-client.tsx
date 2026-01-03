"use client"

import { useState } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { UserInfoCard } from "@/components/common/user-info-card"
import { formatRelative } from "@/lib/time"

type User = {
  id: string
  username: string
  nickname: string | null
  avatar: string | null
  is_admin: boolean
  created_at: string
  followedAt: string
}

type FollowsResponse = {
  followers?: User[]
  following?: User[]
  total: number
}

type FollowsClientProps = {
  userId: string
  username: string
}

function UserListItem({ user }: { user: User }) {
  const t = useTranslations("User.profile.follows")

  return (
    <UserInfoCard
      userId={user.id}
      userName={user.username}
      userAvatar={user.avatar || ""}
      isAdmin={user.is_admin}
      side="top"
    >
      <div className="flex items-center gap-4 p-4 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer">
        <Avatar className="h-12 w-12">
          <AvatarImage src={user.avatar || undefined} alt={user.username} />
          <AvatarFallback>{user.username[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold">
              {user.nickname || user.username}
            </span>
            {user.is_admin && (
              <Badge variant="default" className="text-xs">
                Admin
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            {t("followedAt")} {formatRelative(user.followedAt)}
          </p>
        </div>
      </div>
    </UserInfoCard>
  )
}

function FollowsClient({ userId, username }: FollowsClientProps) {
  const t = useTranslations("User.profile")
  const tEmpty = useTranslations("User.profile.empty")
  const [activeTab, setActiveTab] = useState<"followers" | "following">(
    "followers"
  )

  // 同时获取粉丝和关注列表的数量
  const { data: followersData, isLoading: followersLoading } =
    useSWR<FollowsResponse>(`/api/users/${userId}/follow/followers`, {
      revalidateOnFocus: false,
    })

  const { data: followingData, isLoading: followingLoading } =
    useSWR<FollowsResponse>(`/api/users/${userId}/follow/following`, {
      revalidateOnFocus: false,
    })

  const followers = followersData?.followers || []
  const following = followingData?.following || []
  const followersCount = followersData?.total || 0
  const followingCount = followingData?.total || 0

  return (
    <Tabs
      value={activeTab}
      onValueChange={(v) => setActiveTab(v as "followers" | "following")}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="followers">
          {t("follows.followers")}
          <Badge variant="secondary" className="ml-2">
            {followersCount}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="following">
          {t("follows.following")}
          <Badge variant="secondary" className="ml-2">
            {followingCount}
          </Badge>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="followers" className="mt-4">
        {followersLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("empty.activity")}
          </div>
        ) : followers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {tEmpty("followers")}
          </div>
        ) : (
          <div className="space-y-2">
            {followers.map((user) => (
              <UserListItem key={user.id} user={user} />
            ))}
          </div>
        )}
      </TabsContent>

      <TabsContent value="following" className="mt-4">
        {followingLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("empty.activity")}
          </div>
        ) : following.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {tEmpty("following")}
          </div>
        ) : (
          <div className="space-y-2">
            {following.map((user) => (
              <UserListItem key={user.id} user={user} />
            ))}
          </div>
        )}
      </TabsContent>
    </Tabs>
  )
}

export default FollowsClient
