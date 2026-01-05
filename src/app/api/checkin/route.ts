import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { generateId } from "@/lib/id"

/**
 * 用户签到接口
 * POST /api/checkin
 */
export async function POST() {
  try {
    // 验证用户登录
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const userId = sessionUser.userId

    // 获取今天的日期（只保留年月日，不含时分秒）
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 检查今天是否已经签到
    const existingCheckin = await prisma.user_checkins.findFirst({
      where: {
        user_id: userId,
        checkin_date: today,
      },
    })

    if (existingCheckin) {
      return NextResponse.json(
        {
          error: "今天已经签到过了",
          alreadyCheckedIn: true,
        },
        { status: 400 }
      )
    }

    // 配置签到奖励积分（可以后续改为可配置的）
    const CHECKIN_CREDITS = 10

    // 使用事务：创建签到记录 + 增加用户积分 + 创建积分记录
    const result = await prisma.$transaction(async (tx) => {
      // 创建签到记录
      const checkin = await tx.user_checkins.create({
        data: {
          id: generateId(),
          user_id: userId,
          checkin_date: today,
          credits_earned: CHECKIN_CREDITS,
        },
      })

      // 增加用户积分
      const updatedUser = await tx.users.update({
        where: { id: userId },
        data: {
          credits: {
            increment: CHECKIN_CREDITS,
          },
        },
        select: {
          credits: true,
        },
      })

      // 创建积分变动记录
      await tx.user_credit_logs.create({
        data: {
          id: generateId(),
          user_id: userId,
          amount: CHECKIN_CREDITS,
          balance: updatedUser.credits,
          type: "CHECKIN",
          description: "每日签到奖励",
        },
      })

      return {
        checkin,
        newCredits: updatedUser.credits,
      }
    })

    return NextResponse.json({
      success: true,
      message: "签到成功",
      creditsEarned: CHECKIN_CREDITS,
      totalCredits: result.newCredits,
      checkinDate: today,
    })
  } catch (error) {
    console.error("Checkin error:", error)
    return NextResponse.json({ error: "签到失败，请稍后重试" }, { status: 500 })
  }
}

/**
 * 获取用户签到状态或当日签到列表
 * GET /api/checkin - 获取用户签到状态
 * GET /api/checkin?list=today - 获取当日所有用户签到记录
 */
export async function GET(request: Request) {
  try {
    // 获取URL参数，检查是否请求当日签到列表
    const { searchParams } = new URL(request.url)
    const getTodayList = searchParams.get("list") === "today"

    // 如果请求当日签到列表，不需要登录校验
    if (getTodayList) {
      // 获取今天的日期
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      // 查询当天所有签到记录，按创建时间排序（最先签到的最前）
      const todayCheckins = await prisma.user_checkins.findMany({
        where: {
          checkin_date: today,
        },
        orderBy: {
          created_at: "asc",
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              avatar: true,
            },
          },
        },
      })

      return NextResponse.json({
        success: true,
        checkins: todayCheckins.map((checkin, index) => ({
          id: checkin.id.toString(),
          user: {
            id: checkin.user.id.toString(),
            name: checkin.user.name,
            avatar: checkin.user.avatar,
          },
          creditsEarned: checkin.credits_earned,
          checkinTime: checkin.created_at,
          rank: index + 1,
        })),
      })
    }

    // 之前的逻辑：获取用户签到状态
    const sessionUser = await getSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const userId = sessionUser.userId

    // 获取今天的日期
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 检查今天是否已签到
    const todayCheckin = await prisma.user_checkins.findFirst({
      where: {
        user_id: userId,
        checkin_date: today,
      },
    })

    // 获取连续签到天数（最近7天）
    const sevenDaysAgo = new Date(today)
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentCheckins = await prisma.user_checkins.findMany({
      where: {
        user_id: userId,
        checkin_date: {
          gte: sevenDaysAgo,
        },
      },
      orderBy: {
        checkin_date: "desc",
      },
      select: {
        checkin_date: true,
      },
    })

    // 计算连续签到天数
    let consecutiveDays = 0
    if (recentCheckins.length > 0) {
      const checkDate = new Date(today)
      for (const checkin of recentCheckins) {
        const checkinDate = new Date(checkin.checkin_date)
        checkinDate.setHours(0, 0, 0, 0)

        if (checkinDate.getTime() === checkDate.getTime()) {
          consecutiveDays++
          checkDate.setDate(checkDate.getDate() - 1)
        } else {
          break
        }
      }
    }

    // 获取本月签到总天数
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    const monthlyCheckins = await prisma.user_checkins.count({
      where: {
        user_id: userId,
        checkin_date: {
          gte: firstDayOfMonth,
        },
      },
    })

    return NextResponse.json({
      hasCheckedInToday: !!todayCheckin,
      consecutiveDays,
      monthlyCheckins,
      todayCheckin: todayCheckin
        ? {
            date: todayCheckin.checkin_date,
            creditsEarned: todayCheckin.credits_earned,
          }
        : null,
    })
  } catch (error) {
    console.error("Get checkin status error:", error)
    return NextResponse.json({ error: "获取签到状态失败" }, { status: 500 })
  }
}
