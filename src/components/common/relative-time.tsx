"use client"

import { useTranslations, useLocale } from "next-intl"
import { formatRelative, formatDateTime } from "@/lib/time"
import { cn } from "@/lib/utils"

interface RelativeTimeProps {
  date: string | Date
  className?: string
}

export function RelativeTime({ date, className }: RelativeTimeProps) {
  const t = useTranslations()
  const locale = useLocale()
  const isoString = typeof date === "string" ? date : date.toISOString()

  if (!isoString) return null

  const relativeTime = formatRelative(isoString, t)
  const fullTime = formatDateTime(isoString, locale)

  return (
    <span
      title={fullTime}
      className={cn(
        "cursor-help underline-offset-4 hover:underline decoration-dotted",
        className
      )}
    >
      {relativeTime}
    </span>
  )
}
