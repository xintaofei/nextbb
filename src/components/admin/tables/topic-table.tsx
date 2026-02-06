"use client"

import { useTranslations } from "next-intl"
import Image from "next/image"
import {
  Edit,
  Trash2,
  RefreshCcw,
  Pin,
  PinOff,
  Star,
  StarOff,
  Eye,
  MessageSquare,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  EllipsisVertical,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { CategoryBadge } from "@/components/common/category-badge"
import { TagBadge } from "@/components/common/tag-badge"
import { RelativeTime } from "@/components/common/relative-time"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export interface TopicTableItem {
  id: string
  title: string
  author: {
    id: string
    name: string
    avatar: string
  }
  category: {
    id: string
    name: string
    icon: string
    bgColor: string | null
    textColor: string | null
    darkBgColor: string | null
    darkTextColor: string | null
  }
  tags: Array<{
    id: string
    name: string
    icon: string
    bgColor: string | null
    textColor: string | null
    darkBgColor: string | null
    darkTextColor: string | null
  }>
  replies: number
  views: number
  isPinned: boolean
  isCommunity: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  lastActivityAt: string
}

export interface TopicTableProps {
  topics: TopicTableItem[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onRestore: (id: string) => void
  onTogglePin: (id: string, pinned: boolean) => void
  onToggleCommunity: (id: string, community: boolean) => void
  visibleColumns?: {
    select?: boolean
    author?: boolean
    category?: boolean
    tags?: boolean
    stats?: boolean
    status?: boolean
    time?: boolean
  }
  sortBy?: string
  order?: "asc" | "desc"
  onSort?: (column: string) => void
}

export function TopicTable({
  topics,
  selectedIds,
  onSelectionChange,
  onEdit,
  onDelete,
  onRestore,
  onTogglePin,
  onToggleCommunity,
  visibleColumns = {
    select: true,
    author: true,
    category: true,
    tags: true,
    stats: true,
    status: true,
    time: true,
  },
  sortBy,
  order,
  onSort,
}: TopicTableProps) {
  const t = useTranslations("AdminTopics.table")

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(topics.map((t) => t.id))
    } else {
      onSelectionChange([])
    }
  }

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id])
    } else {
      onSelectionChange(selectedIds.filter((sid) => sid !== id))
    }
  }

  const isAllSelected =
    topics.length > 0 && selectedIds.length === topics.length
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected

  const renderSortIcon = (column: string) => {
    if (!onSort) return null
    if (sortBy !== column) {
      return <ChevronsUpDown className="h-4 w-4 ml-1 text-foreground/40" />
    }
    return order === "asc" ? (
      <ChevronUp className="h-4 w-4 ml-1 text-primary" />
    ) : (
      <ChevronDown className="h-4 w-4 ml-1 text-primary" />
    )
  }

  const handleHeaderClick = (column: string) => {
    if (onSort) {
      onSort(column)
    }
  }

  return (
    <div className="rounded-2xl border border-border/40 bg-background/60 backdrop-blur overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/40">
              {visibleColumns.select && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={isAllSelected}
                    onCheckedChange={handleSelectAll}
                    aria-label={t("selectAll")}
                    className={
                      isSomeSelected ? "data-[state=checked]:bg-primary/50" : ""
                    }
                  />
                </TableHead>
              )}
              <TableHead
                className="cursor-pointer select-none"
                onClick={() => handleHeaderClick("title")}
              >
                <div className="flex items-center">
                  {t("title")}
                  {renderSortIcon("title")}
                </div>
              </TableHead>
              {visibleColumns.author && (
                <TableHead className="min-w-24">{t("author")}</TableHead>
              )}
              {visibleColumns.category && (
                <TableHead className="min-w-24">{t("category")}</TableHead>
              )}
              {visibleColumns.tags && (
                <TableHead className="w-36">{t("tags")}</TableHead>
              )}
              {visibleColumns.stats && (
                <TableHead
                  className="text-center cursor-pointer select-none min-w-28"
                  onClick={() => handleHeaderClick("replies")}
                >
                  <div className="flex items-center justify-center">
                    {t("stats")}
                    {renderSortIcon("replies")}
                  </div>
                </TableHead>
              )}
              {visibleColumns.status && (
                <TableHead className="w-36">{t("status")}</TableHead>
              )}
              {visibleColumns.time && (
                <TableHead
                  className="w-16 cursor-pointer select-none"
                  onClick={() => handleHeaderClick("created_at")}
                >
                  <div className="flex items-center">
                    {t("time")}
                    {renderSortIcon("created_at")}
                  </div>
                </TableHead>
              )}
              <TableHead className="text-center min-w-16">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {topics.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={
                    Object.values(visibleColumns).filter(Boolean).length + 2
                  }
                  className="text-center py-12 text-foreground/60"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              topics.map((topic) => (
                <TableRow
                  key={topic.id}
                  className="group hover:bg-foreground/5 transition-colors border-border/40"
                >
                  {visibleColumns.select && (
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(topic.id)}
                        onCheckedChange={(checked) =>
                          handleSelectOne(topic.id, checked as boolean)
                        }
                        aria-label={t("selectRow")}
                      />
                    </TableCell>
                  )}
                  <TableCell className="max-w-50">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-start gap-2">
                            <div
                              className="flex-1 min-w-0 font-medium text-foreground hover:text-primary cursor-pointer line-clamp-2 break-all"
                              onClick={() =>
                                window.open(`/topic/${topic.id}`, "_blank")
                              }
                            >
                              {topic.title}
                            </div>
                            <ExternalLink className="h-4 w-4 text-foreground/40 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent
                          side="top"
                          className="max-w-md wrap-break-word"
                        >
                          {topic.title}
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  {visibleColumns.author && (
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6 rounded-full border border-border/40">
                          <Image
                            src={topic.author.avatar}
                            alt={topic.author.name}
                            width={24}
                            height={24}
                            className="h-full w-full object-cover rounded-full"
                          />
                        </Avatar>
                        <span className="text-sm text-foreground/80 truncate">
                          {topic.author.name}
                        </span>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.category && (
                    <TableCell>
                      <CategoryBadge
                        icon={topic.category.icon}
                        name={topic.category.name}
                        bgColor={topic.category.bgColor}
                        textColor={topic.category.textColor}
                        darkBgColor={topic.category.darkBgColor}
                        darkTextColor={topic.category.darkTextColor}
                      />
                    </TableCell>
                  )}
                  {visibleColumns.tags && (
                    <TableCell>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {topic.tags.length === 0 ? (
                          <span className="text-sm text-foreground/40">-</span>
                        ) : (
                          topic.tags.map((tag) => (
                            <TagBadge
                              key={tag.id}
                              icon={tag.icon}
                              name={tag.name}
                              bgColor={tag.bgColor}
                              textColor={tag.textColor}
                              darkBgColor={tag.darkBgColor}
                              darkTextColor={tag.darkTextColor}
                            />
                          ))
                        )}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.stats && (
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-3 text-sm text-foreground/70">
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3.5 w-3.5" />
                          <span className="font-medium">{topic.replies}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" />
                          <span className="font-medium">{topic.views}</span>
                        </div>
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.status && (
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {topic.isPinned && (
                          <Badge
                            variant="secondary"
                            className="bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/40 text-xs w-fit"
                          >
                            <Pin className="h-3 w-3 mr-1" />
                            {t("pinned")}
                          </Badge>
                        )}
                        {topic.isCommunity && (
                          <Badge
                            variant="secondary"
                            className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40 text-xs w-fit"
                          >
                            <Star className="h-3 w-3 mr-1" />
                            {t("community")}
                          </Badge>
                        )}
                        {topic.isDeleted && (
                          <Badge
                            variant="destructive"
                            className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40 text-xs w-fit"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            {t("deleted")}
                          </Badge>
                        )}
                        {!topic.isPinned &&
                          !topic.isCommunity &&
                          !topic.isDeleted && (
                            <Badge
                              variant="outline"
                              className="text-xs w-fit text-foreground/60 border-border/60"
                            >
                              {t("normal")}
                            </Badge>
                          )}
                      </div>
                    </TableCell>
                  )}
                  {visibleColumns.time && (
                    <TableCell>
                      <div className="flex flex-col gap-1 text-sm text-foreground/60">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-foreground/40">
                            {t("created")}:
                          </span>
                          <span>
                            <RelativeTime date={topic.createdAt} />
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-foreground/40">
                            {t("active")}:
                          </span>
                          <span>
                            <RelativeTime date={topic.lastActivityAt} />
                          </span>
                        </div>
                      </div>
                    </TableCell>
                  )}
                  <TableCell className="text-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem onClick={() => onEdit(topic.id)}>
                          <Edit className="mr-2 h-4 w-4" />
                          {t("edit")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onTogglePin(topic.id, !topic.isPinned)}
                        >
                          {topic.isPinned ? (
                            <>
                              <PinOff className="mr-2 h-4 w-4" />
                              {t("unpin")}
                            </>
                          ) : (
                            <>
                              <Pin className="mr-2 h-4 w-4" />
                              {t("pin")}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            onToggleCommunity(topic.id, !topic.isCommunity)
                          }
                        >
                          {topic.isCommunity ? (
                            <>
                              <StarOff className="mr-2 h-4 w-4" />
                              {t("unrecommend")}
                            </>
                          ) : (
                            <>
                              <Star className="mr-2 h-4 w-4" />
                              {t("recommend")}
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {topic.isDeleted ? (
                          <DropdownMenuItem onClick={() => onRestore(topic.id)}>
                            <RefreshCcw className="mr-2 h-4 w-4" />
                            {t("restore")}
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => onDelete(topic.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t("delete")}
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
