"use client"

import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface BackButtonProps {
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "link"
    | "destructive"
    | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  className?: string
}

export function BackButton({
  variant = "outline",
  size = "lg",
  className,
}: BackButtonProps) {
  const router = useRouter()
  const t = useTranslations("Common.Action")

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={() => router.back()}
    >
      <ArrowLeft className="mr-2 h-4 w-4" />
      {t("goBack")}
    </Button>
  )
}
