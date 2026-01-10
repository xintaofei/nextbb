import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { NextRequest, NextResponse } from "next/server"
import { verifyAuthToken, AUTH_COOKIE_NAME } from "@/lib/auth"

const intlMiddleware = createMiddleware(routing)

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is an admin API route
  // Matches /api/admin or /[locale]/api/admin
  if (pathname.includes("/api/admin")) {
    const token = request.cookies.get(AUTH_COOKIE_NAME)?.value

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const payload = await verifyAuthToken(token)

    if (!payload || !payload.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
}
