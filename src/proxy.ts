import createMiddleware from "next-intl/middleware"
import { routing } from "./i18n/routing"
import type { NextRequest } from "next/server"

const handleRequest = createMiddleware(routing)

export default function proxy(request: NextRequest) {
  return handleRequest(request)
}

export const config = {
  matcher: ["/", "/(zh|en)/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"],
}
