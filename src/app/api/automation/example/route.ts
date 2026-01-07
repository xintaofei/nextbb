/**
 * 自动化规则系统 - 示例 API
 *
 * 演示如何在业务代码中使用自动化规则系统
 */

import { NextResponse } from "next/server"
import {
  emitDonationEvent,
  emitCheckinEvent,
  emitPostCreateEvent,
  emitPostLikeEvent,
} from "@/lib/automation/events"

/**
 * 示例: 触发捐赠事件
 *
 * POST /api/automation/example?type=donation
 */
export async function POST(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type")

    switch (type) {
      case "donation":
        // 模拟捐赠事件
        await emitDonationEvent({
          donationId: BigInt(Date.now()),
          userId: BigInt(1),
          amount: 150, // 大于100,满足规则条件
          currency: "CNY",
          source: "ALIPAY",
          isAnonymous: false,
        })
        break

      case "checkin":
        // 模拟签到事件
        await emitCheckinEvent({
          checkinId: BigInt(Date.now()),
          userId: BigInt(1),
          checkinDate: new Date(),
          consecutiveDays: 7, // 连续7天
          creditsEarned: 10,
        })
        break

      case "post":
        // 模拟发帖事件
        await emitPostCreateEvent({
          postId: BigInt(Date.now()),
          topicId: BigInt(1),
          userId: BigInt(1),
          categoryId: BigInt(1),
          content: "这是一个测试帖子,内容长度超过100字,满足规则条件...",
          isFirstPost: true,
        })
        break

      case "like":
        // 模拟点赞事件
        await emitPostLikeEvent({
          postId: BigInt(1),
          userId: BigInt(2), // 点赞者
          postAuthorId: BigInt(1), // 帖子作者
          isLiked: true,
          totalLikes: 10, // 累计点赞数
        })
        break

      default:
        return NextResponse.json({ error: "无效的事件类型" }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `已触发 ${type} 事件,规则引擎将自动处理`,
    })
  } catch (error) {
    console.error("[Automation Example] 错误:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
