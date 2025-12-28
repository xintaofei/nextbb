import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

type BookmarksPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: BookmarksPageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} - 收藏夹`,
  }
}

export default async function BookmarksPage({ params }: BookmarksPageProps) {
  const { username } = await params

  // 权限验证：仅本人或管理员可访问
  const session = await getSessionUser()
  if (!session) {
    redirect("/login")
  }

  const currentUser = await prisma.users.findUnique({
    where: { id: session.userId },
    select: { name: true, is_admin: true },
  })

  const isOwner = currentUser?.name === username
  const isAdmin = currentUser?.is_admin || false

  if (!isOwner && !isAdmin) {
    redirect(`/u/${username}`)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">收藏夹</h1>
      <div className="text-sm text-muted-foreground">
        用户 {username} 的收藏列表 - 待实现
      </div>
    </div>
  )
}
