import { NextResponse } from "next/server"
import { getServerSessionUser } from "@/lib/server-auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await getServerSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const accounts = await prisma.user_social_accounts.findMany({
    where: { user_id: session.userId },
    select: {
      id: true,
      provider_key: true,
      provider_username: true,
      provider_email: true,
      provider_avatar: true,
      last_used_at: true,
      created_at: true,
    },
    orderBy: { created_at: "asc" },
  })

  return NextResponse.json({
    accounts: accounts.map((a) => ({
      id: a.id.toString(),
      providerKey: a.provider_key,
      providerUsername: a.provider_username,
      providerEmail: a.provider_email,
      providerAvatar: a.provider_avatar,
      lastUsedAt: a.last_used_at?.toISOString() ?? null,
      createdAt: a.created_at.toISOString(),
    })),
  })
}
