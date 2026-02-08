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
import { getConfigValue } from "@/lib/services/config-service"

const schema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
  username: z
    .string()
    .min(1)
    .max(64)
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
  inviteCode: z.preprocess(
    (value) => {
      if (typeof value === "string" && value.trim().length === 0) {
        return undefined
      }
      return value
    },
    z
      .string()
      .trim()
      .length(32)
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

async function isInviteCodeRequired(): Promise<boolean> {
  const config = await prisma.system_configs.findUnique({
    where: { config_key: "registration.require_invite_code" },
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

  const { password, username, emailCode, inviteCode } = result.data
  const email = normalizeEmail(result.data.email)

  // 从配置获取用户名长度限制
  const [usernameMinLength, usernameMaxLength] = await Promise.all([
    getConfigValue("registration.username_min_length"),
    getConfigValue("registration.username_max_length"),
  ])

  if (username.length < usernameMinLength) {
    return NextResponse.json(
      { error: t("usernameMin", { min: usernameMinLength }) },
      { status: 400 }
    )
  }

  if (username.length > usernameMaxLength) {
    return NextResponse.json(
      { error: t("usernameMax", { max: usernameMaxLength }) },
      { status: 400 }
    )
  }

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

  // 邀请码验证
  const inviteCodeRequired = await isInviteCodeRequired()
  let validInviteCode: {
    id: bigint
    user_id: bigint
    maxUses: number | null
  } | null = null

  if (inviteCodeRequired) {
    if (!inviteCode) {
      return NextResponse.json(
        { error: t("inviteCodeRequired") },
        { status: 400 }
      )
    }

    const codeRecord = await prisma.user_invite_codes.findUnique({
      where: { code: inviteCode },
      select: {
        id: true,
        user_id: true,
        is_active: true,
        max_uses: true,
        used_count: true,
        expires_at: true,
      },
    })

    if (!codeRecord) {
      return NextResponse.json(
        { error: t("inviteCodeInvalid") },
        { status: 400 }
      )
    }

    if (!codeRecord.is_active) {
      return NextResponse.json(
        { error: t("inviteCodeInactive") },
        { status: 400 }
      )
    }

    if (codeRecord.expires_at && codeRecord.expires_at < new Date()) {
      return NextResponse.json(
        { error: t("inviteCodeExpired") },
        { status: 400 }
      )
    }

    if (
      codeRecord.max_uses !== null &&
      codeRecord.used_count >= codeRecord.max_uses
    ) {
      return NextResponse.json(
        { error: t("inviteCodeMaxUsed") },
        { status: 400 }
      )
    }

    validInviteCode = {
      id: codeRecord.id,
      user_id: codeRecord.user_id,
      maxUses: codeRecord.max_uses,
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
      const newUser = await tx.users.create({
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

      // 记录邀请关系
      if (validInviteCode) {
        await tx.user_invitations.create({
          data: {
            id: generateId(),
            inviter_id: validInviteCode.user_id,
            invitee_id: id,
            invite_code_id: validInviteCode.id,
          },
        })

        // 使用 updateMany + WHERE 条件防止并发竞态
        const updated = await tx.user_invite_codes.updateMany({
          where: {
            id: validInviteCode.id,
            OR: [
              { max_uses: null },
              { used_count: { lt: validInviteCode.maxUses ?? 99999999 } },
            ],
          },
          data: {
            used_count: { increment: 1 },
          },
        })

        if (updated.count === 0) {
          throw new Error("INVITE_CODE_MAX_USED")
        }
      }

      return newUser
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
      if (error.message === "INVITE_CODE_MAX_USED") {
        return NextResponse.json(
          { error: t("inviteCodeMaxUsed") },
          { status: 400 }
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
