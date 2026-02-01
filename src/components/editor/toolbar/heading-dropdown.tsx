import React, { memo } from "react"
import { useTranslations } from "next-intl"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

interface HeadingDropdownProps {
  currentLevel: number | null
  onSelect: (level: number | null) => void
}

export const HeadingDropdown = memo(
  ({ currentLevel, onSelect }: HeadingDropdownProps) => {
    const t = useTranslations("Editor.Toolbar")

    const headingOptions = [
      { level: null, label: t("paragraph") },
      { level: 1, label: t("heading1") },
      { level: 2, label: t("heading2") },
      { level: 3, label: t("heading3") },
      { level: 4, label: t("heading4") },
    ]

    const currentLabel =
      headingOptions.find((opt) => opt.level === currentLevel)?.label ||
      t("paragraph")

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="secondary"
            size="sm"
            className="w-28 h-8 px-2 justify-between"
          >
            <span className="truncate text-xs">{currentLabel}</span>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          {headingOptions.map((option) => (
            <DropdownMenuItem
              key={option.level ?? "paragraph"}
              onClick={() => onSelect(option.level)}
              className={cn(
                "text-sm my-1",
                currentLevel === option.level && "bg-accent font-semibold"
              )}
            >
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }
)

HeadingDropdown.displayName = "HeadingDropdown"
