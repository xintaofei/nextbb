import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { verifyResetToken } from "@/lib/password-reset"
import { logSecurityEvent } from "@/lib/security-logger"
import { getClientIp } from "@/lib/get-client-ip"
import { getTranslations } from "next-intl/server"

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
    const userId = await verifyResetToken(token)
    if (!userId) {
      return NextResponse.json({ error: t("tokenInvalid") }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12)

    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    })

    const ip = await getClientIp()
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
