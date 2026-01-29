import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import { NextRequest, NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { logSecurityEvent } from "@/lib/security-logger"

const intlMiddleware = createMiddleware(routing)

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the path is an admin API route
  // Matches /api/admin or /[locale]/api/admin
  if (pathname.includes("/api/admin")) {
    try {
      const token = await getToken({
        req: request,
        secret: process.env.NEXTAUTH_SECRET,
      })

      if (!token) {
        logSecurityEvent({
          event: "UNAUTHORIZED_ACCESS",
          ip: request.headers.get("x-forwarded-for") || "unknown",
          details: `尝试访问管理员 API: ${pathname}`,
        })
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
      }

      if (!token.isAdmin) {
        logSecurityEvent({
          event: "ADMIN_ACCESS_DENIED",
          userId: token.id,
          email: token.email,
          ip: request.headers.get("x-forwarded-for") || "unknown",
          details: `非管理员尝试访问: ${pathname}`,
        })
        return NextResponse.json({ error: "Forbidden" }, { status: 403 })
      }
    } catch (error) {
      logSecurityEvent({
        event: "TOKEN_VERIFICATION_FAILED",
        ip: request.headers.get("x-forwarded-for") || "unknown",
        details: `Token 验证失败: ${error}`,
      })
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  return intlMiddleware(request)
}

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
}
