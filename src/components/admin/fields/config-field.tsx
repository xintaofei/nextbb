"use client"

import { ReactNode } from "react"
import { Label } from "@/components/ui/label"

interface ConfigFieldProps {
  label: string
  description?: string
  children: ReactNode
  required?: boolean
}

export function ConfigField({
  label,
  description,
  children,
  required = false,
}: ConfigFieldProps) {
  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </Label>
      {children}
      {description && (
        <p className="text-sm text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
