"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LanguagesIcon } from "lucide-react"
import { usePathname, useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import * as React from "react"

const SUPPORTED_LOCALES = ["zh", "en"] as const
type Mode = "auto" | (typeof SUPPORTED_LOCALES)[number]

function replaceLocaleInPath(
  pathname: string,
  target: (typeof SUPPORTED_LOCALES)[number]
) {
  if (!pathname || pathname === "/") return `/${target}`
  const parts = pathname.split("/").filter(Boolean)
  if (parts.length === 0) return `/${target}`
  const first = parts[0]
  if ((SUPPORTED_LOCALES as readonly string[]).includes(first)) {
    parts[0] = target
    return `/${parts.join("/")}`
  }
  return `/${target}/${parts.join("/")}`
}

export function LocaleSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale() as (typeof SUPPORTED_LOCALES)[number]
  const [mode, setMode] = React.useState<Mode>("auto")
  const t = useTranslations("Common.LocaleSwitcher")

  const label = mode === "auto" ? t("auto") : mode === "zh" ? t("zh") : t("en")

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 h-8"
          aria-label={t("ariaLabel")}
        >
          <LanguagesIcon className="size-4" />
          <span className="text-sm">{label}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={mode}
          onValueChange={(value) => {
            const v = value as Mode
            setMode(v)
            if (v === "auto") {
              const nav =
                typeof navigator !== "undefined" ? navigator.language : locale
              const target = String(nav).toLowerCase().startsWith("zh")
                ? "zh"
                : "en"
              const nextPath = replaceLocaleInPath(pathname, target)
              router.push(nextPath)
              return
            }
            const nextPath = replaceLocaleInPath(pathname, v)
            router.push(nextPath)
          }}
        >
          <DropdownMenuRadioItem value="auto">
            {t("auto")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="zh">{t("zh")}</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en">{t("en")}</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
