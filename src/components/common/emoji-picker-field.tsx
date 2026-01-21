"use client"

import { useState, useMemo } from "react"
import { useTheme } from "next-themes"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import data from "@emoji-mart/data"
import Picker from "@emoji-mart/react"

type EmojiPickerFieldProps = {
  value?: string
  onChange: (emoji: string | undefined) => void
  label?: string
  placeholder?: string
}

export function EmojiPickerField({
  value,
  onChange,
  label,
  placeholder,
}: EmojiPickerFieldProps) {
  const { resolvedTheme } = useTheme()
  const [open, setOpen] = useState(false)
  const t = useTranslations("EmojiPicker")
  const tEmojiMart = useTranslations("EmojiMart")

  const i18n = useMemo(
    () => ({
      search: tEmojiMart("search"),
      search_no_results_1: tEmojiMart("search_no_results_1"),
      search_no_results_2: tEmojiMart("search_no_results_2"),
      pick: tEmojiMart("pick"),
      add_custom: tEmojiMart("add_custom"),
      categories: {
        activity: tEmojiMart("categories.activity"),
        custom: tEmojiMart("categories.custom"),
        flags: tEmojiMart("categories.flags"),
        foods: tEmojiMart("categories.foods"),
        frequency: tEmojiMart("categories.frequency"),
        nature: tEmojiMart("categories.nature"),
        objects: tEmojiMart("categories.objects"),
        people: tEmojiMart("categories.people"),
        places: tEmojiMart("categories.places"),
        search: tEmojiMart("categories.search"),
        symbols: tEmojiMart("categories.symbols"),
      },
      skins: {
        choose: tEmojiMart("skins.choose"),
        1: tEmojiMart("skins.1"),
        2: tEmojiMart("skins.2"),
        3: tEmojiMart("skins.3"),
        4: tEmojiMart("skins.4"),
        5: tEmojiMart("skins.5"),
        6: tEmojiMart("skins.6"),
      },
    }),
    [tEmojiMart]
  )

  const handleEmojiSelect = (emoji: { native: string }) => {
    onChange(emoji.native)
    setOpen(false)
  }

  const handleClear = () => {
    onChange(undefined)
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <div className="flex items-center gap-2">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="h-10 min-w-30 justify-start"
            >
              {value ? (
                <span className="text-2xl">{value}</span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {placeholder || t("placeholder")}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 border-none shadow-none"
            align="start"
          >
            <div
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme={resolvedTheme}
                previewPosition="none"
                skinTonePosition="none"
                i18n={i18n}
              />
            </div>
          </PopoverContent>
        </Popover>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            {t("clear")}
          </Button>
        )}
      </div>
    </div>
  )
}
