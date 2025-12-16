"use client"

import { Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTranslations } from "next-intl"

interface NewTopicButtonProps {
  onClick: () => void
  className?: string
}

export function NewTopicButton({ onClick, className }: NewTopicButtonProps) {
  const t = useTranslations("Topic.New")
  return (
    <Button variant="secondary" onClick={onClick} className={className}>
      <Edit className="mr-2 h-4 w-4" />
      {t("button")}
    </Button>
  )
}
