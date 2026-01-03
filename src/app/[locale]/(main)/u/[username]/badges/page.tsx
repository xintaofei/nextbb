import { Metadata } from "next"
import { Award, Calendar, User as UserIcon } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  TimelineSteps,
  TimelineStepsItem,
  TimelineStepsConnector,
  TimelineStepsIcon,
  TimelineStepsContent,
  TimelineStepsTitle,
  TimelineStepsDescription,
  TimelineStepsTime,
} from "@/components/ui/timeline-steps"
import { BadgeItem } from "@/types/badge"
import { decodeUsername } from "@/lib/utils"
import { prisma } from "@/lib/prisma"

type BadgesPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: BadgesPageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  return {
    title: `${decodedUsername} - 徽章`,
  }
}

export default async function BadgesPage({ params }: BadgesPageProps) {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  const t = (key: string) => {
    const translations: Record<string, string> = {
      title: "徽章列表",
      description: "用户获得的所有徽章",
      awardedAt: "授予时间",
      awardedBy: "授予人",
      system: "系统",
      empty: "暂未获得任何徽章",
      emptyDescription: "参与社区活动获取徽章吧！",
    }
    return translations[key] || key
  }

  // 查询用户信息
  const user = await prisma.users.findFirst({
    where: {
      name: decodedUsername,
      is_deleted: false,
    },
    select: {
      id: true,
    },
  })

  if (!user) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Award className="h-16 w-16 text-muted-foreground/30" />
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-muted-foreground">
              用户不存在
            </p>
          </div>
        </div>
      </div>
    )
  }

  // 获取用户徽章列表
  const userBadges = await prisma.user_badges.findMany({
    where: {
      user_id: user.id,
      is_deleted: false,
      badge: {
        is_visible: true,
        is_enabled: true,
        is_deleted: false,
      },
    },
    include: {
      badge: {
        select: {
          id: true,
          name: true,
          icon: true,
          badge_type: true,
          level: true,
          bg_color: true,
          text_color: true,
          description: true,
        },
      },
      awarder: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
    orderBy: [{ badge: { level: "desc" } }, { awarded_at: "desc" }],
  })

  const badges: BadgeItem[] = userBadges.map((ub) => ({
    id: String(ub.badge.id),
    name: ub.badge.name,
    icon: ub.badge.icon,
    badgeType: ub.badge.badge_type,
    level: ub.badge.level,
    bgColor: ub.badge.bg_color,
    textColor: ub.badge.text_color,
    description: ub.badge.description,
    awardedAt: ub.awarded_at.toISOString(),
    awardedBy: ub.awarded_by ? String(ub.awarded_by) : null,
    awarderName: ub.awarder?.name || null,
    awarderAvatar: ub.awarder?.avatar || null,
  }))

  if (badges.length === 0) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6" />
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Award className="h-16 w-16 text-muted-foreground/30" />
          <div className="text-center space-y-2">
            <p className="text-lg font-medium text-muted-foreground">
              {t("empty")}
            </p>
            <p className="text-sm text-muted-foreground">
              {t("emptyDescription")}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6" />
          {t("title")}
        </h1>
        <p className="text-sm text-muted-foreground">{t("description")}</p>
      </div>

      <TimelineSteps>
        {badges.map((badge) => (
          <TimelineStepsItem key={badge.id} className="mb-4">
            <TimelineStepsConnector />
            <TimelineStepsIcon
              variant="outline"
              className="text-xl"
              style={{
                backgroundColor: badge.bgColor || undefined,
                color: badge.textColor || undefined,
                borderColor: badge.bgColor ? `${badge.bgColor}80` : undefined,
              }}
            >
              {badge.icon}
            </TimelineStepsIcon>
            <TimelineStepsContent>
              <TimelineStepsTitle>
                <span
                  style={{
                    color: badge.textColor || undefined,
                  }}
                >
                  {badge.name} - Level {badge.level}
                </span>
              </TimelineStepsTitle>

              {/* 徽章描述 */}
              {badge.description && (
                <TimelineStepsDescription className="text-sm">
                  {badge.description}
                </TimelineStepsDescription>
              )}

              {/* 授予信息 */}
              <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                {/* 授予时间 */}
                {badge.awardedAt && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{t("awardedAt")}: </span>
                    <TimelineStepsTime>
                      {new Date(badge.awardedAt).toLocaleString("zh-CN", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TimelineStepsTime>
                  </div>
                )}

                {/* 授予人 */}
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4" />
                  <span>{t("awardedBy")}: </span>
                  {badge.awardedBy && badge.awarderName ? (
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage
                          src={badge.awarderAvatar || ""}
                          alt={badge.awarderName}
                        />
                        <AvatarFallback className="text-xs">
                          {badge.awarderName.slice(0, 1).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{badge.awarderName}</span>
                    </div>
                  ) : (
                    <span className="font-medium">{t("system")}</span>
                  )}
                </div>
              </div>
            </TimelineStepsContent>
          </TimelineStepsItem>
        ))}
      </TimelineSteps>
    </div>
  )
}
