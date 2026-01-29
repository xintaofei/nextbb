import { getServerSession } from "next-auth"
import { getAuthOptions } from "@/lib/auth-options-cache"

export type ServerSessionUser = {
  userId: bigint
  email: string
  isAdmin: boolean
}

export async function getServerSessionUser(): Promise<ServerSessionUser | null> {
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
