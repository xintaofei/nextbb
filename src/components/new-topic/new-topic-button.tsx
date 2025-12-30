"use client"

import { useMemo } from "react"
import { Edit, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import useSWR from "swr"

interface NewTopicButtonProps {
  onClick: () => void
  className?: string
}

export function NewTopicButton({ onClick, className }: NewTopicButtonProps) {
  const t = useTranslations("Topic.New")
  const locale = useLocale()
  const router = useRouter()
  type MeProfile = {
    id: string
    email: string
    username: string
    avatar?: string | null
  }
  type MeUser = {
    id: string
    email?: string | null
    credits: number
  }
  type MeResponse = {
    user: MeUser
    profile?: MeProfile | null
  } | null
  const fetcher = async (url: string): Promise<MeResponse> => {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    return (await res.json()) as MeResponse
  }
  const { data } = useSWR<MeResponse>("/api/auth/me", fetcher)
  const label = useMemo(() => (data ? t("button") : t("goLogin")), [data, t])
  const Icon = useMemo(() => (data ? Edit : LogIn), [data])
  const handleClick = () => {
    if (!data) {
      router.push(`/${locale}/login`)
      return
    }
    onClick()
  }
  return (
    <>
      <Button
        variant="secondary"
        onClick={handleClick}
        className={`${className} max-sm:hidden`}
      >
        <Icon className="mr-2" />
        {label}
      </Button>
      <Button
        variant="secondary"
        size="icon"
        onClick={handleClick}
        className={`${className} hidden max-sm:inline-flex`}
      >
        <Icon />
      </Button>
    </>
  )
}
