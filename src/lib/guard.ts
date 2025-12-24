import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"

export type AdminActor = {
  userId: bigint
  email: string
}

export async function requireAdmin(): Promise<AdminActor | null> {
  const auth = await getSessionUser()
  if (!auth) return null
  const user = await prisma.users.findUnique({
    where: { id: auth.userId },
    select: { is_admin: true, is_deleted: true, status: true, email: true },
  })
  if (!user || user.is_deleted || user.status !== 1 || !user.is_admin) {
    return null
  }
  return { userId: auth.userId, email: user.email }
}
