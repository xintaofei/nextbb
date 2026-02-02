"use client"

import React, { useState } from "react"
import Image from "next/image"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { Smile, Loader2, Search } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"
import type { Expression } from "@/types/expression"

interface ExpressionGroupWithItems {
  id: string
  code: string
  name: string
  iconId: string | null
  expressions: Expression[]
}

interface ExpressionPickerProps {
  onSelect: (expression: Expression) => void
  trigger?: React.ReactNode
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export const ExpressionPicker: React.FC<ExpressionPickerProps> = ({
  onSelect,
  trigger,
}) => {
  const t = useTranslations("Editor.Toolbar.ExpressionPicker")
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  const {
    data: groups,
    error,
    isLoading,
  } = useSWR<ExpressionGroupWithItems[]>(
    open ? `/api/expressions` : null,
    fetcher
  )

  const handleSelect = (expression: Expression) => {
    onSelect(expression)
    setOpen(false)
  }

  const filteredGroups = groups
    ?.map((group) => ({
      ...group,
      expressions: group.expressions.filter(
        (exp) =>
          exp.name.toLowerCase().includes(search.toLowerCase()) ||
          exp.code.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter((group) => group.expressions.length > 0)

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
      <PopoverContent className="w-80 p-0" align="start">
        <div className="flex flex-col h-[400px]">
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t("searchPlaceholder")}
                className="pl-8 h-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

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
          ) : (
            <Tabs
              defaultValue={filteredGroups[0]?.id}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <TabsList className="w-full justify-start h-10 bg-transparent border-b rounded-none px-2 overflow-x-auto no-scrollbar">
                {filteredGroups.map((group) => (
                  <TabsTrigger
                    key={group.id}
                    value={group.id}
                    className="h-8 px-3 text-xs data-[state=active]:bg-muted"
                  >
                    {group.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex-1 overflow-hidden">
                <TooltipProvider delayDuration={300}>
                  {filteredGroups.map((group) => (
                    <TabsContent
                      key={group.id}
                      value={group.id}
                      className="m-0 h-full overflow-hidden"
                    >
                      <ScrollArea className="h-full p-2">
                        <div className="grid grid-cols-6 gap-1">
                          {group.expressions.map((exp) => (
                            <Tooltip key={exp.id}>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleSelect(exp)}
                                >
                                  {exp.type === "IMAGE" && exp.imageUrl ? (
                                    <Image
                                      src={exp.imageUrl}
                                      alt={exp.name}
                                      width={exp.width || 32}
                                      height={exp.height || 32}
                                      className="max-w-full max-h-full object-contain"
                                    />
                                  ) : (
                                    <span className="text-xl leading-none">
                                      {exp.textContent}
                                    </span>
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom" className="text-xs">
                                {exp.name}
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </ScrollArea>
                    </TabsContent>
                  ))}
                </TooltipProvider>
              </div>
            </Tabs>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
