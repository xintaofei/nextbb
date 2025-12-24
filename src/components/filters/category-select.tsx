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

type CategoryOption = {
  id: string
  name: string
  icon?: string
}

type Props = {
  value?: string
  onChange?: (value: string | undefined) => void
  className?: string
  clearable?: boolean
}

export function CategorySelect({
  value,
  onChange,
  className,
  clearable,
}: Props) {
  const tc = useTranslations("Common")
  const [options, setOptions] = useState<CategoryOption[]>([])
  const [selected, setSelected] = useState<string | undefined>(value)
  const [isLoading, setIsLoading] = useState<boolean>(true)

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
          type CategoryApiItem = { id: string; name: string; icon?: string }
          setOptions(
            data.map((c: CategoryApiItem) => ({
              id: c.id,
              name: c.name,
              icon: c.icon,
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

  const placeholder = useMemo(() => tc("Filters.category"), [tc])
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
            {opt.icon ?? "📁"} {opt.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
