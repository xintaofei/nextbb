import { getServerSession } from "next-auth"
import { createAuthOptions } from "@/lib/auth-options"

export type ServerSessionUser = {
  userId: bigint
  email: string
  isAdmin: boolean
}

export async function getServerSessionUser(): Promise<ServerSessionUser | null> {
  const authOptions = await createAuthOptions()
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
