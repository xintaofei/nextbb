import createMiddleware from "next-intl/middleware"
import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"
import { routing } from "./i18n/routing"

export default async function middleware(req: NextRequest) {
  const res = createMiddleware(routing)(req)
  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies
            .getAll()
            .map((c) => ({ name: c.name, value: c.value }))
        },
        setAll(cookies) {
          cookies.forEach(
            ({
              name,
              value,
              options,
            }: {
              name: string
              value: string
              options: CookieOptions
            }) => {
              res.cookies.set({ name, value, ...options })
            }
          )
        },
      },
    }
  )
  await supabase.auth.getSession()
  return res
}

export const config = {
  matcher: ["/((?!api|_next|.*\\..*).*)"],
}
