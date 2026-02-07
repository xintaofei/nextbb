import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { BadgeListResponse, BadgeItem } from "@/types/badge"
import { getLocale } from "next-intl/server"
import {
  getTranslationsQuery,
  getTranslationFields,
  BadgeTranslation,
} from "@/lib/locale"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(req: NextRequest, context: RouteContext) {
  const locale = await getLocale()
  const { id } = await context.params
  const userIdBigInt = BigInt(id)

  try {
    const userBadges = await prisma.user_badges.findMany({
      where: {
        user_id: userIdBigInt,
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
            icon: true,
            badge_type: true,
            level: true,
            bg_color: true,
            text_color: true,
            dark_bg_color: true,
            dark_text_color: true,
            translations: getTranslationsQuery(locale, {
              name: true,
              description: true,
            }),
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

    const items: BadgeItem[] = userBadges.map((ub) => {
      const badgeFields = getTranslationFields(
        ub.badge.translations as unknown as BadgeTranslation[],
        locale,
        {
          name: "",
          description: null as string | null,
        }
      )

      return {
        id: String(ub.badge.id),
        name: badgeFields.name,
        icon: ub.badge.icon,
        badgeType: ub.badge.badge_type,
        level: ub.badge.level,
        bgColor: ub.badge.bg_color,
        textColor: ub.badge.text_color,
        darkBgColor: ub.badge.dark_bg_color,
        darkTextColor: ub.badge.dark_text_color,
        description: badgeFields.description,
        awardedAt: ub.awarded_at.toISOString(),
        awardedBy: ub.awarded_by ? String(ub.awarded_by) : null,
        awarderName: ub.awarder?.name || null,
        awarderAvatar: ub.awarder?.avatar || null,
      }
    })

    const result: BadgeListResponse = { items }
    return NextResponse.json(result)
  } catch (error) {
    console.error("Get public user badges error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
