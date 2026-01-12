"use client"

import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LaptopIcon, MoonIcon, SunIcon } from "lucide-react"
import { cn } from "@/lib/utils"

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme = "system", setTheme } = useTheme()
  const t = useTranslations("Common.ThemeSwitcher")

  const Icon =
    theme === "dark" ? MoonIcon : theme === "light" ? SunIcon : LaptopIcon

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("gap-2 h-8", className)}
          aria-label={t("ariaLabel")}
        >
          <Icon className="size-4" />
          <span className="text-sm">
            {theme === "dark"
              ? t("dark")
              : theme === "light"
                ? t("light")
                : t("system")}
          </span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={theme}
          onValueChange={(value) => setTheme(value)}
        >
          <DropdownMenuRadioItem value="light">
            {t("light")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">
            {t("dark")}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">
            {t("system")}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
