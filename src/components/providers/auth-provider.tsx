"use client"

import { SessionProvider } from "next-auth/react"
import { ReactNode } from "react"
import type { Session } from "next-auth"

interface AuthProviderProps {
  children: ReactNode
  session: Session | null
}

export function AuthProvider({ children, session }: AuthProviderProps) {
  return (
    <SessionProvider
      session={session}
      // 传递服务端初始 session 避免首次加载闪烁
      // 禁用自动轮询，使用按需更新
      refetchInterval={0}
      refetchOnWindowFocus={true}
    >
      {children}
    </SessionProvider>
  )
}
