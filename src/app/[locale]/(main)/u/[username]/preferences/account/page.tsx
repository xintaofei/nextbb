import { Suspense } from "react"
import { Metadata } from "next"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decodeUsername } from "@/lib/utils"
import { AccountForm } from "@/components/user/account-form"
import { SocialAccounts } from "@/components/user/social-accounts"
import { getTranslations } from "next-intl/server"
import { getTranslationsQuery, getTranslationFields } from "@/lib/locale"
import { getLocale } from "next-intl/server"
import { BadgeTranslation } from "@/lib/locale"
import { Loader2 } from "lucide-react"

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

  const locale = await getLocale()

  const user = await prisma.users.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatar: true,
      title_badge_id: true,
      custom_status: {
        select: {
          emoji: true,
          status_text: true,
          expires_at: true,
        },
      },
      user_badges: {
        where: { is_deleted: false },
        select: {
          badge: {
            select: {
              id: true,
              icon: true,
              translations: getTranslationsQuery(locale, {
                name: true,
              }),
            },
          },
        },
      },
    },
  })

  // 处理徽章翻译，在服务端完成多语言处理
  const processedUser = user && {
    ...user,
    // 过滤过期的自定义状态
    custom_status:
      user.custom_status &&
      (!user.custom_status.expires_at ||
        new Date(user.custom_status.expires_at) > new Date())
        ? user.custom_status
        : null,
    user_badges: user.user_badges.map((ub) => ({
      ...ub,
      badge: {
        ...ub.badge,
        name: getTranslationFields(
          ub.badge.translations as unknown as BadgeTranslation[],
          locale,
          { name: "" }
        ).name,
      },
    })),
  }

  if (!processedUser) {
    return null
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
      <AccountForm user={processedUser} />
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
