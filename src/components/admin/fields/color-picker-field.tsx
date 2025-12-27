"use client"

import { useState } from "react"
import { HexColorPicker } from "react-colorful"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

type ColorPickerFieldProps = {
  value?: string | null
  onChange: (color: string | null) => void
  label?: string
  placeholder?: string
}

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#f59e0b",
  "#eab308",
  "#84cc16",
  "#22c55e",
  "#10b981",
  "#14b8a6",
  "#06b6d4",
  "#0ea5e9",
  "#3b82f6",
  "#6366f1",
  "#8b5cf6",
  "#a855f7",
  "#d946ef",
  "#ec4899",
]

export function ColorPickerField({
  value,
  onChange,
  label,
  placeholder = "点击选择颜色",
}: ColorPickerFieldProps) {
  const [open, setOpen] = useState(false)
  const [tempColor, setTempColor] = useState(value || "#3b82f6")

  const handleColorChange = (color: string) => {
    setTempColor(color)
    onChange(color)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const color = e.target.value
    setTempColor(color)
    onChange(color)
  }

  const handlePresetClick = (color: string) => {
    setTempColor(color)
    onChange(color)
  }

  const handleClear = () => {
    onChange(null)
    setTempColor("#3b82f6")
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
              className="h-10 min-w-30 justify-start gap-2"
            >
              {value ? (
                <>
                  <div
                    className="h-4 w-4 rounded border"
                    style={{ backgroundColor: value }}
                  />
                  <span className="text-sm">{value}</span>
                </>
              ) : (
                <span className="text-sm text-muted-foreground">
                  {placeholder}
                </span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="start">
            <div className="space-y-3">
              <HexColorPicker color={tempColor} onChange={handleColorChange} />
              <Input
                type="text"
                value={tempColor}
                onChange={handleInputChange}
                placeholder="#000000"
              />
              <div className="space-y-2">
                <Label className="text-xs">预设颜色</Label>
                <div className="grid grid-cols-8 gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      className="h-6 w-6 rounded border hover:scale-110 transition-transform"
                      style={{ backgroundColor: color }}
                      onClick={() => handlePresetClick(color)}
                    />
                  ))}
                </div>
              </div>
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
