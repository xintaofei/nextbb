import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { TopicType } from "@/types/topic-type"

export async function POST(req: Request) {
  try {
    // 验证请求来自 Vercel Cron
    const authHeader = req.headers.get("authorization")
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[Cron] Starting poll settlement task...")

    // 查询需要结算的投票主题
    const now = new Date()
    const pollsToSettle = await prisma.topics.findMany({
      where: {
        type: TopicType.POLL,
        status: "ACTIVE",
        end_time: {
          not: null,
          lte: now,
        },
        is_settled: false,
      },
      select: {
        id: true,
        title: true,
        end_time: true,
      },
      orderBy: {
        end_time: "asc",
      },
      take: 100,
    })

    console.log(`[Cron] Found ${pollsToSettle.length} polls to settle`)

    let settledCount = 0
    const errors: { id: string; error: string }[] = []

    // 逐个结算
    for (const poll of pollsToSettle) {
      try {
        await prisma.topics.update({
          where: { id: poll.id },
          data: {
            status: "CLOSED",
            is_settled: true,
            updated_at: new Date(),
          },
        })

        console.log(`[Cron] Settled poll: ${poll.id} - "${poll.title}"`)
        settledCount++
      } catch (error) {
        const errorMsg =
          error instanceof Error ? error.message : "Unknown error"
        console.error(`[Cron] Failed to settle poll ${poll.id}:`, errorMsg)
        errors.push({
          id: String(poll.id),
          error: errorMsg,
        })
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      totalFound: pollsToSettle.length,
      settled: settledCount,
      failed: errors.length,
      errors: errors.length > 0 ? errors : undefined,
    }

    console.log("[Cron] Settlement task completed:", result)

    return NextResponse.json(result)
  } catch (error) {
    console.error("[Cron] Settlement task error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    )
  }
}

// 允许GET请求用于测试（仅在开发环境）
export async function GET(req: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Method not allowed in production" },
      { status: 405 }
    )
  }

  // 在开发环境中允许GET请求测试
  return POST(req)
}
