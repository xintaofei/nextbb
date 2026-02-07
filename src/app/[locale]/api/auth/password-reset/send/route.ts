import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/services/email-service"
import { getServerSessionUser } from "@/lib/server-auth"
import { logSecurityEvent } from "@/lib/security-logger"
import { getClientIp } from "@/lib/get-client-ip"
import { getTranslations } from "next-intl/server"
import {
  PasswordResetConfig,
  generateResetToken,
  getResetCooldown,
  storeResetToken,
  clearResetToken,
} from "@/lib/password-reset"

export async function POST() {
  const user = await getServerSessionUser()
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const t = await getTranslations("Auth.PasswordReset.error")
  const tEmail = await getTranslations("Auth.PasswordReset.email")

  const dbUser = await prisma.users.findUnique({
    where: { id: user.userId },
    select: { email: true },
  })

  if (!dbUser?.email) {
    return NextResponse.json({ error: t("noEmail") }, { status: 400 })
  }

  try {
    const cooldown = await getResetCooldown(user.userId)
    if (cooldown > 0) {
      return NextResponse.json(
        { error: t("sendTooFrequent"), retryAfter: cooldown },
        { status: 429 }
      )
    }

    const token = generateResetToken()
    await storeResetToken(user.userId, token)

    const baseUrl = process.env.NEXTAUTH_URL || ""
    const resetLink = `${baseUrl}/reset-password?token=${token}`
    const expiresMinutes = Math.floor(PasswordResetConfig.tokenTtlSeconds / 60)

    const subject = tEmail("subject")
    const text = tEmail("textBody", {
      link: resetLink,
      minutes: expiresMinutes,
    })
    const htmlLine1 = tEmail("htmlLine1")
    const htmlLine2 = tEmail("htmlLine2", { minutes: expiresMinutes })
    const html = `<p>${htmlLine1}</p><p><a href="${resetLink}">${resetLink}</a></p><p>${htmlLine2}</p>`

    try {
      await sendEmail({ to: dbUser.email, subject, text, html })
    } catch (error) {
      await clearResetToken(token)
      throw error
    }

    const ip = await getClientIp()
    logSecurityEvent({
      event: "PASSWORD_RESET_REQUESTED",
      userId: user.userId,
      email: dbUser.email,
      ip,
    })

    return NextResponse.json({
      success: true,
      cooldown: PasswordResetConfig.cooldownSeconds,
      expiresIn: PasswordResetConfig.tokenTtlSeconds,
    })
  } catch (error) {
    console.error("Failed to send password reset email:", error)
    return NextResponse.json({ error: t("sendFailed") }, { status: 500 })
  }
}
