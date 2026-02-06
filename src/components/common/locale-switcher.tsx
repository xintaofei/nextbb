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
): string {
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

const LOCALE_COOKIE_NAME = "NEXT_LOCALE"
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60 // 1 年（秒）

function getLocaleCookie(): string | undefined {
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE_NAME}=([^;]*)`)
  )
  return match?.[1] || undefined
}

function setLocaleCookie(locale: string): void {
  document.cookie = `${LOCALE_COOKIE_NAME}=${locale};path=/;max-age=${COOKIE_MAX_AGE};SameSite=Lax`
}

function removeLocaleCookie(): void {
  document.cookie = `${LOCALE_COOKIE_NAME}=;path=/;max-age=0;SameSite=Lax`
}

export function LocaleSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale() as (typeof SUPPORTED_LOCALES)[number]
  const t = useTranslations("Common.LocaleSwitcher")

  // 从 cookie 推导模式：有 NEXT_LOCALE cookie 就是手动选择，没有就是自动
  const [mode, setMode] = React.useState<Mode>(() => {
    if (typeof document === "undefined") return "auto"
    const cookie = getLocaleCookie()
    return cookie && (SUPPORTED_LOCALES as readonly string[]).includes(cookie)
      ? (cookie as Mode)
      : "auto"
  })

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
              // 自动模式：删除 cookie，让中间件根据浏览器语言决定
              removeLocaleCookie()
              const nav =
                typeof navigator !== "undefined" ? navigator.language : locale
              const target = String(nav).toLowerCase().startsWith("zh")
                ? "zh"
                : "en"
              const nextPath = replaceLocaleInPath(pathname, target)
              router.push(nextPath)
              return
            }
            // 手动选择语言：设置 NEXT_LOCALE cookie，中间件会优先读取
            setLocaleCookie(v)
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
