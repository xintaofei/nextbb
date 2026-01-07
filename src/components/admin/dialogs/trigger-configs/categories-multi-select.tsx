"use client"

import { useEffect, useMemo, useState } from "react"
import { ChevronsUpDown, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover"
import {
  Command,
  CommandInput,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"
import { Skeleton } from "@/components/ui/skeleton"

type CategoryOption = {
  id: string
  name: string
  icon?: string
}

type Props = {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function CategoriesMultiSelect({
  value,
  onChange,
  placeholder,
  className,
}: Props) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<CategoryOption[]>([])
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
          setOptions(
            data.map((c) => ({
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

  const selectedSet = useMemo(() => new Set(value), [value])

  const labelText = useMemo(() => {
    if (value.length === 0) return placeholder ?? ""
    const names = options
      .filter((o) => selectedSet.has(o.id))
      .map((o) => o.name)
    if (names.length === 0) return placeholder ?? ""
    const joined = names.join(", ")
    return joined.length > 30 ? `${joined.slice(0, 30)}…` : joined
  }, [options, selectedSet, value, placeholder])

  if (isLoading) {
    return <Skeleton className={cn("h-9 w-full", className)} />
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          <span className="truncate">{labelText}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput className="h-9" placeholder={placeholder} />
          <CommandList>
            <CommandEmpty>未找到分类</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const checked = selectedSet.has(opt.id)
                return (
                  <CommandItem
                    key={opt.id}
                    value={opt.name}
                    onSelect={() => {
                      const next = new Set(selectedSet)
                      if (next.has(opt.id)) {
                        next.delete(opt.id)
                      } else {
                        next.add(opt.id)
                      }
                      onChange(Array.from(next))
                    }}
                  >
                    {opt.icon && <span className="mr-2">{opt.icon}</span>}
                    {opt.name}
                    <Check
                      className={cn(
                        "ml-auto",
                        checked ? "opacity-100" : "opacity-0"
                      )}
                    />
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
