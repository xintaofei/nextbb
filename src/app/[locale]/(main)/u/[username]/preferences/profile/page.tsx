import { Metadata } from "next"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decodeUsername } from "@/lib/utils"
import { ProfileForm } from "@/components/user/profile-form"
import { getTranslations } from "next-intl/server"

type ProfilePageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: ProfilePageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  const t = await getTranslations("User.preferences.profile")
  return {
    title: `${decodedUsername} - ${t("title")}`,
  }
}

export default async function ProfilePage() {
  const t = await getTranslations("User.preferences.profile")

  const session = await getSessionUser()
  if (!session) {
    return null
  }

  const user = await prisma.users.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
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
      <ProfileForm user={user} />
    </div>
  )
}
