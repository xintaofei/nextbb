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

type TagOption = {
  id: string
  name: string
  icon: string
}

type Props = {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function TagsMultiSelect({
  value,
  onChange,
  placeholder,
  className,
}: Props) {
  const [open, setOpen] = useState(false)
  const [options, setOptions] = useState<TagOption[]>([])

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
          setOptions(
            data.map((t) => ({
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

  const selectedSet = useMemo(() => new Set(value), [value])

  const labelText = useMemo(() => {
    if (value.length === 0) return placeholder ?? ""
    const names = options
      .filter((o) => selectedSet.has(o.name))
      .map((o) => o.name)
    if (names.length === 0) return placeholder ?? ""
    const joined = names.join(", ")
    return joined.length > 24 ? `${joined.slice(0, 24)}…` : joined
  }, [options, selectedSet, value, placeholder])

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
            <CommandEmpty>No tags found.</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const checked = selectedSet.has(opt.name)
                return (
                  <CommandItem
                    key={opt.id}
                    value={opt.name}
                    onSelect={(currentValue) => {
                      const name = currentValue
                      const next = new Set(selectedSet)
                      if (next.has(name)) {
                        next.delete(name)
                      } else {
                        if (next.size < 5) {
                          next.add(name)
                        }
                      }
                      onChange(Array.from(next))
                    }}
                  >
                    {opt.icon} {opt.name}
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
