import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { createAuthOptions } from "@/lib/auth-options"

export async function GET() {
  const authOptions = await createAuthOptions()
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    return NextResponse.json(null, { status: 401 })
  }

  return NextResponse.json({
    id: session.user.id,
    email: session.user.email,
    name: session.user.name,
    avatar: session.user.avatar,
    isAdmin: session.user.isAdmin,
    credits: session.user.credits,
  })
}
