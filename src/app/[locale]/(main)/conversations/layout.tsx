import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getServerSessionUser } from "@/lib/server-auth"
import { ConversationsLayoutClient } from "@/components/conversations/conversations-layout-client"

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

  return <ConversationsLayoutClient>{children}</ConversationsLayoutClient>
}
