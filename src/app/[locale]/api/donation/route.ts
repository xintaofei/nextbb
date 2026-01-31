import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type DonationType = "month" | "year" | "all"

type DonorInfo = {
  id: string | null
  name: string
  avatar: string
  isAnonymous: boolean
}

type RankingDonor = {
  rank: number
  donor: DonorInfo
  amount: number
  currency: string
  message: string | null
  donatedAt: string
}

type DonationResponse = {
  type: DonationType
  period: {
    year?: number
    month?: number
  }
  rankings: RankingDonor[]
  hasMore: boolean
  total: number
  page: number
  pageSize: number
  totalAmount: number
  totalCount: number
  updatedAt: string
}

// 默认匿名头像URL
const DEFAULT_ANONYMOUS_AVATAR = "/avatars/anonymous.png"

const DEFAULT_PAGE_SIZE = 20

export async function GET(req: Request) {
  const url = new URL(req.url)
  const type = url.searchParams.get("type") as DonationType | null
  const pageParam = url.searchParams.get("page")
  const pageSizeParam = url.searchParams.get("pageSize")

  // 验证类型参数
  if (!type || !["month", "year", "all"].includes(type)) {
    return NextResponse.json(
      { error: "Invalid donation type" },
      { status: 400 }
    )
  }

  // 验证分页参数
  let page = 1
  if (pageParam) {
    const parsedPage = parseInt(pageParam, 10)
    if (isNaN(parsedPage) || parsedPage < 1) {
      return NextResponse.json(
        { error: "Invalid page parameter" },
        { status: 400 }
      )
    }
    page = parsedPage
  }

  let pageSize = DEFAULT_PAGE_SIZE
  if (pageSizeParam) {
    const parsedPageSize = parseInt(pageSizeParam, 10)
    if (isNaN(parsedPageSize) || parsedPageSize < 1 || parsedPageSize > 100) {
      return NextResponse.json(
        { error: "Invalid pageSize parameter" },
        { status: 400 }
      )
    }
    pageSize = parsedPageSize
  }

  try {
    // 计算时间范围
    const now = new Date()
    let startDate: Date | undefined
    let periodInfo: { year?: number; month?: number } = {}

    if (type === "month") {
      // 本月：当前年月的第一天
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      periodInfo = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      }
    } else if (type === "year") {
      // 本年：当前年的1月1日
      startDate = new Date(now.getFullYear(), 0, 1)
      periodInfo = {
        year: now.getFullYear(),
      }
    }
    // type === "all" 时不设置 startDate

    // 查询捐赠记录
    const donations = await prisma.donations.findMany({
      where: {
        status: "CONFIRMED",
        is_deleted: false,
        ...(startDate && {
          created_at: {
            gte: startDate,
          },
        }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            avatar: true,
            is_deleted: true,
          },
        },
      },
      orderBy: {
        confirmed_at: "desc",
      },
    })

    // 按用户聚合数据
    const donorMap = new Map<
      string,
      {
        userId: string | null
        userName: string
        userAvatar: string
        isAnonymous: boolean
        totalAmount: number
        currency: string
        latestMessage: string | null
        latestDonatedAt: Date
      }
    >()

    donations.forEach((donation) => {
      let donorKey: string
      let donorName: string
      let donorAvatar: string
      let userId: string | null = null

      if (donation.is_anonymous) {
        // 匿名捐赠：使用特殊标识作为key
        donorKey = `anonymous_${donation.id}`
        donorName = donation.donor_name || "Anonymous"
        donorAvatar = DEFAULT_ANONYMOUS_AVATAR
      } else if (donation.user_id) {
        // 注册用户
        donorKey = donation.user_id.toString()
        userId = donation.user_id.toString()
        if (donation.user && !donation.user.is_deleted) {
          donorName = donation.user.name
          donorAvatar = donation.user.avatar
        } else {
          // 用户已删除，使用donor_name
          donorName = donation.donor_name || "Unknown"
          donorAvatar = DEFAULT_ANONYMOUS_AVATAR
        }
      } else {
        // 非注册用户
        donorKey = `guest_${donation.donor_email || donation.donor_name || donation.id}`
        donorName = donation.donor_name || "Anonymous"
        donorAvatar = DEFAULT_ANONYMOUS_AVATAR
      }

      const amount = parseFloat(donation.amount.toString())

      if (donorMap.has(donorKey)) {
        const existing = donorMap.get(donorKey)!
        existing.totalAmount += amount
        // 保留最新的留言和时间
        if (
          donation.confirmed_at &&
          donation.confirmed_at > existing.latestDonatedAt
        ) {
          existing.latestMessage = donation.message
          existing.latestDonatedAt = donation.confirmed_at
        }
      } else {
        donorMap.set(donorKey, {
          userId,
          userName: donorName,
          userAvatar: donorAvatar,
          isAnonymous: donation.is_anonymous,
          totalAmount: amount,
          currency: donation.currency,
          latestMessage: donation.message,
          latestDonatedAt: donation.confirmed_at || donation.created_at,
        })
      }
    })

    // 转换为数组并排序
    const allSortedDonors = Array.from(donorMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    )

    // 计算分页
    const total = allSortedDonors.length
    const startIndex = (page - 1) * pageSize
    const endIndex = startIndex + pageSize
    const paginatedDonors = allSortedDonors.slice(startIndex, endIndex)
    const hasMore = endIndex < total

    // 只在第一页计算统计数据，后续页面返回 0（前端只使用第一页的统计）
    let totalAmount = 0
    let totalCount = 0
    if (page === 1) {
      totalAmount = allSortedDonors.reduce(
        (sum, donor) => sum + donor.totalAmount,
        0
      )
      totalCount = total
    }

    // 生成排名列表
    const rankings: RankingDonor[] = paginatedDonors.map((donor, index) => ({
      rank: startIndex + index + 1,
      donor: {
        id: donor.userId,
        name: donor.userName,
        avatar: donor.userAvatar,
        isAnonymous: donor.isAnonymous,
      },
      amount: donor.totalAmount,
      currency: donor.currency,
      message: donor.latestMessage,
      donatedAt: donor.latestDonatedAt.toISOString(),
    }))

    const response: DonationResponse = {
      type,
      period: periodInfo,
      rankings,
      hasMore,
      total,
      page,
      pageSize,
      totalAmount,
      totalCount,
      updatedAt: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("Error fetching donation rankings:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
