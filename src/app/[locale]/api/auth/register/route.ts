import { createHash } from "crypto"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"
import { recordLogin } from "@/lib/auth"
import { AutomationEvents } from "@/lib/automation/event-bus"
import { verifyEmailCode } from "@/lib/email-verification"
import { getTranslations } from "next-intl/server"

const schema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
  username: z
    .string()
    .min(2)
    .max(32)
    .regex(
      /^[a-zA-Z0-9_\u4e00-\u9fa5-]+$/,
      "用户名只能包含字母、数字、下划线、中文和连字符"
    )
    .refine(
      (val) => {
        // 禁止URL路径分隔符和特殊字符
        const dangerousChars = /[\/\\?#@%&=+\s.,:;'"<>{}\[\]|`~!$^*()]/
        if (dangerousChars.test(val)) return false
        // 禁止以连字符开头或结尾(避免命令行参数注入)
        if (val.startsWith("-") || val.endsWith("-")) return false
        // 禁止连续连字符
        if (/--/.test(val)) return false
        return true
      },
      {
        message: "用户名包含不允许的字符或格式不正确",
      }
    ),
  emailCode: z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim().length === 0) {
        return undefined
      }
      return value
    },
    z
      .string()
      .trim()
      .regex(/^\d{6}$/)
      .optional()
  ),
})

async function isRegistrationEnabled(): Promise<boolean> {
  const config = await prisma.system_configs.findUnique({
    where: { config_key: "registration.enabled" },
    select: { config_value: true },
  })
  return config?.config_value === "true"
}

async function isEmailVerifyEnabled(): Promise<boolean> {
  const config = await prisma.system_configs.findUnique({
    where: { config_key: "registration.email_verify" },
    select: { config_value: true },
  })
  return config?.config_value === "true"
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

export async function POST(request: Request) {
  const t = await getTranslations("Auth.Register.error")

  // 检查是否开放注册
  if (!(await isRegistrationEnabled())) {
    return NextResponse.json(
      { error: t("registrationNotEnabled") },
      { status: 403 }
    )
  }

  const json = await request.json().catch(() => null)
  const result = schema.safeParse(json)

  if (!result.success) {
    return NextResponse.json({ error: t("invalidParams") }, { status: 400 })
  }

  const { password, username, emailCode } = result.data
  const email = normalizeEmail(result.data.email)

  if (await isEmailVerifyEnabled()) {
    if (!emailCode) {
      return NextResponse.json({ error: t("codeRequired") }, { status: 400 })
    }
    try {
      const isValid = await verifyEmailCode(email, emailCode)
      if (!isValid) {
        return NextResponse.json(
          { error: t("codeInvalidOrExpired") },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error("Email code verification failed:", error)
      return NextResponse.json(
        { error: t("codeVerificationFailed") },
        { status: 500 }
      )
    }
  }

  const hash = await bcrypt.hash(password, 12)

  const id = generateId()

  const emailHash = createHash("md5")
    .update(email.trim().toLowerCase())
    .digest("hex")
  const avatarUrl = `https://www.gravatar.com/avatar/${emailHash}`

  try {
    const user = await prisma.$transaction(async (tx) => {
      // 检查邮箱和用户名是否已存在
      const [emailExists, usernameExists] = await Promise.all([
        tx.users.findUnique({ where: { email } }),
        tx.users.findFirst({ where: { name: username } }),
      ])

      if (emailExists) {
        throw new Error("EMAIL_EXISTS")
      }

      if (usernameExists) {
        throw new Error("USERNAME_EXISTS")
      }

      // 检查是否是第一个用户
      const userCount = await tx.users.count()
      const isFirstUser = userCount === 0

      // 创建用户
      return await tx.users.create({
        data: {
          id,
          email,
          name: username,
          avatar: avatarUrl,
          password: hash,
          status: 1,
          is_deleted: false,
          is_admin: isFirstUser,
        },
      })
    })

    // 触发用户注册事件
    await AutomationEvents.userRegister({
      userId: user.id,
      email: user.email,
    })

    await recordLogin(user.id, "SUCCESS", "FORM")

    // 返回成功，让客户端调用 signIn
    return NextResponse.json(
      {
        success: true,
        email: user.email,
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "EMAIL_EXISTS") {
        return NextResponse.json({ error: t("emailExists") }, { status: 409 })
      }
      if (error.message === "USERNAME_EXISTS") {
        return NextResponse.json(
          { error: t("usernameExists") },
          { status: 409 }
        )
      }
    }
    console.error("User registration failed:", error)
    return NextResponse.json(
      { error: t("registrationFailed") },
      { status: 500 }
    )
  }
}
