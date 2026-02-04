import { createHash } from "crypto"
import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"
import { recordLogin } from "@/lib/auth"
import { AutomationEvents } from "@/lib/automation/event-bus"
import { verifyEmailCode } from "@/lib/email-verification"

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
  const json = await request.json().catch(() => null)
  const result = schema.safeParse(json)

  if (!result.success) {
    return NextResponse.json({ error: "参数不合法" }, { status: 400 })
  }

  const { password, username, emailCode } = result.data
  const email = normalizeEmail(result.data.email)

  const exists = await prisma.users.findUnique({
    where: { email },
  })

  if (exists) {
    return NextResponse.json({ error: "邮箱已被注册" }, { status: 409 })
  }

  if (await isEmailVerifyEnabled()) {
    if (!emailCode) {
      return NextResponse.json({ error: "请输入邮箱验证码" }, { status: 400 })
    }
    try {
      const isValid = await verifyEmailCode(email, emailCode)
      if (!isValid) {
        return NextResponse.json(
          { error: "邮箱验证码无效或已过期" },
          { status: 400 }
        )
      }
    } catch (error) {
      console.error("Email code verification failed:", error)
      return NextResponse.json({ error: "邮箱验证码验证失败" }, { status: 500 })
    }
  }

  const hash = await bcrypt.hash(password, 12)

  const id = generateId()

  const emailHash = createHash("md5")
    .update(email.trim().toLowerCase())
    .digest("hex")
  const avatarUrl = `https://www.gravatar.com/avatar/${emailHash}`

  // 检查是否是第一个用户
  const userCount = await prisma.users.count()
  const isFirstUser = userCount === 0

  const user = await prisma.users.create({
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
}
