import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/guard"
import { BadgeListResponse, BadgeItem } from "@/types/badge"
import { getTranslationsQuery, getTranslationField } from "@/lib/locale"

type RouteContext = {
  params: Promise<{
    id: string
  }>
}

export async function GET(req: NextRequest, context: RouteContext) {
  const actor = await requireAdmin()
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const userIdBigInt = BigInt(id)
  const locale = (req.nextUrl.pathname.split("/")[1] || "zh") as string

  try {
    const userBadges = await prisma.user_badges.findMany({
      where: {
        user_id: userIdBigInt,
        is_deleted: false,
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
            translations: getTranslationsQuery(locale, { name: true }),
          },
        },
      },
      orderBy: [{ badge: { level: "desc" } }, { awarded_at: "desc" }],
    })

    const items: BadgeItem[] = userBadges.map((ub) => {
      const name = getTranslationField(ub.badge.translations, locale, "name", "")
      return {
        id: String(ub.badge.id),
        name,
        icon: ub.badge.icon,
        badgeType: ub.badge.badge_type,
        level: ub.badge.level,
        bgColor: ub.badge.bg_color,
        textColor: ub.badge.text_color,
        awardedAt: ub.awarded_at.toISOString(),
      }
    })

    const result: BadgeListResponse = { items }
    return NextResponse.json(result)
  } catch (error) {
    console.error("Get user badges error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest, context: RouteContext) {
  const actor = await requireAdmin()
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const userIdBigInt = BigInt(id)

  try {
    const body = await req.json()
    const { badgeIds } = body as { badgeIds: string[] }

    if (!Array.isArray(badgeIds) || badgeIds.length === 0) {
      return NextResponse.json({ error: "Invalid badge IDs" }, { status: 400 })
    }

    const badgeIdsBigInt = badgeIds.map((id) => BigInt(id))

    // 验证徽章存在且启用
    const badges = await prisma.badges.findMany({
      where: {
        id: { in: badgeIdsBigInt },
        is_enabled: true,
        is_deleted: false,
      },
    })

    if (badges.length !== badgeIds.length) {
      return NextResponse.json(
        { error: "Some badges are not available" },
        { status: 400 }
      )
    }

    // 获取用户已有的徽章
    const existingBadges = await prisma.user_badges.findMany({
      where: {
        user_id: userIdBigInt,
        badge_id: { in: badgeIdsBigInt },
      },
    })

    const existingBadgeIds = new Set(
      existingBadges.map((ub) => String(ub.badge_id))
    )

    let count = 0

    // 批量操作
    for (const badgeId of badgeIds) {
      const badgeIdBigInt = BigInt(badgeId)

      if (existingBadgeIds.has(badgeId)) {
        // 如果已存在，检查是否被删除，如果被删除则恢复
        const existing = existingBadges.find(
          (ub) => String(ub.badge_id) === badgeId
        )
        if (existing && existing.is_deleted) {
          await prisma.user_badges.update({
            where: {
              user_id_badge_id: {
                user_id: userIdBigInt,
                badge_id: badgeIdBigInt,
              },
            },
            data: {
              is_deleted: false,
              awarded_at: new Date(),
              awarded_by: actor.userId,
            },
          })
          count++
        }
      } else {
        // 创建新记录
        await prisma.user_badges.create({
          data: {
            user_id: userIdBigInt,
            badge_id: badgeIdBigInt,
            awarded_by: actor.userId,
          },
        })
        count++
      }
    }

    return NextResponse.json({ success: true, count })
  } catch (error) {
    console.error("Assign badges error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const actor = await requireAdmin()
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const userIdBigInt = BigInt(id)

  try {
    const body = await req.json()
    const { badgeIds } = body as { badgeIds: string[] }

    if (!Array.isArray(badgeIds) || badgeIds.length === 0) {
      return NextResponse.json({ error: "Invalid badge IDs" }, { status: 400 })
    }

    const badgeIdsBigInt = badgeIds.map((id) => BigInt(id))

    // 软删除
    const result = await prisma.user_badges.updateMany({
      where: {
        user_id: userIdBigInt,
        badge_id: { in: badgeIdsBigInt },
        is_deleted: false,
      },
      data: {
        is_deleted: true,
      },
    })

    return NextResponse.json({ success: true, count: result.count })
  } catch (error) {
    console.error("Remove badges error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
