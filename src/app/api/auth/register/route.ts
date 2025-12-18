import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"
import { signAuthToken, setAuthCookie } from "@/lib/auth"

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72),
  username: z.string().min(2).max(32),
  avatar: z.string().url().optional(),
})

export async function POST(request: Request) {
  const json = await request.json().catch(() => null)
  const result = schema.safeParse(json)

  if (!result.success) {
    return NextResponse.json({ error: "参数不合法" }, { status: 400 })
  }

  const { email, password, username, avatar } = result.data

  const exists = await prisma.users.findUnique({
    where: { email },
  })

  if (exists) {
    return NextResponse.json({ error: "邮箱已被注册" }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 12)

  const id = generateId()

  const user = await prisma.users.create({
    data: {
      id,
      email,
      name: username,
      avatar: avatar ?? "",
      password: hash,
      status: 1,
      is_deleted: false,
    },
  })

  const token = await signAuthToken({
    sub: user.id.toString(),
    email: user.email,
  })

  await setAuthCookie(token)

  return NextResponse.json(
    {
      user: {
        id: user.id.toString(),
        email: user.email,
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
