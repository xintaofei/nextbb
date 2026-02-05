import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getServerSessionUser } from "@/lib/server-auth"
import { ConversationsSidebar } from "@/components/conversations/conversations-sidebar"

type ConversationsLayoutProps = {
  children: ReactNode
  params: Promise<{ id?: string }>
}

export default async function ConversationsLayout({
  children,
  params,
}: ConversationsLayoutProps) {
  const session = await getServerSessionUser()
  if (!session) {
    redirect("/login")
  }

  const { id } = await params

  return (
    <div className="flex flex-1 w-full min-h-[calc(100vh-56px)] max-lg:flex-col">
      <ConversationsSidebar selectedId={id ?? null} />
      <div className="flex-1 min-w-0 border-l max-lg:border-l-0 max-lg:border-t">
        {children}
      </div>
    </div>
  )
}
