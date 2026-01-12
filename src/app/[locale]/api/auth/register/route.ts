import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"
import { signAuthToken, setAuthCookie, recordLogin } from "@/lib/auth"
import { createHash } from "crypto"
import { emitUserRegisterEvent } from "@/lib/automation/events"

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
})

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const result = schema.safeParse(json)

  if (!result.success) {
    return NextResponse.json({ error: "参数不合法" }, { status: 400 })
  }

  const { email, password, username } = result.data

  const exists = await prisma.users.findUnique({
    where: { email },
  })

  if (exists) {
    return NextResponse.json({ error: "邮箱已被注册" }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 12)

  const id = generateId()

  const emailHash = createHash("md5")
    .update(email.trim().toLowerCase())
    .digest("hex")
  const avatarUrl = `https://www.gravatar.com/avatar/${emailHash}`

  const user = await prisma.users.create({
    data: {
      id,
      email,
      name: username,
      avatar: avatarUrl,
      password: hash,
      status: 1,
      is_deleted: false,
    },
  })

  // 触发用户注册事件
  await emitUserRegisterEvent({
    userId: user.id,
    email: user.email,
  })

  const token = await signAuthToken({
    sub: user.id.toString(),
    email: user.email,
    isAdmin: user.is_admin,
  })

  await setAuthCookie(token)
  await recordLogin(user.id, "SUCCESS", "FORM")

  return NextResponse.json(
    {
      user: {
        id: user.id.toString(),
        email: user.email,
        isAdmin: user.is_admin,
      },
      profile: {
        id: user.id.toString(),
        email: user.email,
        username: user.name,
        avatar: user.avatar,
      },
    },
    { status: 201 }
  )
}
