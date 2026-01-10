import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"

export async function POST(req: Request) {
  // Verify cron secret to prevent unauthorized access
  const authHeader = req.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let processed = 0
  let drawn = 0
  let failed = 0

  try {
    // Find all scheduled lotteries that are ready to draw
    const pendingLotteries = await prisma.lottery_configs.findMany({
      where: {
        draw_type: "SCHEDULED",
        is_drawn: false,
        end_time: {
          lte: new Date(), // end_time <= now
        },
      },
      select: {
        topic_id: true,
        algorithm_type: true,
        floor_interval: true,
        fixed_floors: true,
        winner_count: true,
      },
    })

    processed = pendingLotteries.length

    // Process each lottery
    for (const lottery of pendingLotteries) {
      try {
        await prisma.$transaction(async (tx) => {
          // Check if already drawn (race condition protection)
          const config = await tx.lottery_configs.findUnique({
            where: { topic_id: lottery.topic_id },
            select: { is_drawn: true },
          })

          if (config?.is_drawn) {
            // Already drawn by another process, skip
            return
          }

          // Get all eligible posts (exclude floor 1)
          const posts = await tx.posts.findMany({
            where: {
              topic_id: lottery.topic_id,
              is_deleted: false,
              floor_number: { gt: 1 },
            },
            select: {
              id: true,
              user_id: true,
              floor_number: true,
            },
            orderBy: { floor_number: "asc" },
          })

          if (posts.length === 0) {
            // No participants, just mark as drawn
            await tx.lottery_configs.update({
              where: { topic_id: lottery.topic_id },
              data: {
                is_drawn: true,
                drawn_at: new Date(),
              },
            })
            return
          }

          let winners: typeof posts = []

          // Execute draw algorithm
          if (lottery.algorithm_type === "INTERVAL" && lottery.floor_interval) {
            const interval = lottery.floor_interval!
            winners = posts.filter((post) => post.floor_number % interval === 0)
          } else if (
            lottery.algorithm_type === "FIXED" &&
            lottery.fixed_floors
          ) {
            try {
              const fixedFloors = JSON.parse(lottery.fixed_floors) as number[]
              winners = posts.filter((post) =>
                fixedFloors.includes(post.floor_number)
              )
            } catch {
              // Invalid JSON
            }
          } else if (
            lottery.algorithm_type === "RANDOM" &&
            lottery.winner_count
          ) {
            const shuffled = [...posts].sort(() => Math.random() - 0.5)
            winners = shuffled.slice(
              0,
              Math.min(lottery.winner_count, shuffled.length)
            )
          }

          // Remove duplicates by user_id
          const seenUsers = new Set<bigint>()
          const uniqueWinners = winners.filter((post) => {
            if (seenUsers.has(post.user_id)) {
              return false
            }
            seenUsers.add(post.user_id)
            return true
          })

          // Create winner records
          if (uniqueWinners.length > 0) {
            await tx.lottery_winners.createMany({
              data: uniqueWinners.map((post) => ({
                id: generateId(),
                topic_id: lottery.topic_id,
                post_id: post.id,
                user_id: post.user_id,
                floor_number: post.floor_number,
                won_at: new Date(),
                created_at: new Date(),
              })),
              skipDuplicates: true,
            })
          }

          // Mark lottery as drawn
          await tx.lottery_configs.update({
            where: { topic_id: lottery.topic_id },
            data: {
              is_drawn: true,
              drawn_at: new Date(),
            },
          })

          drawn++
        })
      } catch (error) {
        console.error(
          `Failed to draw lottery for topic ${lottery.topic_id}:`,
          error
        )
        failed++
      }
    }

    return NextResponse.json({
      success: true,
      processed,
      drawn,
      failed,
    })
  } catch (error) {
    console.error("Cron job error:", error)
    return NextResponse.json(
      { error: "Internal server error", processed, drawn, failed },
      { status: 500 }
    )
  }
}
