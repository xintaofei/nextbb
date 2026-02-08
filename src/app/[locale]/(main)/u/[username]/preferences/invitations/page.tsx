import { Suspense } from "react"
import { Metadata } from "next"
import { decodeUsername } from "@/lib/utils"
import { getTranslations } from "next-intl/server"
import { Loader2 } from "lucide-react"
import { InviteCodes } from "@/components/user/invite-codes"

type InvitationsPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: InvitationsPageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  const t = await getTranslations("User.preferences.invitations")
  return {
    title: `${decodedUsername} - ${t("title")}`,
  }
}

export default async function InvitationsPage() {
  const t = await getTranslations("User.preferences.invitations")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {t("description")}
        </p>
      </div>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        }
      >
        <InviteCodes />
      </Suspense>
    </div>
  )
}
