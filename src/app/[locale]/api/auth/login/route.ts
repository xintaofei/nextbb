import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { signAuthToken, setAuthCookie } from "@/lib/auth"

const schema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
})

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const result = schema.safeParse(json)

  if (!result.success) {
    return NextResponse.json({ error: "参数不合法" }, { status: 400 })
  }

  const { email, password } = result.data

  const user = await prisma.users.findUnique({
    where: { email },
  })

  if (!user || user.is_deleted || user.status !== 1) {
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 })
  }

  const ok = await bcrypt.compare(password, user.password)

  if (!ok) {
    return NextResponse.json({ error: "邮箱或密码错误" }, { status: 401 })
  }

  const token = await signAuthToken({
    sub: user.id.toString(),
    email: user.email,
    isAdmin: user.is_admin,
  })

  await setAuthCookie(token)

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
    { status: 200 }
  )
}
