import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth"
import { getLocale } from "next-intl/server"
import { generateId } from "@/lib/id"
import { TopicType } from "@/types/topic-type"
import { notifyMentions, notifyReply } from "@/lib/notification-service"
import { AutomationEvents } from "@/lib/automation/event-bus"
import { Prisma, TranslationEntityType } from "@prisma/client"
import { createTranslationTasks } from "@/lib/services/translation-task"

const ReplyCreateSchema = z.object({
  content: z.string().min(1),
  content_html: z.string(),
  parentId: z.string().regex(/^\d+$/).optional(),
})

type ReplyCreateDTO = z.infer<typeof ReplyCreateSchema>

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const auth = await getSessionUser()
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: idStr } = await ctx.params
  const locale = await getLocale()
  let topicId: bigint
  try {
    topicId = BigInt(idStr)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let body: ReplyCreateDTO
  try {
    const json = await req.json()
    body = ReplyCreateSchema.parse(json)
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const topic = await prisma.topics.findFirst({
    where: { id: topicId, is_deleted: false },
    select: { id: true, type: true, user_id: true, category_id: true },
  })
  if (!topic) {
    return NextResponse.json({ error: "Topic not found" }, { status: 404 })
  }

  // Check if this is a lottery topic
  let lotteryConfig = null
  if (topic.type === TopicType.LOTTERY) {
    lotteryConfig = await prisma.lottery_configs.findUnique({
      where: { topic_id: topicId },
      select: {
        draw_type: true,
        participant_threshold: true,
        algorithm_type: true,
        floor_interval: true,
        fixed_floors: true,
        winner_count: true,
        entry_cost: true,
        is_drawn: true,
      },
    })

    if (!lotteryConfig) {
      return NextResponse.json(
        { error: "Lottery config not found" },
        { status: 404 }
      )
    }

    // Check if lottery has already been drawn
    if (lotteryConfig.is_drawn) {
      return NextResponse.json(
        { error: "LOTTERY_ENDED", message: "抽奖已结束" },
        { status: 400 }
      )
    }

    // Check if user has enough credits
    if (lotteryConfig.entry_cost > 0) {
      const user = await prisma.users.findUnique({
        where: { id: auth.userId },
        select: { credits: true },
      })

      if (!user || user.credits < lotteryConfig.entry_cost) {
        return NextResponse.json(
          {
            error: "INSUFFICIENT_CREDITS",
            message: `积分不足，需要 ${lotteryConfig.entry_cost} 积分才能参与`,
          },
          { status: 400 }
        )
      }
    }
  }

  const last = await prisma.posts.findFirst({
    where: { topic_id: topicId, is_deleted: false },
    select: { floor_number: true },
    orderBy: { floor_number: "desc" },
  })
  const nextFloor = (last?.floor_number ?? 0) + 1

  let parentId: bigint = BigInt(0)
  let replyToUserId: bigint = BigInt(0)
  if (body.parentId) {
    try {
      parentId = BigInt(body.parentId)
    } catch {
      return NextResponse.json({ error: "Invalid parentId" }, { status: 400 })
    }
    const parent = await prisma.posts.findFirst({
      where: { id: parentId, topic_id: topicId, is_deleted: false },
      select: { user_id: true },
    })
    if (!parent) {
      return NextResponse.json(
        { error: "Parent post not found" },
        { status: 404 }
      )
    }
    replyToUserId = parent.user_id
  }

  // Use transaction for lottery topics to ensure atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Deduct credits if needed
    if (lotteryConfig && lotteryConfig.entry_cost > 0) {
      await tx.users.update({
        where: { id: auth.userId },
        data: { credits: { decrement: lotteryConfig.entry_cost } },
      })
    }

    // Create post
    const created = await tx.posts.create({
      data: {
        id: generateId(),
        topic_id: topicId,
        user_id: auth.userId,
        parent_id: parentId,
        reply_to_user_id: replyToUserId,
        floor_number: nextFloor,
        content: body.content,
        source_locale: locale,
        translations: {
          create: {
            locale: locale,
            content_html: body.content_html,
            is_source: true,
            version: 1,
          },
        },
        is_deleted: false,
      },
      select: { id: true, floor_number: true },
    })

    let isWinner = false
    let message: string | undefined

    // Handle instant lottery draw
    if (lotteryConfig && lotteryConfig.draw_type === "INSTANT") {
      // Check if user has already won
      const existingWinner = await tx.lottery_winners.findUnique({
        where: {
          topic_id_user_id: {
            topic_id: topicId,
            user_id: auth.userId,
          },
        },
      })

      if (!existingWinner) {
        // Calculate if this reply wins
        const shouldWin = await calculateInstantWin(
          tx,
          topicId,
          created.floor_number,
          lotteryConfig.algorithm_type,
          lotteryConfig.floor_interval,
          lotteryConfig.fixed_floors,
          lotteryConfig.winner_count
        )

        if (shouldWin) {
          // Create winner record
          await tx.lottery_winners.create({
            data: {
              id: generateId(),
              topic_id: topicId,
              post_id: created.id,
              user_id: auth.userId,
              floor_number: created.floor_number,
              won_at: new Date(),
              created_at: new Date(),
            },
          })
          isWinner = true
          message = "恭喜中奖！"
        }
      }
    } else if (lotteryConfig && lotteryConfig.draw_type === "THRESHOLD") {
      // Check if threshold is reached for threshold draw
      const replyCount = await tx.posts.count({
        where: {
          topic_id: topicId,
          is_deleted: false,
          floor_number: { gt: 1 }, // Exclude first floor (topic post)
        },
      })

      // If threshold is reached, trigger draw
      if (
        lotteryConfig.participant_threshold &&
        replyCount >= lotteryConfig.participant_threshold
      ) {
        // Execute threshold draw
        await executeThresholdDraw(
          tx,
          topicId,
          lotteryConfig.algorithm_type,
          lotteryConfig.floor_interval,
          lotteryConfig.fixed_floors,
          lotteryConfig.winner_count
        )

        // Mark lottery as drawn
        await tx.lottery_configs.update({
          where: { topic_id: topicId },
          data: {
            is_drawn: true,
            drawn_at: new Date(),
          },
        })

        message = "参与成功，已达阈值，开奖完成！"
      } else {
        message = "参与成功，等待开奖"
      }
    } else if (lotteryConfig) {
      message = "参与成功，等待开奖"
    }

    return {
      postId: String(created.id),
      floorNumber: created.floor_number,
      isWinner: lotteryConfig ? isWinner : undefined,
      message,
    }
  })

  // Process side effects (Notifications & Events)
  try {
    const postId = BigInt(result.postId)

    // 1. Notify mentioned users
    await notifyMentions({
      topicId,
      postId,
      senderId: auth.userId,
      contentHtml: body.content_html,
    })

    // 2. Notify reply targets (Topic Author & Parent Post Author)
    await notifyReply({
      topicId,
      postId,
      senderId: auth.userId,
      topicUserId: topic.user_id,
      replyToUserId,
    })

    // 3. Emit automation event
    // Check if this is the user's first reply to this topic
    const previousReply = await prisma.posts.findFirst({
      where: {
        topic_id: topicId,
        user_id: auth.userId,
        id: { not: postId },
      },
      select: { id: true },
    })

    await AutomationEvents.postReply({
      postId,
      topicId,
      userId: auth.userId,
      categoryId: topic.category_id,
      content: body.content,
      parentId: parentId > 0 ? parentId : undefined,
      topicType: topic.type,
      isFirstReply: !previousReply,
    })

    // 4. Create translation tasks
    await createTranslationTasks(TranslationEntityType.POST, postId, locale, 1)
  } catch (error) {
    console.error("Failed to process reply creation side effects:", error)
  }

  return NextResponse.json(result, { status: 201 })
}

// Helper function to calculate instant lottery win
async function calculateInstantWin(
  tx: Prisma.TransactionClient,
  topicId: bigint,
  floorNumber: number,
  algorithmType: string,
  floorInterval: number | null,
  fixedFloorsJson: string | null,
  winnerCount: number | null
): Promise<boolean> {
  // INTERVAL algorithm: check if floor number matches interval
  if (algorithmType === "INTERVAL" && floorInterval) {
    return floorNumber % floorInterval === 0
  }

  // FIXED algorithm: check if floor number is in fixed floors list
  if (algorithmType === "FIXED" && fixedFloorsJson) {
    try {
      const fixedFloors = JSON.parse(fixedFloorsJson) as number[]
      return fixedFloors.includes(floorNumber)
    } catch {
      return false
    }
  }

  // RANDOM algorithm: random chance based on winner count
  if (algorithmType === "RANDOM" && winnerCount) {
    // Check how many winners already exist
    const existingWinners = await tx.lottery_winners.count({
      where: { topic_id: topicId },
    })

    // If we've reached the winner limit, no more wins
    if (existingWinners >= winnerCount) {
      return false
    }

    // Random chance: simplified approach
    // In a real system, you might want more sophisticated logic
    // For now, use a fixed probability
    const probability = 0.1 // 10% chance per reply
    return Math.random() < probability
  }

  return false
}

// Helper function to execute threshold draw
async function executeThresholdDraw(
  tx: Prisma.TransactionClient,
  topicId: bigint,
  algorithmType: string,
  floorInterval: number | null,
  fixedFloorsJson: string | null,
  winnerCount: number | null
): Promise<void> {
  // Get all eligible posts (exclude floor 1)
  const posts = await tx.posts.findMany({
    where: {
      topic_id: topicId,
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

  if (posts.length === 0) return

  let winners: typeof posts = []

  // INTERVAL algorithm: select posts at interval floors
  if (algorithmType === "INTERVAL" && floorInterval) {
    winners = posts.filter((post) => post.floor_number % floorInterval === 0)
  }
  // FIXED algorithm: select specific floor numbers
  else if (algorithmType === "FIXED" && fixedFloorsJson) {
    try {
      const fixedFloors = JSON.parse(fixedFloorsJson) as number[]
      winners = posts.filter((post) => fixedFloors.includes(post.floor_number))
    } catch {
      // Invalid JSON, no winners
    }
  }
  // RANDOM algorithm: randomly select N winners
  else if (algorithmType === "RANDOM" && winnerCount) {
    // Shuffle posts and take N winners
    const shuffled = [...posts].sort(() => Math.random() - 0.5)
    winners = shuffled.slice(0, Math.min(winnerCount, shuffled.length))
  }

  // Remove duplicates by user_id (each user can only win once)
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
        topic_id: topicId,
        post_id: post.id,
        user_id: post.user_id,
        floor_number: post.floor_number,
        won_at: new Date(),
        created_at: new Date(),
      })),
      skipDuplicates: true,
    })
  }
}
