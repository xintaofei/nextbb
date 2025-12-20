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

type TagOption = {
  id: string
  name: string
  icon: string
}

type Props = {
  value?: string
  onChange?: (value: string | undefined) => void
  className?: string
}

export function TagSelect({ value, onChange, className }: Props) {
  const tc = useTranslations("Common")
  const [options, setOptions] = useState<TagOption[]>([])
  const [selected, setSelected] = useState<string | undefined>(value)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch("/api/tags", { cache: "no-store" })
        if (!res.ok) return
        const data: Array<{
          id: string
          name: string
          icon: string
        }> = await res.json()
        if (!cancelled) {
          type TagApiItem = { id: string; name: string; icon: string }
          setOptions(
            data.map((t: TagApiItem) => ({
              id: t.id,
              name: t.name,
              icon: t.icon,
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

  const placeholder = useMemo(() => tc("Filters.tag"), [tc])

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
            {opt.icon} {opt.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
