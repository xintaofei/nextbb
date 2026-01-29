import { NextRequest, NextResponse } from "next/server"
import { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { BadgeListResponse, BadgeItem } from "@/types/badge"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q") || ""
  const badgeType = searchParams.get("badgeType") || ""
  const locale = (req.nextUrl.pathname.split("/")[1] || "zh") as string

  const where: Prisma.badgesWhereInput = {
    is_enabled: true,
    is_deleted: false,
  }

  if (badgeType) {
    where.badge_type = badgeType
  }

  if (q.trim()) {
    where.translations = {
      some: {
        OR: [
          { name: { contains: q.trim(), mode: "insensitive" } },
          { description: { contains: q.trim(), mode: "insensitive" } },
        ],
      },
    }
  }

  try {
    const badges = await prisma.badges.findMany({
      where,
      select: {
        id: true,
        icon: true,
        badge_type: true,
        level: true,
        sort: true,
        bg_color: true,
        text_color: true,
        translations: {
          where: {
            OR: [{ locale, is_source: false }, { is_source: true }],
          },
          select: {
            locale: true,
            name: true,
            description: true,
            is_source: true,
          },
          take: 2,
        },
      },
      orderBy: [{ level: "desc" }, { sort: "asc" }],
    })

    const items: BadgeItem[] = badges.map((badge) => {
      const translation =
        badge.translations.find(
          (tr) => tr.locale === locale && !tr.is_source
        ) || badge.translations.find((tr) => tr.is_source)

      return {
        id: String(badge.id),
        name: translation?.name || "",
        icon: badge.icon,
        badgeType: badge.badge_type,
        level: badge.level,
        bgColor: badge.bg_color,
        textColor: badge.text_color,
        description: translation?.description,
      }
    })

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
