"use client"

import { useMemo } from "react"
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
import useSWR from "swr"

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

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch categories")
  return res.json()
}

export function CategorySelect({
  value,
  onChange,
  className,
  clearable,
}: Props) {
  const tc = useTranslations("Common")
  const { data, isLoading } = useSWR<CategoryOption[]>(
    "/api/categories",
    fetcher
  )

  const options = useMemo(() => {
    if (!data) return []
    return data.map((c) => ({
      id: c.id,
      name: c.name,
      icon: c.icon,
    }))
  }, [data])

  const placeholder = useMemo(() => tc("Filters.category"), [tc])
  const allLabel = useMemo(() => tc("Filters.all"), [tc])

  return isLoading ? (
    <Skeleton className={cn("h-9", className)} />
  ) : (
    <Select
      value={value ?? ""}
      onValueChange={(v) => {
        const next = v === "__all__" ? undefined : v
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
