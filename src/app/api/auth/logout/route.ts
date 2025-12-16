import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export async function POST(req: NextRequest) {
  try {
    const response = new NextResponse(null, { status: 200 })
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
            cookies.forEach(({ name, value, options }) => {
              response.cookies.set({ name, value, ...options })
            })
          },
        },
      }
    )
    const { error } = await supabase.auth.signOut()
    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400, headers: response.headers }
      )
    }
    return NextResponse.json(
      { ok: true },
      { status: 200, headers: response.headers }
    )
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "未知错误"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
