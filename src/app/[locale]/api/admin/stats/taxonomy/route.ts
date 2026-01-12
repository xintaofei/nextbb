import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const [
      categoriesRaw,
      tagsRaw,
      badgesCount,
      awardedBadgesCount,
      topBadgesRaw,
      categoryTranslations,
      tagTranslations,
      badgeTranslations,
    ] = await Promise.all([
      prisma.topics.groupBy({
        by: ["category_id"],
        _count: { category_id: true },
        orderBy: { _count: { category_id: "desc" } },
        take: 5,
      }),
      prisma.topic_tags.groupBy({
        by: ["tag_id"],
        _count: { tag_id: true },
        orderBy: { _count: { tag_id: "desc" } },
        take: 6,
      }),
      prisma.badges.count({ where: { is_deleted: false } }),
      prisma.user_badges.count({ where: { is_deleted: false } }),
      prisma.user_badges.groupBy({
        by: ["badge_id"],
        _count: { badge_id: true },
        orderBy: { _count: { badge_id: "desc" } },
        take: 5,
      }),
      prisma.category_translations.findMany({
        where: { locale: "zh" },
        select: { category_id: true, name: true },
      }),
      prisma.tag_translations.findMany({
        where: { locale: "zh" },
        select: { tag_id: true, name: true },
      }),
      prisma.badge_translations.findMany({
        where: { locale: "zh" },
        select: { badge_id: true, name: true },
      }),
    ])

    const categories = categoriesRaw.map((c) => ({
      id: c.category_id.toString(),
      name:
        categoryTranslations.find((t) => t.category_id === c.category_id)
          ?.name || `Cat-${c.category_id}`,
      count: c._count.category_id,
    }))

    const tags = tagsRaw.map((t) => ({
      id: t.tag_id.toString(),
      name:
        tagTranslations.find((tr) => tr.tag_id === t.tag_id)?.name ||
        `Tag-${t.tag_id}`,
      count: t._count.tag_id,
    }))

    const topBadges = topBadgesRaw.map((b) => ({
      id: b.badge_id.toString(),
      name:
        badgeTranslations.find((t) => t.badge_id === b.badge_id)?.name ||
        `Badge-${b.badge_id}`,
      count: b._count.badge_id,
    }))

    return NextResponse.json({
      categories,
      tags,
      badges: {
        total: badgesCount,
        awarded: awardedBadgesCount,
        topBadges,
      },
    })
  } catch (error) {
    console.error("Failed to fetch taxonomy stats:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
