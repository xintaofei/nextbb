import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getServerSessionUser } from "@/lib/server-auth"

const CheckUsernameSchema = z.object({
  username: z
    .string()
    .min(2)
    .max(32)
    .regex(
      /^[a-zA-Z0-9_\u4e00-\u9fa5-]+$/,
      "Username can only contain letters, numbers, underscores, Chinese characters, and hyphens"
    )
    .refine(
      (val) => {
        // Prohibit URL path separators and special characters
        const dangerousChars = /[\/\\?#@%&=+\s.,:;'"<>{}\[\]|`~!$^*()]/
        if (dangerousChars.test(val)) return false
        // Prohibit starting or ending with hyphens (avoid command-line argument injection)
        if (val.startsWith("-") || val.endsWith("-")) return false
        // Prohibit consecutive hyphens
        if (/--/.test(val)) return false
        return true
      },
      {
        message: "Username contains disallowed characters or incorrect format",
      }
    ),
})

export async function POST(req: Request) {
  const session = await getServerSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: { username: string }
  try {
    const json = await req.json()
    body = CheckUsernameSchema.parse(json)
  } catch {
    return NextResponse.json(
      { available: false, error: "Invalid username format" },
      { status: 400 }
    )
  }

  const existingUser = await prisma.users.findFirst({
    where: {
      name: body.username,
      id: { not: session.userId },
    },
  })

  if (existingUser) {
    return NextResponse.json(
      { available: false, error: "Username already taken" },
      { status: 200 }
    )
  }

  return NextResponse.json({ available: true }, { status: 200 })
}
