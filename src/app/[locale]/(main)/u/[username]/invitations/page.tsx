import { Suspense } from "react"
import { Metadata } from "next"
import { redirect } from "next/navigation"
import { decodeUsername, encodeUsername } from "@/lib/utils"
import { getTranslations } from "next-intl/server"
import { Loader2 } from "lucide-react"
import { InviteCodes } from "@/components/user/invite-codes"
import { getServerSessionUser } from "@/lib/server-auth"
import { prisma } from "@/lib/prisma"

type InvitationsPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: InvitationsPageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  const t = await getTranslations("User.invitations")
  return {
    title: `${decodedUsername} - ${t("title")}`,
  }
}

export default async function InvitationsPage({
  params,
}: InvitationsPageProps) {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  const t = await getTranslations("User.invitations")

  // 权限验证：仅本人可访问
  const session = await getServerSessionUser()
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

  return (
    <div className="max-w-5xl mx-auto w-full py-6">
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
    </div>
  )
}
