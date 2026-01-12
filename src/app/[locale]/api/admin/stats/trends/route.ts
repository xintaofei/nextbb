import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryLimit = searchParams.get("categoryLimit")
    const tagLimit = searchParams.get("tagLimit")

    const parseLimit = (limit: string | null) => {
      if (!limit || limit === "all") return undefined
      const n = parseInt(limit)
      return isNaN(n) ? 5 : n
    }

    const cLimit = parseLimit(categoryLimit)
    const tLimit = parseLimit(tagLimit)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    // 1. 获取基础增长数据
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

    // 2. 获取分类详细趋势 (Top N)
    const topCategoriesRaw = await prisma.topics.groupBy({
      by: ["category_id"],
      _count: { id: true },
      where: { created_at: { gte: thirtyDaysAgo }, is_deleted: false },
      orderBy: { _count: { id: "desc" } },
      take: cLimit,
    })
    const topCategoryIds = topCategoriesRaw.map((c) => c.category_id)

    const categoryGrowthRaw = await prisma.$queryRaw<
      { date: Date; category_id: bigint; count: bigint }[]
    >`
      SELECT DATE(created_at) as date, category_id, COUNT(*)::int as count
      FROM topics
      WHERE created_at >= ${thirtyDaysAgo} AND is_deleted = false AND category_id = ANY(${topCategoryIds.length ? topCategoryIds : [0]}::bigint[])
      GROUP BY DATE(created_at), category_id
      ORDER BY date ASC
    `

    // 3. 获取标签详细趋势 (Top N)
    const topTagsRaw = await prisma.topic_tags.groupBy({
      by: ["tag_id"],
      _count: { topic_id: true },
      where: { created_at: { gte: thirtyDaysAgo } },
      orderBy: { _count: { topic_id: "desc" } },
      take: tLimit,
    })
    const topTagIds = topTagsRaw.map((t) => t.tag_id)

    const tagGrowthRaw = await prisma.$queryRaw<
      { date: Date; tag_id: bigint; count: bigint }[]
    >`
      SELECT DATE(created_at) as date, tag_id, COUNT(*)::int as count
      FROM topic_tags
      WHERE created_at >= ${thirtyDaysAgo} AND tag_id = ANY(${topTagIds.length ? topTagIds : [0]}::bigint[])
      GROUP BY DATE(created_at), tag_id
      ORDER BY date ASC
    `

    // 4. 获取名称翻译
    const [categoryTranslations, tagTranslations] = await Promise.all([
      prisma.category_translations.findMany({
        where: { category_id: { in: topCategoryIds }, locale: "zh" },
        select: { category_id: true, name: true },
      }),
      prisma.tag_translations.findMany({
        where: { tag_id: { in: topTagIds }, locale: "zh" },
        select: { tag_id: true, name: true },
      }),
    ])

    const categoryNamesMap = new Map(
      categoryTranslations.map((t) => [t.category_id.toString(), t.name])
    )
    const tagNamesMap = new Map(
      tagTranslations.map((t) => [t.tag_id.toString(), t.name])
    )

    const categoriesList = Array.from(categoryNamesMap.values())
    const tagsList = Array.from(tagNamesMap.values())

    // 5. 数据填充与合并逻辑
    const fillDates = (data: { date: Date; count: bigint }[]) => {
      const result = []
      const map = new Map(
        data.map((item) => [
          new Date(item.date).toISOString().split("T")[0],
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
    const categoryTrends = []
    const tagTrends = []

    // 准备分类和标签的映射：Map<date, Map<name, count>>
    const categoryDailyMap = new Map<string, Map<string, number>>()
    categoryGrowthRaw.forEach((row) => {
      const dateStr = new Date(row.date).toISOString().split("T")[0]
      const name =
        categoryNamesMap.get(row.category_id.toString()) ||
        `Cat-${row.category_id}`
      if (!categoryDailyMap.has(dateStr))
        categoryDailyMap.set(dateStr, new Map())
      categoryDailyMap.get(dateStr)!.set(name, Number(row.count))
    })

    const tagDailyMap = new Map<string, Map<string, number>>()
    tagGrowthRaw.forEach((row) => {
      const dateStr = new Date(row.date).toISOString().split("T")[0]
      const name = tagNamesMap.get(row.tag_id.toString()) || `Tag-${row.tag_id}`
      if (!tagDailyMap.has(dateStr)) tagDailyMap.set(dateStr, new Map())
      tagDailyMap.get(dateStr)!.set(name, Number(row.count))
    })

    for (let i = 0; i < 30; i++) {
      const d = new Date()
      d.setDate(d.getDate() - (29 - i))
      const dateStr = d.toISOString().split("T")[0]
      const name = dateStr.slice(5)

      // Content Growth
      const topics = topicMap.get(dateStr) || 0
      const posts = postMap.get(dateStr) || 0
      contentGrowth.push({
        date: dateStr,
        name,
        value: topics + posts,
        topics,
        posts,
      })

      // Category Trend Day
      const categoryDay: Record<string, unknown> = { date: dateStr, name }
      categoriesList.forEach((catName) => {
        categoryDay[catName] = categoryDailyMap.get(dateStr)?.get(catName) || 0
      })
      categoryTrends.push(categoryDay)

      // Tag Trend Day
      const tagDay: Record<string, unknown> = { date: dateStr, name }
      tagsList.forEach((tagName) => {
        tagDay[tagName] = tagDailyMap.get(dateStr)?.get(tagName) || 0
      })
      tagTrends.push(tagDay)
    }

    return NextResponse.json({
      userGrowth,
      contentGrowth,
      categoryTrends,
      tagTrends,
      meta: { categories: categoriesList, tags: tagsList },
    })
  } catch (error) {
    console.error("Failed to fetch trend stats:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
