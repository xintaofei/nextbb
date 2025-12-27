"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"

interface SensitiveInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
}

export function SensitiveInput({
  value,
  onChange,
  placeholder,
  id,
}: SensitiveInputProps) {
  const [showValue, setShowValue] = useState(false)

  return (
    <div className="relative">
      <Input
        id={id}
        type={showValue ? "text" : "password"}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
        onClick={() => setShowValue(!showValue)}
      >
        {showValue ? (
          <EyeOff className="h-4 w-4 text-muted-foreground" />
        ) : (
          <Eye className="h-4 w-4 text-muted-foreground" />
        )}
      </Button>
    </div>
  )
}
