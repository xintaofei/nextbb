import crypto from "crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getServerSessionUser } from "@/lib/server-auth"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"

export async function GET() {
  const session = await getServerSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const codes = await prisma.user_invite_codes.findMany({
    where: { user_id: session.userId },
    include: {
      invitations: {
        include: {
          invitee: {
            select: { id: true, name: true, avatar: true },
          },
        },
        orderBy: { created_at: "desc" },
      },
    },
    orderBy: { created_at: "desc" },
  })

  return NextResponse.json({
    codes: codes.map((c) => ({
      id: c.id.toString(),
      code: c.code,
      note: c.note,
      maxUses: c.max_uses,
      usedCount: c.used_count,
      isActive: c.is_active,
      expiresAt: c.expires_at?.toISOString() ?? null,
      createdAt: c.created_at.toISOString(),
      invitations: c.invitations.map((inv) => ({
        id: inv.id.toString(),
        inviteeId: inv.invitee_id.toString(),
        inviteeName: inv.invitee.name,
        inviteeAvatar: inv.invitee.avatar,
        createdAt: inv.created_at.toISOString(),
      })),
    })),
  })
}

const createSchema = z.object({
  note: z.string().max(256).optional().default(""),
  maxUses: z.number().int().min(1).nullable().optional().default(null),
  expiresAt: z.iso.datetime().nullable().optional().default(null),
})

export async function POST(request: Request) {
  const session = await getServerSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const json = await request.json().catch(() => null)
  const result = createSchema.safeParse(json)

  if (!result.success) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
  }

  const { note, maxUses, expiresAt } = result.data
  const code = crypto.randomBytes(16).toString("hex")

  const inviteCode = await prisma.user_invite_codes.create({
    data: {
      id: generateId(),
      user_id: session.userId,
      code,
      note: note ?? "",
      max_uses: maxUses ?? null,
      is_active: true,
      expires_at: expiresAt ? new Date(expiresAt) : null,
    },
  })

  return NextResponse.json(
    {
      id: inviteCode.id.toString(),
      code: inviteCode.code,
      note: inviteCode.note,
      maxUses: inviteCode.max_uses,
      usedCount: inviteCode.used_count,
      isActive: inviteCode.is_active,
      expiresAt: inviteCode.expires_at?.toISOString() ?? null,
      createdAt: inviteCode.created_at.toISOString(),
      invitations: [],
    },
    { status: 201 }
  )
}
