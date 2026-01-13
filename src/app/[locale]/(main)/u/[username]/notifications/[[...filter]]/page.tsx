import { Metadata } from "next"
import { decodeUsername } from "@/lib/utils"
import { NotificationList } from "@/components/user/notification-list"

type NotificationsPageProps = {
  params: Promise<{ username: string; filter?: string[] }>
}

export async function generateMetadata({
  params,
}: NotificationsPageProps): Promise<Metadata> {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  return {
    title: `${decodedUsername} - 通知中心`,
  }
}

export default async function NotificationsPage({
  params,
}: NotificationsPageProps) {
  const { filter } = await params
  const activeFilter = filter?.[0] || "all"

  return (
    <div className="space-y-6">
      <NotificationList filter={activeFilter} />
    </div>
  )
}
