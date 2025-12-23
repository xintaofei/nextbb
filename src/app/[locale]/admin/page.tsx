import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { getTranslations } from "next-intl/server"

export default async function AdminPage() {
  const auth = await getSessionUser()
  if (!auth) {
    redirect(`/`)
  }
  const user = await prisma.users.findUnique({
    where: { id: auth.userId },
    select: { is_admin: true, is_deleted: true, status: true, name: true },
  })
  if (!user || user.is_deleted || user.status !== 1 || !user.is_admin) {
    redirect(`/`)
  }

  const t = await getTranslations("Admin")
  return (
    <div className="flex min-h-screen w-full flex-col px-8 gap-4">
      <div className="flex flex-row justify-between items-center py-8">
        <h1 className="text-5xl">{t("title")}</h1>
      </div>
      <div className="text-sm text-muted-foreground">
        {t("welcome", { name: user.name })}
      </div>
    </div>
  )
}
