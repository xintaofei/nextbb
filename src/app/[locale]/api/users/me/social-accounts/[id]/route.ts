import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type RouteParams = {
  params: Promise<{ id: string }>
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const session = await getSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  let accountId: bigint
  try {
    accountId = BigInt(id)
  } catch {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 })
  }

  const account = await prisma.user_social_accounts.findUnique({
    where: { id: accountId },
  })

  if (!account) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 })
  }

  if (account.user_id !== session.userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const user = await prisma.users.findUnique({
    where: { id: session.userId },
    select: { password: true },
  })

  const accountCount = await prisma.user_social_accounts.count({
    where: { user_id: session.userId },
  })

  if (accountCount === 1 && user?.password === "oauth") {
    return NextResponse.json(
      { error: "Cannot unlink the only social account without password" },
      { status: 400 }
    )
  }

  await prisma.user_social_accounts.delete({
    where: { id: accountId },
  })

  return NextResponse.json({ success: true })
}
