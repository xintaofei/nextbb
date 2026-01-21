"use client"

import { useState } from "react"
import { useTheme } from "next-themes"
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
  placeholder = "点击选择 emoji",
}: EmojiPickerFieldProps) {
  const { resolvedTheme } = useTheme()
  const [open, setOpen] = useState(false)

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
                  {placeholder}
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
              />
            </div>
          </PopoverContent>
        </Popover>
        {value && (
          <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
            清除
          </Button>
        )}
      </div>
    </div>
  )
}
