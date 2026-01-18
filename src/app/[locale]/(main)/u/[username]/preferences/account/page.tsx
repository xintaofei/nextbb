import { Metadata } from "next"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decodeUsername } from "@/lib/utils"
import { AccountForm } from "@/components/user/account-form"
import { getTranslations } from "next-intl/server"

type AccountPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: AccountPageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  const t = await getTranslations("User.preferences.account")
  return {
    title: `${decodedUsername} - ${t("title")}`,
  }
}

export default async function AccountPage() {
  const t = await getTranslations("User.preferences.account")

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
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
      </div>
      <AccountForm user={user} />
    </div>
  )
}
