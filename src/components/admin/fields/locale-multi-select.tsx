"use client"

import { useState, useMemo } from "react"
import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type LocaleMultiSelectProps = {
  value: string[] // 已选中的语言代码数组
  onChange: (value: string[]) => void
  allLocales: string[] // 所有可用的语言代码
  getLocaleName: (locale: string) => string // 获取语言显示名称的函数
  label?: string
  description?: string
  placeholder?: string
}

export function LocaleMultiSelect({
  value,
  onChange,
  allLocales,
  getLocaleName,
  label,
  description,
  placeholder = "选择语言",
}: LocaleMultiSelectProps) {
  const [open, setOpen] = useState(false)

  const isAllSelected = useMemo(() => {
    return value.length === allLocales.length
  }, [value, allLocales])

  const handleToggleLocale = (locale: string) => {
    if (value.includes(locale)) {
      onChange(value.filter((l) => l !== locale))
    } else {
      onChange([...value, locale])
    }
  }

  const handleSelectAll = () => {
    onChange([...allLocales])
  }

  const handleClearAll = () => {
    onChange([])
  }

  const displayText = useMemo(() => {
    if (value.length === 0) {
      return placeholder
    }
    if (isAllSelected) {
      return "全部语言"
    }
    return value.map((locale) => getLocaleName(locale)).join(", ")
  }, [value, isAllSelected, getLocaleName, placeholder])

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-start"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              {value.length > 0 && (
                <Badge variant="secondary" className="shrink-0">
                  {value.length}
                </Badge>
              )}
              <span className="truncate">{displayText}</span>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <span className="text-sm font-medium">选择语言</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSelectAll}
                disabled={isAllSelected}
                className="h-7 px-2 text-xs"
              >
                全选
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearAll}
                disabled={value.length === 0}
                className="h-7 px-2 text-xs"
              >
                清空
              </Button>
            </div>
          </div>
          <div className="max-h-64 overflow-y-auto p-1">
            {allLocales.map((locale) => {
              const isSelected = value.includes(locale)
              return (
                <button
                  key={locale}
                  type="button"
                  onClick={() => handleToggleLocale(locale)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    isSelected && "bg-accent"
                  )}
                >
                  <span>{getLocaleName(locale)}</span>
                  {isSelected && <Check className="h-4 w-4" />}
                </button>
              )
            })}
          </div>
        </PopoverContent>
      </Popover>
      {description && (
        <div className="text-sm text-muted-foreground">{description}</div>
      )}
    </div>
  )
}
