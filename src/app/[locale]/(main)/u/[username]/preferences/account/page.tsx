import { Metadata } from "next"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decodeUsername } from "@/lib/utils"
import { AccountForm } from "@/components/user/account-form"

type AccountPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: AccountPageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  return {
    title: `${decodedUsername} - 账户设置`,
  }
}

export default async function AccountPage({ params }: AccountPageProps) {
  const { username } = await params
  const decodedUsername = decodeUsername(username)

  // 获取当前用户信息
  const session = await getSessionUser()
  if (!session) {
    return null
  }

  const user = await prisma.users.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      bio: true,
      website: true,
      location: true,
      birthday: true,
    },
  })

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">账户设置</h1>
        <p className="text-sm text-muted-foreground mt-1">
          管理你的账户信息和个人资料
        </p>
      </div>
      <AccountForm user={user} />
    </div>
  )
}
