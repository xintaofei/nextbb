"use client"

import { useEffect, useMemo, useState } from "react"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"
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
  clearable?: boolean
}

export function TagSelect({ value, onChange, className, clearable }: Props) {
  const tc = useTranslations("Common")
  const [options, setOptions] = useState<TagOption[]>([])
  const [selected, setSelected] = useState<string | undefined>(value)
  const [isLoading, setIsLoading] = useState<boolean>(true)

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
          setIsLoading(false)
        }
      } catch {
        if (!cancelled) setIsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    setSelected(value)
  }, [value])

  const placeholder = useMemo(() => tc("Filters.tag"), [tc])
  const allLabel = useMemo(() => tc("Filters.all"), [tc])

  return isLoading ? (
    <Skeleton className={cn("h-9", className)} />
  ) : (
    <Select
      value={selected ?? ""}
      onValueChange={(v) => {
        const next = v === "__all__" ? undefined : v
        setSelected(next)
        onChange?.(next)
      }}
    >
      <SelectTrigger className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {clearable ? (
          <SelectItem key="__all__" value="__all__">
            {allLabel}
          </SelectItem>
        ) : null}
        {options.map((opt) => (
          <SelectItem key={opt.id} value={opt.id}>
            {opt.icon} {opt.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
