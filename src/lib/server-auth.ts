import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth-options-cache"
import { headers } from "next/headers"

export type ServerSessionUser = {
  userId: bigint
  email: string
  isAdmin: boolean
}

export async function getServerSessionUser(): Promise<ServerSessionUser | null> {
  // 1. 尝试从请求头获取（由 middleware 注入）
  // 优化：优先使用 middleware 验证过的用户信息，避免重复计算
  try {
    const headersList = await headers()
    const userId = headersList.get("x-user-id")

    if (userId) {
      const email = headersList.get("x-user-email") || ""
      const isAdmin = headersList.get("x-user-is-admin") === "true"
      return {
        userId: BigInt(userId),
        email,
        isAdmin,
      }
    }
  } catch (error) {
    // 忽略 headers 获取失败（如在非请求上下文调用）
    console.warn("[ServerAuth] Failed to get headers:", error)
  }

  // 2. 回退到标准 session 获取方式
  const authOptions = await getAuthOptions()
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  return {
    userId: BigInt(session.user.id),
    email: session.user.email,
    isAdmin: session.user.isAdmin,
  }
}
