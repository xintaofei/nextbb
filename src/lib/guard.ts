import { getServerSessionUser } from "@/lib/server-auth"

export type AdminActor = {
  userId: bigint
  email: string
}

export async function requireAdmin(): Promise<AdminActor | null> {
  const auth = await getServerSessionUser()
  if (!auth) return null
  // 中间件已校验权限，这里不再重复查库校验
  return { userId: auth.userId, email: auth.email }
}
