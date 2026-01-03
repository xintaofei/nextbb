import { Metadata } from "next"
import { Award } from "lucide-react"
import { BadgeItem } from "@/types/badge"
import { decodeUsername } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import BadgesTimeline from "@/components/user/badges-timeline"

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
      <BadgesTimeline badges={badges} />
    </div>
  )
}
