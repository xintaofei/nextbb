import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { BadgeListResponse, BadgeItem } from "@/types/badge"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(req: NextRequest, context: RouteContext) {
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
            name: true,
            icon: true,
            badge_type: true,
            level: true,
            bg_color: true,
            text_color: true,
            description: true,
          },
        },
      },
      orderBy: [{ badge: { level: "desc" } }, { awarded_at: "desc" }],
    })

    const items: BadgeItem[] = userBadges.map((ub) => ({
      id: String(ub.badge.id),
      name: ub.badge.name,
      icon: ub.badge.icon,
      badgeType: ub.badge.badge_type,
      level: ub.badge.level,
      bgColor: ub.badge.bg_color,
      textColor: ub.badge.text_color,
      description: ub.badge.description,
    }))

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
