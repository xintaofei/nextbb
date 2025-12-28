import { Metadata } from "next"

type NotificationsPrefsPageProps = {
  params: Promise<{ username: string }>
}

export async function generateMetadata({
  params,
}: NotificationsPrefsPageProps): Promise<Metadata> {
  const { username } = await params
  return {
    title: `${username} - 通知偏好`,
  }
}

export default async function NotificationsPrefsPage({
  params,
}: NotificationsPrefsPageProps) {
  const { username } = await params

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">通知偏好</h1>
      <div className="text-sm text-muted-foreground">
        用户 {username} 的通知偏好 - 待实现
      </div>
    </div>
  )
}
