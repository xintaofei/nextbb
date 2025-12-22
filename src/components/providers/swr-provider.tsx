"use client"

import { SWRConfig } from "swr"
import { ReactNode } from "react"

type Props = {
  children: ReactNode
}

export function SWRProvider({ children }: Props) {
  const fetcher = async <T,>(url: string): Promise<T> => {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) throw new Error(String(res.status))
    return (await res.json()) as T
  }
  return (
    <SWRConfig
      value={{
        fetcher,
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        dedupingInterval: 2000,
      }}
    >
      {children}
    </SWRConfig>
  )
}
