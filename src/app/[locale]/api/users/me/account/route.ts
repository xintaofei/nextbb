import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

const UpdateAccountSchema = z.object({
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
    )
    .optional(),
  bio: z.string().max(500).optional(),
  website: z.url().max(256).optional().or(z.literal("")),
  location: z.string().max(100).optional(),
  birthday: z.iso.date().nullable().optional(),
})

type UpdateAccountDTO = z.infer<typeof UpdateAccountSchema>

export async function PATCH(req: Request) {
  const session = await getSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: UpdateAccountDTO
  try {
    const json = await req.json()
    body = UpdateAccountSchema.parse(json)
  } catch (error) {
    console.error("Update account error:", error)
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  // Check username uniqueness if username is being changed
  if (body.username) {
    const existingUser = await prisma.users.findFirst({
      where: {
        name: body.username,
        id: { not: session.userId },
      },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already taken" },
        { status: 409 }
      )
    }
  }

  const data: {
    name?: string
    bio?: string
    website?: string
    location?: string
    birthday?: Date | null
    updated_at: Date
  } = { updated_at: new Date() }

  if (typeof body.username === "string") data.name = body.username
  if (typeof body.bio === "string") data.bio = body.bio
  if (typeof body.website === "string") data.website = body.website
  if (typeof body.location === "string") data.location = body.location
  if (body.birthday !== undefined) {
    data.birthday = body.birthday ? new Date(body.birthday) : null
  }

  try {
    const updated = await prisma.users.update({
      where: { id: session.userId },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        website: true,
        location: true,
        birthday: true,
        updated_at: true,
      },
    })

    return NextResponse.json(
      {
        id: String(updated.id),
        name: updated.name,
        email: updated.email,
        avatar: updated.avatar,
        bio: updated.bio,
        website: updated.website,
        location: updated.location,
        birthday: updated.birthday
          ? (updated.birthday as Date).toISOString()
          : null,
        updatedAt: updated.updated_at.toISOString(),
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Update account error:", error)
    return NextResponse.json(
      { error: "Failed to update account" },
      { status: 500 }
    )
  }
}
