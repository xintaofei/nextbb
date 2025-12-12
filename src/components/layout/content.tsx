import type { ReactNode } from "react"

export function Content({ children }: { children: ReactNode }) {
  return <div className="flex-1 overflow-y-auto p-8 pt-0">{children}</div>
}
