"use client"

import { useSession } from "next-auth/react"
import type { CurrentUser } from "@/types/user"

export function useCurrentUser() {
  const { data: session, status } = useSession()

  return {
    user: session?.user as CurrentUser | undefined,
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  }
}
