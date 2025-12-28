import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decodeUsername, encodeUsername } from "@/lib/utils"

type LikesPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: LikesPageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} - 点赞记录`,
  }
}

export default async function LikesPage({ params }: LikesPageProps) {
  const { username } = await params
  const decodedUsername = decodeUsername(username)

  // 权限验证：仅本人或管理员可访问
  const session = await getSessionUser()
  if (!session) {
    redirect("/login")
  }

  const currentUser = await prisma.users.findUnique({
    where: { id: session.userId },
    select: { name: true, is_admin: true },
  })

  const isOwner = currentUser?.name === decodedUsername
  const isAdmin = currentUser?.is_admin || false

  if (!isOwner && !isAdmin) {
    redirect(`/u/${encodeUsername(decodedUsername)}`)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">点赞记录</h1>
      <div className="text-sm text-muted-foreground">
        用户 {username} 的点赞列表 - 待实现
      </div>
    </div>
  )
}
