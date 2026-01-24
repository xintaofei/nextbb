import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

const UpdateProfileSchema = z.object({
  bio: z.string().max(500).optional(),
  website: z.url().max(256).optional().or(z.literal("")),
  location: z.string().max(100).optional(),
  birthday: z.string().nullable().optional(),
})

type UpdateProfileDTO = z.infer<typeof UpdateProfileSchema>

export async function PATCH(req: Request) {
  const session = await getSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: UpdateProfileDTO
  try {
    const json = await req.json()
    body = UpdateProfileSchema.parse(json)
  } catch (error) {
    console.error("Update profile error:", error)
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const data: {
    bio?: string
    website?: string
    location?: string
    birthday?: Date | null
    updated_at: Date
  } = { updated_at: new Date() }

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
    console.error("Update profile error:", error)
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 500 }
    )
  }
}
