"use client"

import { memo } from "react"
import { useTranslations } from "next-intl"
import { NavMain } from "@/components/main/nav-main"
import { NavTop } from "@/components/main/nav-top"
import { NavUser } from "@/components/main/nav-user"
import { cn } from "@/lib/utils"
import { useConfig } from "@/components/providers/config-provider"
import { useNewTopic } from "@/components/providers/new-topic-provider"
import { NewTopicButton } from "@/components/new-topic"

interface SideNavContentProps {
  mode?: "desktop" | "mobile"
  onLinkClick?: () => void
}

export const SideNavContent = memo(function SideNavContent({
  mode = "desktop",
  onLinkClick,
}: SideNavContentProps) {
  const t = useTranslations("Index")
  const { configs } = useConfig()
  const { openDialog } = useNewTopic()
  const welcomeMessage = configs?.["basic.welcome_message"] as
    | string
    | undefined

  return (
    <div className="flex flex-col h-full w-full bg-background">
      {/* Header */}
      <div
        className={cn(
          "flex items-center py-4",
          mode === "desktop"
            ? "justify-center xl:justify-start px-2 xl:px-6"
            : "justify-start px-6"
        )}
      >
        <NavTop width={64} onLinkClick={onLinkClick} />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto py-2 pr-8 scrollbar-none">
        <NavMain
          className={cn(
            mode === "desktop"
              ? "[&_a]:justify-center [&_a]:xl:justify-start [&_span]:hidden [&_span]:xl:inline"
              : "[&_a]:justify-start [&_a]:px-4"
          )}
          onLinkClick={onLinkClick}
        />
        <NewTopicButton
          className="w-full py-6 mt-4 rounded-full justify-start"
          onClick={openDialog}
        />
      </div>

      {/* Footer */}
      <div className={cn("mt-auto", mode === "desktop" ? "p-2" : "p-4")}>
        {mode === "desktop" ? (
          <NavUser layout="sidebar" onLinkClick={onLinkClick} />
        ) : (
          <div className="text-sm text-muted-foreground px-2">
            {welcomeMessage || t("title")}
          </div>
        )}
      </div>
    </div>
  )
})
