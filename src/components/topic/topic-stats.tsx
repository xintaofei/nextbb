import { memo } from "react"
import { Eye, Users, Clock } from "lucide-react"
import { UserInfoCard } from "@/components/common/user-info-card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RelativeTime } from "@/components/common/relative-time"
import { useTranslations } from "next-intl"
import { TopicInfoResult } from "@/types/topic"

interface TopicStatsProps {
  topicInfo: TopicInfoResult["topic"] | null
}

export const TopicStats = memo(function TopicStats({
  topicInfo,
}: TopicStatsProps) {
  const tc = useTranslations("Common")

  if (!topicInfo) return null

  return (
    <div className="flex flex-wrap justify-between items-center text-sm text-muted-foreground mb-8 bg-muted/80 border px-4 max-sm:px-2 py-3 rounded-lg">
      <div className="flex items-center gap-x-8 max-sm:gap-x-4 gap-y-2">
        <div className="flex items-center gap-1">
          <Eye className="w-4 h-4" />
          <span>{topicInfo.views || 0}</span>
          <span className="max-sm:hidden">{tc("Table.views")}</span>
        </div>
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{topicInfo.participantCount || 0}</span>
          <span className="max-sm:hidden">{tc("Table.participants")}</span>
        </div>
        {topicInfo.participants && topicInfo.participants.length > 0 && (
          <div className="flex items-center -space-x-2">
            {topicInfo.participants.map((user) => (
              <UserInfoCard
                key={user.id}
                userId={user.id}
                userName={user.name}
                userAvatar={user.avatar}
                side="bottom"
              >
                <Avatar className="w-6 h-6 border-2 border-background cursor-pointer">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
              </UserInfoCard>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Clock className="w-4 h-4" />
        <span className="max-sm:hidden">{tc("Table.activity")} </span>
        <RelativeTime
          date={topicInfo.lastActiveTime || topicInfo.endTime || ""}
        />
      </div>
    </div>
  )
})
