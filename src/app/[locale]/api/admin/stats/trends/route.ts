import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [userGrowthRaw, topicGrowthRaw, postGrowthRaw] = await Promise.all([
      prisma.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE(created_at) as date, COUNT(*)::int as count
        FROM users
        WHERE created_at >= ${thirtyDaysAgo} AND is_deleted = false
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      prisma.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE(created_at) as date, COUNT(*)::int as count
        FROM topics
        WHERE created_at >= ${thirtyDaysAgo} AND is_deleted = false
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
      prisma.$queryRaw<{ date: Date; count: bigint }[]>`
        SELECT DATE(created_at) as date, COUNT(*)::int as count
        FROM posts
        WHERE created_at >= ${thirtyDaysAgo} AND is_deleted = false
        GROUP BY DATE(created_at)
        ORDER BY date ASC
      `,
    ])

    const fillDates = (data: { date: Date; count: bigint }[]) => {
      const result = []
      const map = new Map(
        data.map((item) => [
          item.date instanceof Date
            ? item.date.toISOString().split("T")[0]
            : new Date(item.date).toISOString().split("T")[0],
          Number(item.count),
        ])
      )

      for (let i = 0; i < 30; i++) {
        const d = new Date()
        d.setDate(d.getDate() - (29 - i))
        const dateStr = d.toISOString().split("T")[0]
        result.push({
          date: dateStr,
          name: dateStr.slice(5),
          value: map.get(dateStr) || 0,
        })
      }
      return result
    }

    const userGrowth = fillDates(userGrowthRaw)
    const topicMap = new Map(
      topicGrowthRaw.map((i) => [
        new Date(i.date).toISOString().split("T")[0],
        Number(i.count),
      ])
    )
    const postMap = new Map(
      postGrowthRaw.map((i) => [
        new Date(i.date).toISOString().split("T")[0],
        Number(i.count),
      ])
    )

    const contentGrowth = []
    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      const dateStr = d.toISOString().split("T")[0]
      const topics = topicMap.get(dateStr) || 0
      const posts = postMap.get(dateStr) || 0
      contentGrowth.push({
        date: dateStr,
        name: dateStr.slice(5),
        value: topics + posts,
        topics,
        posts,
      })
    }

    return NextResponse.json({ userGrowth, contentGrowth })
  } catch (error) {
    console.error("Failed to fetch trend stats:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
