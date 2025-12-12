import type { ReactNode } from "react"

export function Main({ children }: { children: ReactNode }) {
  return <div className="flex flex-col h-screen">{children}</div>
}
