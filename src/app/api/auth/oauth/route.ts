import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

type Provider = "github" | "google"

export async function POST(req: NextRequest) {
  try {
    const { provider, redirectTo } = await req.json()
    if (!provider || !["github", "google"].includes(provider)) {
      return NextResponse.json({ error: "不支持的 provider" }, { status: 400 })
    }
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
    const origin =
      req.headers.get("origin") ??
      process.env.NEXT_PUBLIC_SITE_URL ??
      "http://localhost:3000"
    const url = redirectTo ?? origin
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: { redirectTo: url },
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    if (!data?.url) {
      return NextResponse.json({ error: "未返回重定向地址" }, { status: 500 })
    }
    return NextResponse.redirect(data.url, {
      status: 302,
      headers: response.headers,
    })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "未知错误"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
