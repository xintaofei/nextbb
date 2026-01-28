import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const auth = await getSessionUser()
  if (!auth) return NextResponse.json(null, { status: 401 })

  const user = await prisma.users.findUnique({
    where: { id: auth.userId },
  })
  if (!user || user.is_deleted || user.status !== 1) {
    return NextResponse.json(null, { status: 401 })
  }

  return NextResponse.json({
    id: String(user.id),
    email: user.email,
    name: user.name,
    avatar: user.avatar,
    isAdmin: user.is_admin,
    credits: user.credits,
  })
}
