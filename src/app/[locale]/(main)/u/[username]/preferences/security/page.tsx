import { Suspense } from "react"
import { Metadata } from "next"
import { decodeUsername } from "@/lib/utils"
import { prisma } from "@/lib/prisma"
import { SocialAccounts } from "@/components/user/social-accounts"
import { PasswordResetCard } from "@/components/user/password-reset-card"
import { getServerSessionUser } from "@/lib/server-auth"
import { getTranslations } from "next-intl/server"
import { Loader2 } from "lucide-react"

type SecurityPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: SecurityPageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  const t = await getTranslations("User.preferences.security")
  return {
    title: `${decodedUsername} - ${t("title")}`,
  }
}

export default async function SecurityPage() {
  const t = await getTranslations("User.preferences.security")

  const sessionUser = await getServerSessionUser()
  let hasPassword = false
  if (sessionUser) {
    const dbUser = await prisma.users.findUnique({
      where: { id: sessionUser.userId },
      select: { password: true },
    })
    hasPassword = !!dbUser?.password
  }

  const socialProviders = await prisma.social_providers.findMany({
    where: { is_enabled: true },
    orderBy: { sort: "asc" },
    select: {
      provider_key: true,
      name: true,
      icon: true,
    },
  })

  const providers = socialProviders.map((p) => ({
    providerKey: p.provider_key,
    name: p.name,
    icon: p.icon,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
      </div>
      <PasswordResetCard hasPassword={hasPassword} />
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <SocialAccounts providers={providers} />
      </Suspense>
    </div>
  )
}
