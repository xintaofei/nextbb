import { Metadata } from "next"
import { redirect } from "next/navigation"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decodeUsername, encodeUsername } from "@/lib/utils"

type PreferencesPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: PreferencesPageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  return {
    title: `${decodedUsername} - 设置`,
  }
}

export default async function PreferencesPage({
  params,
}: PreferencesPageProps) {
  const { username } = await params
  const decodedUsername = decodeUsername(username)

  // 权限验证：仅本人可访问
  const session = await getSessionUser()
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
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">设置概览</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold">账户设置</h3>
          <p className="text-sm text-muted-foreground">
            管理基本信息、头像、用户名等
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold">安全设置</h3>
          <p className="text-sm text-muted-foreground">
            修改密码、管理第三方账号绑定
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold">界面设置</h3>
          <p className="text-sm text-muted-foreground">
            自定义主题、语言、时区等
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold">通知偏好</h3>
          <p className="text-sm text-muted-foreground">
            配置邮件通知、站内通知
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <h3 className="font-semibold">隐私设置</h3>
          <p className="text-sm text-muted-foreground">控制个人资料可见性</p>
        </div>
      </div>
    </div>
  )
}
