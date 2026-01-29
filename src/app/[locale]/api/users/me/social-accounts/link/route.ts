import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getServerSessionUser } from "@/lib/server-auth"
import { SOCIAL_LINK_COOKIE } from "@/lib/auth-options"

export async function POST() {
  const session = await getServerSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const cookieStore = await cookies()
  cookieStore.set(SOCIAL_LINK_COOKIE, session.userId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 300,
    path: "/",
  })

  return NextResponse.json({ success: true })
}
