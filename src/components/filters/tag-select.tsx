"use client"

import { memo, useMemo, useState, useTransition } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
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
import { useTags } from "@/components/providers/taxonomy-provider"

type Props = {
  value?: string
  onChange?: (value: string | undefined) => void
  className?: string
  clearable?: boolean
}

export const TagSelect = memo(function TagSelect({
  value,
  onChange,
  className,
  clearable = true,
}: Props) {
  const t = useTranslations("Common")
  const tags = useTags()
  const [open, setOpen] = useState(false)
  const [, startTransition] = useTransition()

  const selectedTag = useMemo(
    () => tags.find((tag) => tag.id === value),
    [tags, value]
  )

  const placeholder = useMemo(() => t("Filters.tag"), [t])
  const searchPlaceholder = useMemo(() => t("Search.placeholder"), [t])
  const noResultsText = useMemo(() => t("Search.noResults"), [t])

  const handleSelect = (tagId: string) => {
    setOpen(false)
    startTransition(() => {
      onChange?.(tagId === value ? undefined : tagId)
    })
  }

  const handleClear = () => {
    startTransition(() => {
      onChange?.(undefined)
    })
  }

  const labelText = selectedTag
    ? selectedTag.icon + " " + selectedTag.name
    : placeholder

  return (
    <Popover open={open} onOpenChange={setOpen} modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between", className)}
          onClick={(e) => {
            const target = e.target as HTMLElement
            if (target.closest("[data-clear-button]")) {
              e.preventDefault()
              return
            }
          }}
        >
          <span
            className={cn("truncate", !selectedTag && "text-muted-foreground")}
          >
            {labelText}
          </span>
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
      <PopoverContent className="w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{noResultsText}</CommandEmpty>
            <CommandGroup>
              {tags.map((tag) => {
                const isSelected = tag.id === value
                return (
                  <CommandItem
                    key={tag.id}
                    value={`${tag.name} ${tag.description ?? ""}`}
                    onSelect={() => handleSelect(tag.id)}
                    className={cn(
                      "cursor-pointer mb-1",
                      isSelected &&
                        "bg-accent text-accent-foreground font-semibold"
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span>{tag.icon + " " + tag.name}</span>
                      <span className="text-muted-foreground text-xs">
                        {`* ${tag.topicCount}`}
                      </span>
                    </div>
                    {isSelected && <Check className="h-4 w-4 ml-2 shrink-0" />}
                  </CommandItem>
                )
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
})
