import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"

export const GET = async (request: NextRequest) => {
  const session = await getServerSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const q = searchParams.get("q")

  if (!q || q.length === 0) {
    return NextResponse.json([])
  }

  const users = await prisma.users.findMany({
    where: {
      OR: [{ name: { contains: q, mode: "insensitive" } }],
      is_deleted: false,
    },
    take: 6,
    select: {
      id: true,
      name: true,
      avatar: true,
    },
  })

  const result = users.map((user) => ({
    id: user.id.toString(),
    name: user.name,
    avatar: user.avatar,
  }))

  return NextResponse.json(result)
}
