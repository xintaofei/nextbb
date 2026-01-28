"use client"

import { useMemo } from "react"
import { Edit, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
  type MeResponse = {
    id: string
    email: string
    name: string
    avatar: string
    isAdmin: boolean
    credits: number
  } | null
  const fetcher = async (url: string): Promise<MeResponse> => {
    const res = await fetch(url, { cache: "no-store" })
    if (!res.ok) return null
    return (await res.json()) as MeResponse
  }
  const { data, isLoading } = useSWR<MeResponse>("/api/auth/me", fetcher)
  const label = useMemo(() => (data ? t("button") : t("goLogin")), [data, t])
  const Icon = useMemo(() => (data ? Edit : LogIn), [data])
  const handleClick = () => {
    if (!data) {
      router.push(`/${locale}/login`)
      return
    }
    onClick()
  }
  if (isLoading) {
    return <Skeleton className={`h-8 w-full rounded-full ${className || ""}`} />
  }
  return (
    <Button size="lg" onClick={handleClick} className={`${className}`}>
      <Icon className="mr-0 xl:mr-2 size-6" />
      <span className="text-xl">{label}</span>
    </Button>
  )
}
