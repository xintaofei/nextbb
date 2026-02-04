import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { sendEmail } from "@/lib/services/email-service"
import {
  EmailVerificationConfig,
  generateEmailCode,
  getEmailCodeCooldown,
  storeEmailCode,
  clearEmailCode,
} from "@/lib/email-verification"

const schema = z.object({
  email: z.email(),
})

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

async function isEmailVerifyEnabled(): Promise<boolean> {
  const config = await prisma.system_configs.findUnique({
    where: { config_key: "registration.email_verify" },
    select: { config_value: true },
  })
  return config?.config_value === "true"
}

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const result = schema.safeParse(json)

  if (!result.success) {
    return NextResponse.json({ error: "参数不合法" }, { status: 400 })
  }

  if (!(await isEmailVerifyEnabled())) {
    return NextResponse.json({ error: "邮箱验证未开启" }, { status: 400 })
  }

  const email = normalizeEmail(result.data.email)

  const exists = await prisma.users.findUnique({
    where: { email },
  })

  if (exists) {
    return NextResponse.json({ error: "邮箱已被注册" }, { status: 409 })
  }

  try {
    const cooldown = await getEmailCodeCooldown(email)
    if (cooldown > 0) {
      return NextResponse.json(
        { error: "发送过于频繁，请稍后再试", retryAfter: cooldown },
        { status: 429 }
      )
    }

    const code = generateEmailCode()
    await storeEmailCode(email, code)

    const subject = "注册验证码"
    const text = `您的注册验证码是：${code}，有效期 ${Math.floor(
      EmailVerificationConfig.codeTtlSeconds / 60
    )} 分钟。`
    const html = `<p>您的注册验证码是：<strong>${code}</strong></p><p>有效期 ${Math.floor(
      EmailVerificationConfig.codeTtlSeconds / 60
    )} 分钟。</p>`

    try {
      await sendEmail({ to: email, subject, text, html })
    } catch (error) {
      await clearEmailCode(email)
      throw error
    }

    return NextResponse.json({
      success: true,
      cooldown: EmailVerificationConfig.cooldownSeconds,
      expiresIn: EmailVerificationConfig.codeTtlSeconds,
    })
  } catch (error) {
    console.error("Failed to send email code:", error)
    return NextResponse.json({ error: "验证码发送失败" }, { status: 500 })
  }
}
