import { NextRequest, NextResponse } from "next/server"
import { getServerSessionUser } from "@/lib/server-auth"
import {
  forceLogoutUser,
  clearForceLogout,
} from "@/lib/session-blacklist"
import { z } from "zod"

const ForceLogoutSchema = z.object({
  userId: z.string().regex(/^\d+$/),
  action: z.enum(["logout", "clear"]),
})

/**
 * 管理员强制用户登出
 * POST /api/admin/users/force-logout
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getServerSessionUser()
    if (!auth || !auth.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = ForceLogoutSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error },
        { status: 400 }
      )
    }

    const { userId, action } = validation.data

    if (action === "logout") {
      await forceLogoutUser(userId)
      return NextResponse.json({
        success: true,
        message: `用户 ${userId} 已被强制登出`,
      })
    } else {
      await clearForceLogout(userId)
      return NextResponse.json({
        success: true,
        message: `用户 ${userId} 强制登出状态已清除`,
      })
    }
  } catch (error) {
    console.error("Force logout error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
