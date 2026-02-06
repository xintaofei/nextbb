"use client"

import { ReactNode } from "react"
import { useSelectedLayoutSegment } from "next/navigation"
import { cn } from "@/lib/utils"
import { ConversationsSidebar } from "./conversations-sidebar"

type ConversationsLayoutClientProps = {
  children: ReactNode
}

export function ConversationsLayoutClient({
  children,
}: ConversationsLayoutClientProps) {
  const segment = useSelectedLayoutSegment()
  const hasConversation = segment !== null

  return (
    <div className="flex w-full h-[calc(100dvh-3.5rem)] sm:h-screen overflow-hidden">
      <div
        className={cn(
          "shrink-0 h-full",
          "lg:block lg:w-80",
          hasConversation ? "max-lg:hidden" : "max-lg:w-full"
        )}
      >
        <ConversationsSidebar />
      </div>
      <div
        className={cn(
          "flex-1 min-w-0 h-full overflow-hidden lg:border-l",
          !hasConversation && "max-lg:hidden"
        )}
      >
        {children}
      </div>
    </div>
  )
}
