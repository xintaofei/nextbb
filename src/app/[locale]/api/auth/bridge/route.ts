import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth-options"
import { prisma } from "@/lib/prisma"
import { signAuthToken, setAuthCookie } from "@/lib/auth"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const locale = url.searchParams.get("locale") ?? "zh"
  const session = await getServerSession(authOptions)
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL(`/${locale}/login`, url.origin))
  }
  const email = session.user.email
  const user = await prisma.users.findUnique({
    where: { email },
    select: { id: true, email: true, is_admin: true },
  })
  if (!user) {
    return NextResponse.redirect(new URL(`/${locale}/login`, url.origin))
  }
  const token = await signAuthToken({
    sub: user.id.toString(),
    email: user.email,
    isAdmin: user.is_admin,
  })
  await setAuthCookie(token)
  return NextResponse.redirect(new URL(`/${locale}`, url.origin))
}
