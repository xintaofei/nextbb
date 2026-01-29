import { NextRequest, NextResponse } from "next/server"
import { getServerSessionUser } from "@/lib/server-auth"
import { prisma } from "@/lib/prisma"
import { generateTOTPSecret, generateTOTPUri, verifyTOTP } from "@/lib/totp"
import { z } from "zod"

/**
 * GET - 获取 2FA 状态
 */
export async function GET() {
  try {
    const auth = await getServerSessionUser()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const twoFactor = await prisma.user_two_factor.findUnique({
      where: { user_id: auth.userId },
      select: {
        is_enabled: true,
        enabled_at: true,
        last_used_at: true,
      },
    })

    return NextResponse.json({
      enabled: twoFactor?.is_enabled ?? false,
      enabledAt: twoFactor?.enabled_at?.toISOString() ?? null,
      lastUsedAt: twoFactor?.last_used_at?.toISOString() ?? null,
    })
  } catch (error) {
    console.error("Get 2FA status error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

const SetupSchema = z.object({
  action: z.literal("setup"),
})

const EnableSchema = z.object({
  action: z.literal("enable"),
  token: z.string().length(6).regex(/^\d{6}$/),
})

const DisableSchema = z.object({
  action: z.literal("disable"),
  token: z.string().length(6).regex(/^\d{6}$/),
})

const TwoFactorSchema = z.discriminatedUnion("action", [
  SetupSchema,
  EnableSchema,
  DisableSchema,
])

/**
 * POST - 设置/启用/禁用 2FA
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getServerSessionUser()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const validation = TwoFactorSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request", details: validation.error },
        { status: 400 }
      )
    }

    const { action } = validation.data

    // Setup: 生成新的密钥
    if (action === "setup") {
      const secret = generateTOTPSecret()
      const user = await prisma.users.findUnique({
        where: { id: auth.userId },
        select: { email: true },
      })

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      const uri = generateTOTPUri(secret, user.email)

      // 创建或更新 2FA 记录（但不启用）
      await prisma.user_two_factor.upsert({
        where: { user_id: auth.userId },
        create: {
          user_id: auth.userId,
          secret,
          is_enabled: false,
        },
        update: {
          secret,
          is_enabled: false,
        },
      })

      return NextResponse.json({
        secret,
        uri,
        message: "请使用authenticator app扫描二维码，然后输入验证码以启用2FA",
      })
    }

    // Enable: 验证并启用 2FA
    if (action === "enable") {
      const twoFactor = await prisma.user_two_factor.findUnique({
        where: { user_id: auth.userId },
      })

      if (!twoFactor) {
        return NextResponse.json(
          { error: "请先设置 2FA" },
          { status: 400 }
        )
      }

      if (twoFactor.is_enabled) {
        return NextResponse.json({ error: "2FA 已启用" }, { status: 400 })
      }

      const isValid = await verifyTOTP(twoFactor.secret, validation.data.token)
      if (!isValid) {
        return NextResponse.json({ error: "验证码无效" }, { status: 400 })
      }

      await prisma.user_two_factor.update({
        where: { user_id: auth.userId },
        data: {
          is_enabled: true,
          enabled_at: new Date(),
        },
      })

      return NextResponse.json({
        success: true,
        message: "2FA 已启用",
      })
    }

    // Disable: 验证并禁用 2FA
    if (action === "disable") {
      const twoFactor = await prisma.user_two_factor.findUnique({
        where: { user_id: auth.userId },
      })

      if (!twoFactor || !twoFactor.is_enabled) {
        return NextResponse.json({ error: "2FA 未启用" }, { status: 400 })
      }

      const isValid = await verifyTOTP(twoFactor.secret, validation.data.token)
      if (!isValid) {
        return NextResponse.json({ error: "验证码无效" }, { status: 400 })
      }

      await prisma.user_two_factor.delete({
        where: { user_id: auth.userId },
      })

      return NextResponse.json({
        success: true,
        message: "2FA 已禁用",
      })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("2FA operation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
