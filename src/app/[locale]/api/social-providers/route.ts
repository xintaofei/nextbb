import { NextResponse } from "next/server"
import { getPublicSocialProviders } from "@/lib/services/social-provider-service"

export async function GET() {
  try {
    const providers = await getPublicSocialProviders()
    return NextResponse.json({ providers })
  } catch (error) {
    console.error("[API] 获取社交登录提供商失败:", error)
    return NextResponse.json(
      { error: "获取社交登录提供商失败" },
      { status: 500 }
    )
  }
}
