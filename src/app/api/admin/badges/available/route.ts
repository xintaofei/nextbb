import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/guard"
import { BadgeListResponse, BadgeItem } from "@/types/badge"

export async function GET(req: NextRequest) {
  const actor = await requireAdmin()
  if (!actor) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""
  const badgeType = searchParams.get("badgeType") || ""

  const where: {
    is_enabled: boolean
    is_deleted: boolean
    badge_type?: string
    OR?: Array<
      { name: { contains: string } } | { description: { contains: string } }
    >
  } = {
    is_enabled: true,
    is_deleted: false,
  }

  if (badgeType) {
    where.badge_type = badgeType
  }

  if (q.trim()) {
    where.OR = [
      { name: { contains: q.trim() } },
      { description: { contains: q.trim() } },
    ]
  }

  try {
    const badges = await prisma.badges.findMany({
      where,
      select: {
        id: true,
        name: true,
        icon: true,
        badge_type: true,
        level: true,
        sort: true,
        bg_color: true,
        text_color: true,
      },
      orderBy: [{ level: "desc" }, { sort: "asc" }],
    })

    const items: BadgeItem[] = badges.map((badge) => ({
      id: String(badge.id),
      name: badge.name,
      icon: badge.icon,
      badgeType: badge.badge_type,
      level: badge.level,
      bgColor: badge.bg_color,
      textColor: badge.text_color,
    }))

    const result: BadgeListResponse = { items }
    return NextResponse.json(result)
  } catch (error) {
    console.error("Get available badges error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
