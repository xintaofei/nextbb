"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import type { Session } from "next-auth"

interface AuthProviderProps {
  children: ReactNode
  session: Session | null
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return <SessionProvider session={session}>{children}</SessionProvider>
}
