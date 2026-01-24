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
  birthday: z.string().nullable().optional(),
  titleBadgeId: z.string().regex(/^\d+$/).nullable().optional(),
  customStatus: z
    .object({
      emoji: z.string().max(16).nullable().optional(),
      statusText: z.string().max(100),
      expiresAt: z.string().nullable().optional(),
    })
    .nullable()
    .optional(),
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
    title_badge_id?: bigint | null
    updated_at: Date
  } = { updated_at: new Date() }

  if (typeof body.username === "string") data.name = body.username

  if (body.titleBadgeId !== undefined) {
    if (body.titleBadgeId === null) {
      data.title_badge_id = null
    } else {
      const userBadge = await prisma.user_badges.findUnique({
        where: {
          user_id_badge_id: {
            user_id: session.userId,
            badge_id: BigInt(body.titleBadgeId),
          },
          is_deleted: false,
        },
      })
      if (!userBadge) {
        return NextResponse.json({ error: "Badge not owned" }, { status: 400 })
      }
      data.title_badge_id = BigInt(body.titleBadgeId)
    }
  }

  try {
    // Use transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Update user basic info
      await tx.users.update({
        where: { id: session.userId },
        data,
      })

      // Handle custom status
      if (body.customStatus !== undefined) {
        if (body.customStatus === null) {
          // Delete custom status if set to null
          await tx.user_custom_statuses.deleteMany({
            where: { user_id: session.userId },
          })
        } else {
          // Upsert custom status
          const expiresAt = body.customStatus.expiresAt
            ? new Date(body.customStatus.expiresAt)
            : null

          await tx.user_custom_statuses.upsert({
            where: { user_id: session.userId },
            create: {
              user_id: session.userId,
              emoji: body.customStatus.emoji || null,
              status_text: body.customStatus.statusText,
              expires_at: expiresAt,
              is_deleted: false,
            },
            update: {
              emoji: body.customStatus.emoji || null,
              status_text: body.customStatus.statusText,
              expires_at: expiresAt,
              is_deleted: false,
              updated_at: new Date(),
            },
          })
        }
      }
    })

    // Fetch updated user data with custom status
    const updated = await prisma.users.findUnique({
      where: { id: session.userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        bio: true,
        website: true,
        location: true,
        birthday: true,
        title_badge_id: true,
        updated_at: true,
        custom_status: {
          select: {
            emoji: true,
            status_text: true,
            expires_at: true,
          },
        },
      },
    })

    if (!updated) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

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
        titleBadgeId: updated.title_badge_id
          ? String(updated.title_badge_id)
          : null,
        customStatus:
          updated.custom_status &&
          (!updated.custom_status.expires_at ||
            new Date(updated.custom_status.expires_at) > new Date())
            ? {
                emoji: updated.custom_status.emoji,
                statusText: updated.custom_status.status_text,
                expiresAt: updated.custom_status.expires_at
                  ? updated.custom_status.expires_at.toISOString()
                  : null,
              }
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
