"use client"

import { useMemo, useState, useTransition } from "react"
import { ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useTranslations } from "next-intl"
import { useCategories } from "@/components/providers/taxonomy-provider"

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
  clearable = true,
}: Props) {
  const tc = useTranslations("Common")
  const categories = useCategories()
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  const selectedCategory = useMemo(
    () => categories.find((cat) => cat.id === value),
    [categories, value]
  )

  const placeholder = useMemo(() => tc("Filters.category"), [tc])
  const searchPlaceholder = useMemo(() => tc("Search.placeholder"), [tc])
  const noResultsText = useMemo(() => tc("Search.noResults"), [tc])

  const handleSelect = (categoryId: string) => {
    setOpen(false)
    startTransition(() => {
      onChange?.(categoryId)
    })
  }

  const handleClear = () => {
    startTransition(() => {
      onChange?.(undefined)
    })
  }

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          onClick={(e) => {
            // 如果点击的是清除按钮，阻止 popover 打开
            const target = e.target as HTMLElement
            if (target.closest("[data-clear-button]")) {
              e.preventDefault()
              return
            }
          }}
        >
          {selectedCategory ? (
            <span className="flex items-center gap-1.5">
              <span>{selectedCategory.icon}</span>
              <span>{selectedCategory.name}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <div className="flex items-center gap-1">
            {clearable && value && (
              <div
                data-clear-button
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleClear()
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault()
                    e.stopPropagation()
                    handleClear()
                  }
                }}
                className="h-4 w-4 shrink-0 opacity-50 hover:opacity-100 hover:text-destructive flex items-center justify-center cursor-pointer transition-all"
              >
                <X className="h-3.5 w-3.5" />
              </div>
            )}
            <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-xs p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{noResultsText}</CommandEmpty>
            <CommandGroup>
              {categories.map((category) => (
                <CommandItem
                  key={category.id}
                  value={`${category.name} ${category.description ?? ""}`}
                  onSelect={() => handleSelect(category.id)}
                  className={cn(
                    "cursor-pointer mb-1",
                    value === category.id &&
                      "bg-accent text-accent-foreground font-semibold"
                  )}
                >
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-2">
                      <span>{category.icon + " " + category.name}</span>
                      <span className="text-muted-foreground">
                        {`* ${category.topicCount}`}
                      </span>
                    </div>
                    {category.description && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {category.description}
                      </p>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
