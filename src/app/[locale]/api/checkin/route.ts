import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"
import { generateId } from "@/lib/id"
import { CreditService } from "@/lib/credit-service"
import { CreditLogType } from "@prisma/client"

/**
 * 用户签到接口
 * POST /api/checkin
 * Body: { timezoneOffset: number } - 用户时区偏移量（分钟，可选）
 */
export async function POST(request: Request) {
  try {
    // 验证用户登录
    const sessionUser = await getServerSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const userId = sessionUser.userId

    // 获取用户时区偏移量（从请求body中获取，如果没有则使用0）
    let timezoneOffset = 0
    try {
      const body = await request.json()
      timezoneOffset = body.timezoneOffset || 0

      // 校验时区偏移量范围（地球时区范围：UTC-12 到 UTC+14）
      // getTimezoneOffset 返回值：-840（UTC+14）到 720（UTC-12）
      if (
        typeof timezoneOffset !== "number" ||
        timezoneOffset < -840 ||
        timezoneOffset > 720
      ) {
        return NextResponse.json({ error: "时区偏移量不合法" }, { status: 400 })
      }
    } catch {
      // 如果没有传递时区，使用UTC时区
    }

    // 根据用户时区计算用户本地日期
    const now = new Date()
    // 将UTC时间转换为用户本地时间
    const userLocalTime = new Date(now.getTime() - timezoneOffset * 60 * 1000)
    const userYear = userLocalTime.getUTCFullYear()
    const userMonth = userLocalTime.getUTCMonth()
    const userDay = userLocalTime.getUTCDate()

    // 创建用户本地日期的UTC零点时间
    const today = new Date(Date.UTC(userYear, userMonth, userDay))

    // 获取明天的日期（用于范围查询）
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

    // 检查今天是否已经签到（使用范围查询避免时区问题）
    const existingCheckin = await prisma.user_checkins.findFirst({
      where: {
        user_id: userId,
        checkin_date: {
          gte: today,
          lt: tomorrow,
        },
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

    // 使用事务：创建签到记录 + 增加用户积分
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

      return { checkin }
    })

    // 使用统一的积分服务增加积分（并发安全）
    const creditResult = await CreditService.addCredits(
      userId,
      CHECKIN_CREDITS,
      CreditLogType.CHECKIN,
      "每日签到奖励"
    )

    if (!creditResult.success) {
      // 如果积分增加失败，需要回滚签到记录
      await prisma.user_checkins.delete({
        where: { id: result.checkin.id },
      })
      return NextResponse.json(
        { error: creditResult.error || "积分增加失败" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "签到成功",
      creditsEarned: CHECKIN_CREDITS,
      totalCredits: creditResult.newBalance,
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
 * GET /api/checkin?list=today&timezoneOffset=number - 获取用户本地日期的签到记录
 * GET /api/checkin?list=today&timezoneOffset=number&page=1&pageSize=20 - 分页获取签到记录
 */
export async function GET(request: Request) {
  try {
    // 获取URL参数，检查是否请求当日签到列表
    const { searchParams } = new URL(request.url)
    const getTodayList = searchParams.get("list") === "today"

    // 如果请求当日签到列表，不需要登录校验
    if (getTodayList) {
      // 获取用户时区偏移量（从URL参数获取）
      let timezoneOffset = 0
      const offsetParam = searchParams.get("timezoneOffset")
      if (offsetParam) {
        timezoneOffset = Number(offsetParam)
        // 校验时区偏移量范围
        if (
          isNaN(timezoneOffset) ||
          timezoneOffset < -840 ||
          timezoneOffset > 720
        ) {
          return NextResponse.json(
            { error: "时区偏移量不合法" },
            { status: 400 }
          )
        }
      }

      // 获取分页参数
      const pageParam = searchParams.get("page")
      const pageSizeParam = searchParams.get("pageSize")

      let page = 1
      let pageSize = 20
      if (pageParam) {
        const parsedPage = parseInt(pageParam, 10)
        if (!isNaN(parsedPage) && parsedPage >= 1) {
          page = parsedPage
        }
      }
      if (pageSizeParam) {
        const parsedPageSize = parseInt(pageSizeParam, 10)
        if (
          !isNaN(parsedPageSize) &&
          parsedPageSize >= 1 &&
          parsedPageSize <= 50
        ) {
          pageSize = parsedPageSize
        }
      }

      // 根据用户时区计算用户本地日期
      const now = new Date()
      const userLocalTime = new Date(now.getTime() - timezoneOffset * 60 * 1000)
      const userYear = userLocalTime.getUTCFullYear()
      const userMonth = userLocalTime.getUTCMonth()
      const userDay = userLocalTime.getUTCDate()

      // 创建用户本地日期的UTC零点时间
      const today = new Date(Date.UTC(userYear, userMonth, userDay))

      // 获取明天的日期（用于范围查询）
      const tomorrow = new Date(today)
      tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

      // 并行查询签到记录和总数
      const [todayCheckins, total] = await Promise.all([
        prisma.user_checkins.findMany({
          where: {
            checkin_date: {
              gte: today,
              lt: tomorrow,
            },
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
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.user_checkins.count({
          where: {
            checkin_date: {
              gte: today,
              lt: tomorrow,
            },
          },
        }),
      ])

      const hasMore = page * pageSize < total
      const offset = (page - 1) * pageSize

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
          rank: offset + index + 1,
        })),
        hasMore,
        total,
        page,
        pageSize,
        updatedAt: new Date().toISOString(),
      })
    }

    // 之前的逻辑：获取用户签到状态
    const sessionUser = await getServerSessionUser()
    if (!sessionUser) {
      return NextResponse.json({ error: "请先登录" }, { status: 401 })
    }

    const userId = sessionUser.userId

    // 获取今天的日期（使用 UTC 时间避免时区问题）
    const now = new Date()
    const today = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    )

    // 获取明天的日期（用于范围查询）
    const tomorrow = new Date(today)
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1)

    // 检查今天是否已签到（使用范围查询避免时区问题）
    const todayCheckin = await prisma.user_checkins.findFirst({
      where: {
        user_id: userId,
        checkin_date: {
          gte: today,
          lt: tomorrow,
        },
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
