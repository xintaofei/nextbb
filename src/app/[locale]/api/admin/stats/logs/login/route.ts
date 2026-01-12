import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> }
) {
  try {
    const { locale } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    const [logsRaw, total] = await Promise.all([
      prisma.user_login_logs.findMany({
        take: limit,
        skip: offset,
        orderBy: { login_at: "desc" },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      }),
      prisma.user_login_logs.count(),
    ])

    const statusMap: Record<string, Record<string, string>> = {
      zh: {
        SUCCESS: "成功",
        FAILED: "失败",
      },
      en: {
        SUCCESS: "Success",
        FAILED: "Failed",
      },
    }

    const items = logsRaw.map((log) => ({
      id: log.id.toString(),
      user: {
        id: log.user.id.toString(),
        name: log.user.name,
        avatar: log.user.avatar,
      },
      ip: log.ip,
      userAgent: log.user_agent,
      location:
        log.location_lat && log.location_long
          ? `${log.location_lat}, ${log.location_long}`
          : null,
      status: log.status,
      statusLabel: statusMap[locale]?.[log.status] || log.status,
      loginAt: log.login_at.toISOString(),
    }))

    return NextResponse.json({
      items,
      total,
      nextOffset: logsRaw.length === limit ? offset + limit : undefined,
    })
  } catch (error) {
    console.error("Failed to fetch login logs:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
