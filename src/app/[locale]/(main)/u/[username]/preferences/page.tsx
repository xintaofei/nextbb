import { redirect } from "next/navigation"
import { decodeUsername, encodeUsername } from "@/lib/utils"

type PreferencesPageProps = {
  params: Promise<{ username: string }>
}

export default async function PreferencesPage({
  params,
}: PreferencesPageProps) {
  const { username } = await params
  const decodedUsername = decodeUsername(username)
  const encodedUsername = encodeUsername(decodedUsername)

  // 重定向到账户设置页面
  redirect(`/u/${encodedUsername}/preferences/account`)
}
