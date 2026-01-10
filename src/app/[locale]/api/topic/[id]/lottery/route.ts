import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await ctx.params
  let topicId: bigint
  try {
    topicId = BigInt(idStr)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  // Get authenticated user (optional for this endpoint)
  const auth = await getSessionUser()

  // Check if topic exists and is a lottery
  const topic = await prisma.topics.findFirst({
    where: { id: topicId, is_deleted: false },
    select: { id: true, type: true },
  })

  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 })
  }

  if (topic.type !== "LOTTERY") {
    return NextResponse.json(
      { error: "Topic is not a lottery" },
      { status: 400 }
    )
  }

  // Get lottery config
  const lotteryConfig = await prisma.lottery_configs.findUnique({
    where: { topic_id: topicId },
  })

  if (!lotteryConfig) {
    return NextResponse.json(
      { error: "Lottery config not found" },
      { status: 404 }
    )
  }

  // Count replies (exclude floor 1)
  const replyCount = await prisma.posts.count({
    where: {
      topic_id: topicId,
      is_deleted: false,
      floor_number: { gt: 1 },
    },
  })

  // Check if user has replied (if authenticated)
  let userReplied = false
  let userIsWinner: boolean | null = null
  if (auth) {
    const userReply = await prisma.posts.findFirst({
      where: {
        topic_id: topicId,
        user_id: auth.userId,
        is_deleted: false,
        floor_number: { gt: 1 },
      },
      select: { id: true },
    })
    userReplied = !!userReply

    // Check if user is a winner
    if (lotteryConfig.is_drawn) {
      const winnerRecord = await prisma.lottery_winners.findUnique({
        where: {
          topic_id_user_id: {
            topic_id: topicId,
            user_id: auth.userId,
          },
        },
      })
      userIsWinner = !!winnerRecord
    }
  }

  // Parse fixed floors if exists
  let fixedFloors: number[] | null = null
  if (lotteryConfig.fixed_floors) {
    try {
      fixedFloors = JSON.parse(lotteryConfig.fixed_floors) as number[]
    } catch {
      // Invalid JSON, ignore
    }
  }

  // Build response based on draw status
  if (lotteryConfig.is_drawn) {
    // Get winners list
    const winners = await prisma.lottery_winners.findMany({
      where: { topic_id: topicId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
          },
        },
        post: {
          select: {
            id: true,
          },
        },
      },
      orderBy: { floor_number: "asc" },
    })

    return NextResponse.json({
      topicId: String(topicId),
      drawType: lotteryConfig.draw_type,
      endTime: lotteryConfig.end_time?.toISOString() || null,
      participantThreshold: lotteryConfig.participant_threshold,
      algorithmType: lotteryConfig.algorithm_type,
      floorInterval: lotteryConfig.floor_interval,
      fixedFloors,
      winnerCount: lotteryConfig.winner_count,
      entryCost: lotteryConfig.entry_cost,
      replyCount,
      isDrawn: true,
      drawnAt: lotteryConfig.drawn_at?.toISOString() || null,
      winners: winners.map((w) => ({
        userId: String(w.user_id),
        userName: w.user.name,
        userAvatar: w.user.avatar,
        floorNumber: w.floor_number,
        postId: String(w.post_id),
        wonAt: w.won_at.toISOString(),
      })),
      userReplied,
      userIsWinner,
    })
  }

  // Not drawn yet
  return NextResponse.json({
    topicId: String(topicId),
    drawType: lotteryConfig.draw_type,
    endTime: lotteryConfig.end_time?.toISOString() || null,
    participantThreshold: lotteryConfig.participant_threshold,
    algorithmType: lotteryConfig.algorithm_type,
    floorInterval: lotteryConfig.floor_interval,
    fixedFloors,
    winnerCount: lotteryConfig.winner_count,
    entryCost: lotteryConfig.entry_cost,
    replyCount,
    isDrawn: false,
    drawnAt: null,
    userReplied,
    userIsWinner: null,
  })
}
