import { Metadata } from "next"
import { decodeUsername } from "@/lib/utils"
import { Bell } from "lucide-react"

type NotificationsPrefsPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: NotificationsPrefsPageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  return {
    title: `${decodedUsername} - 通知偏好`,
  }
}

export default async function NotificationsPrefsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">通知偏好</h1>
        <p className="text-sm text-muted-foreground mt-1">
          配置邮件通知、站内通知等
        </p>
      </div>
      <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed rounded-lg">
        <Bell className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-lg font-medium">功能开发中</p>
        <p className="text-sm text-muted-foreground mt-2">
          通知偏好设置功能即将上线
        </p>
      </div>
    </div>
  )
}
