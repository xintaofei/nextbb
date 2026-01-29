import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth-options-cache"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const authOptions = await getAuthOptions()
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json(null, { status: 401 })
  }

  // 实时查询 credits（不从 session 中获取）
  const user = await prisma.users.findUnique({
    where: { id: BigInt(session.user.id) },
    select: { credits: true },
  })

  return NextResponse.json({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    avatar: session.user.avatar,
    isAdmin: session.user.isAdmin,
    credits: user?.credits ?? 0,
  })
}
