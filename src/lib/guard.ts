import { getSessionUser } from "@/lib/auth"

export type AdminActor = {
  userId: bigint
  email: string
}

export async function requireAdmin(): Promise<AdminActor | null> {
  const auth = await getSessionUser()
  if (!auth) return null
  // 中间件已校验权限，这里不再重复查库校验
  return { userId: auth.userId, email: auth.email }
}
