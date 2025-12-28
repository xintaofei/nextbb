import { ReactNode } from "react"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decodeUsername, encodeUsername } from "@/lib/utils"

type PreferencesLayoutProps = {
  children: ReactNode
  params: Promise<{ username: string }>
}

export default async function PreferencesLayout({
  children,
  params,
}: PreferencesLayoutProps) {
  const { username } = await params
  const decodedUsername = decodeUsername(username)

  // 权限验证：仅本人可访问偏好设置
  const session = await getSessionUser()
  if (!session) {
    redirect("/login")
  }

  const currentUser = await prisma.users.findUnique({
    where: { id: session.userId },
    select: { name: true },
  })

  if (currentUser?.name !== decodedUsername) {
    redirect(`/u/${encodeUsername(decodedUsername)}`)
  }

  return <>{children}</>
}
