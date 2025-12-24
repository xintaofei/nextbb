import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/guard"

const PatchSchema = z.object({
  is_admin: z.boolean().optional(),
  status: z.number().optional(),
  is_deleted: z.boolean().optional(),
  name: z.string().min(2).max(32).optional(),
})

type PatchDTO = z.infer<typeof PatchSchema>

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const actor = await requireAdmin()
  if (!actor)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: PatchDTO
  try {
    const json = await req.json()
    body = PatchSchema.parse(json)
  } catch {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  let targetId: bigint
  try {
    targetId = BigInt(params.id)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const target = await prisma.users.findUnique({
    where: { id: targetId },
    select: { id: true, is_admin: true, is_deleted: true, status: true },
  })
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 })
  }

  if (body.is_admin === false && actor.userId === targetId) {
    return NextResponse.json(
      { error: "Cannot revoke your own admin role" },
      { status: 400 }
    )
  }

  if (body.is_admin === false) {
    const otherAdmins = await prisma.users.count({
      where: {
        is_admin: true,
        is_deleted: false,
        status: 1,
        NOT: { id: targetId },
      },
    })
    if (otherAdmins === 0) {
      return NextResponse.json(
        { error: "At least one admin must remain" },
        { status: 400 }
      )
    }
  }

  const data: {
    is_admin?: boolean
    status?: number
    is_deleted?: boolean
    name?: string
    updated_at?: Date
  } = { updated_at: new Date() }

  if (typeof body.is_admin === "boolean") data.is_admin = body.is_admin
  if (typeof body.status === "number") data.status = body.status
  if (typeof body.is_deleted === "boolean") data.is_deleted = body.is_deleted
  if (typeof body.name === "string") data.name = body.name

  const updated = await prisma.users.update({
    where: { id: targetId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      avatar: true,
      is_admin: true,
      status: true,
      is_deleted: true,
      created_at: true,
      updated_at: true,
    },
  })

  return NextResponse.json(
    {
      id: String(updated.id),
      email: updated.email,
      name: updated.name,
      avatar: updated.avatar,
      isAdmin: updated.is_admin,
      status: updated.status,
      isDeleted: updated.is_deleted,
      createdAt: updated.created_at.toISOString(),
      updatedAt: updated.updated_at.toISOString(),
    },
    { status: 200 }
  )
}
