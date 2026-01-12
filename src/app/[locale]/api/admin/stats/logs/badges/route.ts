import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DashboardLogItem } from "@/types/admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    const awardsRaw = await prisma.user_badges.findMany({
      take: limit,
      skip: offset,
      orderBy: { awarded_at: "desc" },
      where: { is_deleted: false },
      include: {
        user: { select: { name: true, avatar: true } },
        badge: {
          include: {
            translations: {
              where: { locale: "zh" },
              select: { name: true },
            },
          },
        },
      },
    })

    const items: DashboardLogItem[] = awardsRaw.map((a, idx) => ({
      id: `${a.user_id}-${a.badge_id}-${a.awarded_at.getTime()}-${idx}`,
      label: a.user.name,
      value: "Awarded",
      subtitle: a.badge.translations[0]?.name || "Badge",
      timestamp: a.awarded_at.toISOString(),
      avatar: a.user.avatar,
    }))

    return NextResponse.json({
      items,
      nextOffset: awardsRaw.length === limit ? offset + limit : undefined,
    })
  } catch (error) {
    console.error("Failed to fetch badge logs:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
