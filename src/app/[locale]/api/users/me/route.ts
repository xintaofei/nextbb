import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"

/**
 * GET /api/users/me
 * 获取当前登录用户的完整信息（包括实时积分）
 */
export async function GET() {
  const session = await getServerSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const user = await prisma.users.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        is_admin: true,
        is_deleted: true,
        status: true,
        credits: true,
        bio: true,
        website: true,
        location: true,
        birthday: true,
      },
    })

    if (!user || user.is_deleted || user.status !== 1) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      id: String(user.id),
      email: user.email,
      name: user.name,
      avatar: user.avatar,
      isAdmin: user.is_admin,
      credits: user.credits,
      bio: user.bio,
      website: user.website,
      location: user.location,
      birthday: user.birthday ? user.birthday.toISOString() : null,
    })
  } catch (error) {
    console.error("Failed to get current user:", error)
    return NextResponse.json(
      { error: "Failed to get user info" },
      { status: 500 }
    )
  }
}
