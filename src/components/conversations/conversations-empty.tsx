"use client"

import { useTranslations } from "next-intl"
import { Inbox } from "lucide-react"

export function ConversationsEmpty() {
  const t = useTranslations("Conversations")

  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center">
      <div className="flex items-center justify-center size-14 rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-6" />
      </div>
      <h3 className="mt-4 text-lg font-semibold">{t("empty.select")}</h3>
      <p className="mt-2 text-sm text-muted-foreground">
        {t("empty.selectDescription")}
      </p>
    </div>
  )
}
