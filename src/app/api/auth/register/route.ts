import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"
import { signAuthToken, setAuthCookie } from "@/lib/auth"
import { createHash } from "crypto"

const schema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
  username: z.string().min(2).max(32),
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
