import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export async function GET(req: Request) {
  const user = await getSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const q = searchParams.get("q")?.trim() || ""
  const context = searchParams.get("context") // 'reply' or 'new-topic'
  const targetId = searchParams.get("targetId") // topicAuthorId for 'reply'

  try {
    if (!q) {
      // 初始显示逻辑
      let initialUsers: Array<{ id: bigint; name: string; avatar: string }> = []

      if (context === "reply" && targetId) {
        // 回复模式：只显示楼主
        const author = await prisma.users.findUnique({
          where: { id: BigInt(targetId), is_deleted: false, status: 1 },
          select: { id: true, name: true, avatar: true },
        })
        if (author) initialUsers = [author]
      } else if (context === "new-topic") {
        // 发布话题：显示自己
        const me = await prisma.users.findUnique({
          where: { id: user.userId, is_deleted: false, status: 1 },
          select: { id: true, name: true, avatar: true },
        })
        if (me) initialUsers = [me]
      } else {
        // 默认：最近活跃的 6 个用户
        initialUsers = await prisma.users.findMany({
          where: { is_deleted: false, status: 1 },
          select: { id: true, name: true, avatar: true },
          take: 6,
          orderBy: { created_at: "desc" },
        })
      }

      const result = initialUsers.map((u) => ({
        key: String(u.id),
        text: u.name,
        avatar: u.avatar,
      }))
      return NextResponse.json(result)
    }

    const where: {
      is_deleted: boolean
      status: number
      name: { contains: string; mode: "insensitive" }
    } = {
      is_deleted: false,
      status: 1, // 正常状态
      name: {
        contains: q,
        mode: "insensitive",
      },
    }

    const users = await prisma.users.findMany({
      where,
      select: {
        id: true,
        name: true,
        avatar: true,
      },
      take: 6,
      orderBy: { name: "asc" },
    })

    const result = users.map((u) => ({
      key: String(u.id),
      text: u.name,
      avatar: u.avatar,
    }))

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error searching users:", error)
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
