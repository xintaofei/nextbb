import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"

/**
 * 获取当前用户会话信息
 * GET /api/auth/session
 */
export async function GET() {
  try {
    const sessionUser = await getSessionUser()

    if (!sessionUser) {
      return NextResponse.json({ userId: null }, { status: 200 })
    }

    return NextResponse.json({
      userId: String(sessionUser.userId),
      email: sessionUser.email,
    })
  } catch (error) {
    console.error("Error getting session:", error)
    return NextResponse.json(
      { error: "Failed to get session" },
      { status: 500 }
    )
  }
}
