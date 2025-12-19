"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslations } from "next-intl"

type CategoryOption = {
  id: string
  name: string
  icon?: string
}

type Props = {
  value?: string
  onChange?: (value: string | undefined) => void
  className?: string
}

export function CategorySelect({ value, onChange, className }: Props) {
  const tc = useTranslations("Common")
  const [options, setOptions] = useState<CategoryOption[]>([])
  const [selected, setSelected] = useState<string | undefined>(value)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/categories", { cache: "no-store" })
        if (!res.ok) return
        const data: Array<{
          id: string
          name: string
          icon?: string
        }> = await res.json()
        if (!cancelled) {
          setOptions(
            data.map((c) => ({
              id: c.id,
              name: c.name,
              icon: c.icon,
            }))
          )
        }
      } catch {}
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setSelected(value)
  }, [value])

  const placeholder = useMemo(() => tc("Filters.category"), [tc])

  return (
    <Select
      value={selected ?? ""}
      onValueChange={(v) => {
        const next = v.length > 0 ? v : undefined
        setSelected(next)
        onChange?.(next)
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((opt) => (
          <SelectItem key={opt.id} value={opt.id}>
            {opt.icon ?? "📁"} {opt.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
