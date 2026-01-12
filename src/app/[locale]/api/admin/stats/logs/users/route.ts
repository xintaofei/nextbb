import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { DashboardLogItem } from "@/types/admin"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get("limit") || "10")
    const offset = parseInt(searchParams.get("offset") || "0")

    const usersRaw = await prisma.users.findMany({
      take: limit,
      skip: offset,
      orderBy: { created_at: "desc" },
      where: { is_deleted: false },
    })

    const items: DashboardLogItem[] = usersRaw.map((u) => ({
      id: u.id.toString(),
      label: u.name,
      value: "Registered",
      subtitle: u.email,
      timestamp: u.created_at.toISOString(),
      avatar: u.avatar,
    }))

    return NextResponse.json({
      items,
      nextOffset: usersRaw.length === limit ? offset + limit : undefined,
    })
  } catch (error) {
    console.error("Failed to fetch user logs:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
