"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"

interface TagsInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  maxTags?: number
  maxLength?: number
  placeholder?: string
  infoText?: string
}

export function TagsInput({
  value,
  onChange,
  maxTags = 5,
  maxLength = 15,
  placeholder = "输入标签后按回车添加",
  infoText,
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState("")

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  const addTag = () => {
    const trimmedValue = inputValue.trim()
    if (!trimmedValue) return
    if (value.length >= maxTags) return
    if (value.includes(trimmedValue)) return
    if (trimmedValue.length > maxLength) return

    onChange([...value, trimmedValue])
    setInputValue("")
  }

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value)
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((tag, index) => (
          <Badge key={index} variant="secondary" className="text-sm">
            {tag}
            <Button
              variant="ghost"
              size="sm"
              className="ml-1 h-auto p-0 text-muted-foreground hover:text-foreground"
              onClick={() => removeTag(tag)}
            >
              <X className="h-3 w-3" />
            </Button>
          </Badge>
        ))}
      </div>

      {value.length < maxTags && (
        <Input
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="mt-2"
          maxLength={maxLength}
        />
      )}

      <div className="text-xs text-muted-foreground">
        {infoText ??
          `${value.length}/${maxTags} 标签，每个标签最多 ${maxLength} 字符`}
      </div>
    </div>
  )
}
