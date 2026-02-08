import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import {
  verifyResetToken,
  checkResetAttemptRateLimit,
} from "@/lib/password-reset"
import { logSecurityEvent } from "@/lib/security-logger"
import { getClientIp } from "@/lib/get-client-ip"
import { getTranslations } from "next-intl/server"
import { isWeakPassword } from "@/lib/password-validation"

const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8).max(72),
})

export async function POST(request: Request) {
  const t = await getTranslations("Auth.PasswordReset.error")
  const json = await request.json().catch(() => null)
  const result = schema.safeParse(json)

  if (!result.success) {
    return NextResponse.json({ error: t("tokenRequired") }, { status: 400 })
  }

  const { token, newPassword } = result.data

  try {
    // 先校验密码（不消耗 token，允许用户修正后重试）
    if (isWeakPassword(newPassword)) {
      return NextResponse.json({ error: t("passwordWeak") }, { status: 400 })
    }
    if (Buffer.byteLength(newPassword, "utf8") > 72) {
      return NextResponse.json({ error: t("passwordMax") }, { status: 400 })
    }

    // 重置密码速率限制（10 次 / 15 分钟）
    const ip = await getClientIp()
    const rateLimitResult = await checkResetAttemptRateLimit(ip)
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          error: "Too many reset attempts",
          retryAfter: rateLimitResult.remainingTime,
        },
        { status: 429 }
      )
    }

    // 密码校验通过后才消费 token
    const userId = await verifyResetToken(token)
    if (!userId) {
      logSecurityEvent({
        event: "PASSWORD_RESET_FAILED",
        ip,
        details: "Invalid or expired reset token",
      })
      return NextResponse.json({ error: t("tokenInvalid") }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    logSecurityEvent({
      event: "PASSWORD_RESET_SUCCESS",
      userId,
      ip,
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Password reset failed:", error)
    return NextResponse.json({ error: t("resetFailed") }, { status: 500 })
  }
}
