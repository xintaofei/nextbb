import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const [checkins7d, activePosters, activeCheckiners, topActiveUsersRaw] =
      await Promise.all([
        prisma.user_checkins.count({
          where: { created_at: { gte: sevenDaysAgo } },
        }),
        prisma.posts.findMany({
          where: { created_at: { gte: sevenDaysAgo }, is_deleted: false },
          select: { user_id: true },
          distinct: ["user_id"],
        }),
        prisma.user_checkins.findMany({
          where: { created_at: { gte: sevenDaysAgo } },
          select: { user_id: true },
          distinct: ["user_id"],
        }),
        prisma.posts.groupBy({
          by: ["user_id"],
          _count: { user_id: true },
          where: { created_at: { gte: sevenDaysAgo }, is_deleted: false },
          orderBy: { _count: { user_id: "desc" } },
          take: 5,
        }),
      ])

    const activeUserIds = new Set([
      ...activePosters.map((p) => p.user_id.toString()),
      ...activeCheckiners.map((c) => c.user_id.toString()),
    ])

    const userIds = topActiveUsersRaw.map((u) => u.user_id)
    const userDetails = await prisma.users.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, avatar: true },
    })

    const topActiveUsers = topActiveUsersRaw.map((u) => {
      const details = userDetails.find((d) => d.id === u.user_id)
      return {
        id: u.user_id.toString(),
        name: details?.name || "Unknown",
        avatar: details?.avatar || "",
        postCount: u._count.user_id,
      }
    })

    return NextResponse.json({
      activeUsers7d: activeUserIds.size,
      checkins7d,
      topActiveUsers,
    })
  } catch (error) {
    console.error("Failed to fetch activity stats:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
