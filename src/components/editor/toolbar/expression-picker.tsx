"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { Smile, Loader2, Search } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { Expression, ExpressionGroupSize } from "@/types/expression"
import { getExpressionGroupSizePx } from "@/lib/expression-size"

interface ExpressionGroupWithItems {
  id: string
  code: string
  name: string
  iconId: string | null
  expressionSize: ExpressionGroupSize
  expressions: Expression[]
}

interface ExpressionPickerProps {
  onSelect: (expression: Expression, groupSize: ExpressionGroupSize) => void
  trigger?: React.ReactNode
}

const fetcher = (url: string): Promise<ExpressionGroupWithItems[]> =>
  fetch(url).then((res) => res.json())

export const ExpressionPicker: React.FC<ExpressionPickerProps> = ({
  onSelect,
  trigger,
}) => {
  const t = useTranslations("Editor.Toolbar.ExpressionPicker")
  const [open, setOpen] = useState<boolean>(false)
  const [search, setSearch] = useState<string>("")
  const [activeGroupId, setActiveGroupId] = useState<string>("")
  const [isSearching, setIsSearching] = useState<boolean>(false)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  const {
    data: groups,
    error,
    isLoading,
  } = useSWR<ExpressionGroupWithItems[]>(
    open ? `/api/expressions` : null,
    fetcher
  )

  const handleSelect = (
    expression: Expression,
    groupSize: ExpressionGroupSize
  ): void => {
    onSelect(expression, groupSize)
    setOpen(false)
  }

  const filteredGroups: ExpressionGroupWithItems[] | undefined = groups
    ?.map((group) => ({
      ...group,
      expressions: group.expressions.filter(
        (exp) =>
          exp.name.toLowerCase().includes(search.toLowerCase()) ||
          exp.code.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((group) => group.expressions.length > 0)

  useEffect(() => {
    if (isSearching) {
      searchInputRef.current?.focus()
    }
  }, [isSearching])

  const resolvedGroupId: string = useMemo<string>(() => {
    if (!filteredGroups || filteredGroups.length === 0) {
      return ""
    }
    if (filteredGroups.some((group) => group.id === activeGroupId)) {
      return activeGroupId
    }
    return filteredGroups[0].id
  }, [activeGroupId, filteredGroups])

  const activeGroup: ExpressionGroupWithItems | undefined =
    filteredGroups?.find((group) => group.id === resolvedGroupId)
  const activeGroupSizeValue: ExpressionGroupSize =
    activeGroup?.expressionSize ?? "SMALL"
  const activeGroupSize: number = activeGroup
    ? getExpressionGroupSizePx(activeGroupSizeValue)
    : 0
  const expressionCellMinWidth: number = activeGroupSize + 24
  const shouldShowExpressionName: boolean = activeGroupSizeValue !== "SMALL"

  const toggleValues: string[] = useMemo<string[]>(() => {
    const values: string[] = []
    if (isSearching) {
      values.push("search")
    }
    if (resolvedGroupId) {
      values.push(resolvedGroupId)
    }
    return values
  }, [isSearching, resolvedGroupId])

  const handleToggleChange = (values: string[]): void => {
    const searching = values.includes("search")
    if (!searching && isSearching) {
      setSearch("")
    }
    setIsSearching(searching)

    const groupValues = values.filter((value) => value !== "search")
    const nextGroupId = groupValues[groupValues.length - 1]
    if (nextGroupId) {
      setActiveGroupId(nextGroupId)
      return
    }
    if (filteredGroups && filteredGroups.length > 0) {
      setActiveGroupId(filteredGroups[0].id)
    }
  }

  const groupIconMap = useMemo<Map<string, Expression | null>>(() => {
    const map = new Map<string, Expression | null>()
    if (!groups) {
      return map
    }
    groups.forEach((group) => {
      const iconExpression = group.iconId
        ? group.expressions.find((exp) => exp.id === group.iconId)
        : null
      map.set(group.id, iconExpression || group.expressions[0] || null)
    })
    return map
  }, [groups])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger || (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title={t("title")}
          >
            <Smile className="h-4 w-4" />
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-md p-0" align="start">
        <div className="flex flex-col h-96">
          {isSearching ? (
            <div className="p-2 border-b">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder={t("searchPlaceholder")}
                  className="pl-8 h-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          ) : null}

          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex-1 flex items-center justify-center text-sm text-destructive">
                {t("error")}
              </div>
            ) : !filteredGroups || filteredGroups.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
                {t("noResults")}
              </div>
            ) : !activeGroup ? null : (
              <ScrollArea className="h-full p-2">
                <div
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${expressionCellMinWidth}px), 1fr))`,
                  }}
                >
                  {activeGroup.expressions.map((exp) => {
                    const previewUrl = exp.thumbnailUrl || exp.imageUrl
                    return (
                      <div
                        key={exp.id}
                        onClick={() => handleSelect(exp, activeGroupSizeValue)}
                        title={exp.name}
                        className="cursor-pointer flex flex-col hover:[&_div]:bg-accent"
                      >
                        <div className="flex items-center justify-center p-2 rounded-md">
                          {previewUrl ? (
                            <Image
                              src={previewUrl}
                              alt={exp.name}
                              width={activeGroupSize}
                              height={activeGroupSize}
                              className="max-w-full max-h-full object-contain"
                            />
                          ) : null}
                        </div>
                        {shouldShowExpressionName ? (
                          <span className="w-full truncate text-center text-xs text-muted-foreground">
                            {exp.name}
                          </span>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          {filteredGroups && filteredGroups.length > 0 ? (
            <div className="border-t p-2">
              <ToggleGroup
                type="multiple"
                value={toggleValues}
                onValueChange={handleToggleChange}
                spacing={2}
                size="sm"
                className="w-full justify-start gap-1 overflow-x-auto no-scrollbar"
              >
                <ToggleGroupItem
                  value="search"
                  className="h-8 w-8 p-0"
                  aria-label={t("searchPlaceholder")}
                  title={t("searchPlaceholder")}
                >
                  <Search className="h-4 w-4" />
                </ToggleGroupItem>

                {filteredGroups.map((group) => {
                  const iconExpression = groupIconMap.get(group.id)
                  const iconUrl =
                    iconExpression?.thumbnailUrl || iconExpression?.imageUrl
                  return (
                    <ToggleGroupItem
                      key={group.id}
                      value={group.id}
                      className="h-8 w-8 p-0"
                      aria-label={group.name}
                      title={group.name}
                    >
                      {iconUrl ? (
                        <Image
                          src={iconUrl}
                          alt={group.name}
                          width={20}
                          height={20}
                          className="h-5 w-5 object-contain"
                        />
                      ) : (
                        <Smile className="h-4 w-4" />
                      )}
                    </ToggleGroupItem>
                  )
                })}
              </ToggleGroup>
            </div>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}
