"use client"

import { useMemo } from "react"
import { Edit, LogIn } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useTranslations } from "next-intl"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useCurrentUser } from "@/hooks/use-current-user"

interface NewTopicButtonProps {
  onClick: () => void
  className?: string
}

export function NewTopicButton({ onClick, className }: NewTopicButtonProps) {
  const t = useTranslations("Topic.New")
  const locale = useLocale()
  const router = useRouter()
  const { user, isLoading } = useCurrentUser()

  const label = useMemo(() => (user ? t("button") : t("goLogin")), [user, t])
  const Icon = useMemo(() => (user ? Edit : LogIn), [user])

  const handleClick = () => {
    if (!user) {
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
