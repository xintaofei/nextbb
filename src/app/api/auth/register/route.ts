import { NextRequest, NextResponse } from "next/server"
import { createServerClient, type CookieOptions } from "@supabase/ssr"

export async function POST(req: NextRequest) {
  try {
    const { email, password, username, avatar } = await req.json()
    if (!email || !password || !username) {
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
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp(
      {
        email,
        password,
        options: { data: { username, avatar } },
      }
    )
    if (signUpError) {
      return NextResponse.json(
        { error: signUpError.message },
        { status: 400, headers: response.headers }
      )
    }

    const user = signUpData.user
    if (!user) {
      return NextResponse.json(
        { error: "注册失败" },
        { status: 400, headers: response.headers }
      )
    }

    const { data: profile, error: upsertError } = await supabase
      .from("profiles")
      .upsert(
        {
          id: user.id,
          email,
          username,
          avatar,
        },
        { onConflict: "id" }
      )
      .select()
      .single()

    if (upsertError) {
      // 不阻断注册，仅返回提示
      return NextResponse.json(
        { user, warning: `资料写入失败: ${upsertError.message}` },
        { status: 201, headers: response.headers }
      )
    }

    return NextResponse.json(
      { user, profile },
      { status: 201, headers: response.headers }
    )
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "未知错误"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
