import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()
    if (!email || !password) {
      return NextResponse.json({ error: "缺少必要字段" }, { status: 400 })
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
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    const user = data.user
    if (!user) {
      return NextResponse.json({ error: "登录失败" }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single()

    return NextResponse.json(
      { user, profile },
      { status: 200, headers: response.headers }
    )
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "未知错误"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
