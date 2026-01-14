import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type Params = Promise<{ id: string }>

/**
 * 获取用户个人资料信息
 * GET /api/users/:id/profile
 */
export async function GET(_req: Request, props: { params: Params }) {
  const params = await props.params
  const userId = BigInt(params.id)

  try {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        avatar: true,
        is_deleted: true,
        bio: true,
        website: true,
        location: true,
        birthday: true,
      },
    })

    if (!user || user.is_deleted) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    return NextResponse.json({
      name: user.name,
      avatar: user.avatar,
      bio: user.bio,
      website: user.website,
      location: user.location,
      birthday: user.birthday ? user.birthday.toISOString() : null,
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Failed to fetch user profile" },
      { status: 500 }
    )
  }
}
