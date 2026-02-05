import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getServerSessionUser } from "@/lib/server-auth"
import { ConversationsSidebar } from "@/components/conversations/conversations-sidebar"

type ConversationsLayoutProps = {
  children: ReactNode
}

export default async function ConversationsLayout({
  children,
}: ConversationsLayoutProps) {
  const session = await getServerSessionUser()
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex w-full h-screen overflow-hidden max-lg:flex-col">
      <ConversationsSidebar />
      <div className="flex-1 min-w-0 min-h-0 border-l max-lg:border-l-0 max-lg:border-t">
        {children}
      </div>
    </div>
  )
}
