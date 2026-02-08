import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getServerSessionUser } from "@/lib/server-auth"
import { prisma } from "@/lib/prisma"

type RouteParams = {
  params: Promise<{ id: string }>
}

const updateSchema = z.object({
  isActive: z.boolean().optional(),
  note: z.string().max(256).optional(),
  maxUses: z
    .number()
    .int()
    .min(1)
    .nullable()
    .optional(),
  expiresAt: z.iso
    .datetime()
    .nullable()
    .optional(),
})

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const session = await getServerSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  let codeId: bigint
  try {
    codeId = BigInt(id)
  } catch {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }

  const json = await request.json().catch(() => null)
  const result = updateSchema.safeParse(json)

  if (!result.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
  }

  const inviteCode = await prisma.user_invite_codes.findUnique({
    where: { id: codeId },
  })

  if (!inviteCode) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (inviteCode.user_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { isActive, note, maxUses, expiresAt } = result.data

  const updated = await prisma.user_invite_codes.update({
    where: { id: codeId },
    data: {
      ...(isActive !== undefined && { is_active: isActive }),
      ...(note !== undefined && { note }),
      ...(maxUses !== undefined && { max_uses: maxUses }),
      ...(expiresAt !== undefined && {
        expires_at: expiresAt ? new Date(expiresAt) : null,
      }),
    },
  })

  return NextResponse.json({
    id: updated.id.toString(),
    code: updated.code,
    note: updated.note,
    maxUses: updated.max_uses,
    usedCount: updated.used_count,
    isActive: updated.is_active,
    expiresAt: updated.expires_at?.toISOString() ?? null,
    createdAt: updated.created_at.toISOString(),
  })
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getServerSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  let codeId: bigint
  try {
    codeId = BigInt(id)
  } catch {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }

  const inviteCode = await prisma.user_invite_codes.findUnique({
    where: { id: codeId },
    include: { invitations: { take: 1 } },
  })

  if (!inviteCode) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  if (inviteCode.user_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  if (inviteCode.invitations.length > 0) {
    return NextResponse.json(
      { error: "HAS_INVITATIONS" },
      { status: 400 }
    )
  }

  await prisma.user_invite_codes.delete({
    where: { id: codeId },
  })

  return NextResponse.json({ success: true })
}
