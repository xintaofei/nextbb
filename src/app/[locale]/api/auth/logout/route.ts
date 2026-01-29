import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth-options-cache"

export async function POST() {
  const authOptions = await getAuthOptions()
  const session = await getServerSession(authOptions)

  // 可以在这里记录登出日志
  if (session?.user?.id) {
    // 记录登出事件（如果需要）
  }

  // 客户端需要调用 signOut()
  return NextResponse.json({ success: true }, { status: 200 })
}
