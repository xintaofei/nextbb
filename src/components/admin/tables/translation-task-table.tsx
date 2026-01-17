"use client"

import { useCallback, memo } from "react"
import { useTranslations } from "next-intl"
import {
  RotateCcw,
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  EllipsisVertical,
  Ban,
} from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { RelativeTime } from "@/components/common/relative-time"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { TranslationTaskStatus, TranslationTaskPriority } from "@prisma/client"

export interface TranslationTaskItem {
  id: string
  entityType: string
  entityId: string
  sourceLocale: string
  targetLocale: string
  status: TranslationTaskStatus
  priority: TranslationTaskPriority
  retryCount: number
  errorMessage: string | null
  createdAt: string
  updatedAt: string
  startedAt: string | null
  completedAt: string | null
}

interface TranslationTaskRowProps {
  task: TranslationTaskItem
  isSelected: boolean
  onToggle: (id: string) => void
  onRetry: (id: string) => void
  onCancel: (id: string) => void
  onDelete: (id: string) => void
  isRetrying: boolean
}

const TranslationTaskRow = memo(
  ({
    task,
    isSelected,
    onToggle,
    onRetry,
    onCancel,
    onDelete,
    isRetrying,
  }: TranslationTaskRowProps) => {
    const t = useTranslations("AdminTranslationTasks")

    const getStatusBadge = (status: TranslationTaskStatus) => {
      switch (status) {
        case "COMPLETED":
          return (
            <Badge
              variant="default"
              className="bg-green-500 hover:bg-green-600"
            >
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {t("status.completed")}
            </Badge>
          )
        case "FAILED":
          return (
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              {t("status.failed")}
            </Badge>
          )
        case "PROCESSING":
          return (
            <Badge
              variant="secondary"
              className="bg-blue-500/20 text-blue-600 dark:text-blue-400"
            >
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              {t("status.processing")}
            </Badge>
          )
        case "PENDING":
          return (
            <Badge variant="outline" className="text-foreground/60">
              <Clock className="h-3 w-3 mr-1" />
              {t("status.pending")}
            </Badge>
          )
        case "CANCELLED":
          return (
            <Badge variant="outline" className="text-foreground/40">
              {t("status.cancelled")}
            </Badge>
          )
        default:
          return <Badge variant="outline">{status}</Badge>
      }
    }

    const getPriorityBadge = (priority: TranslationTaskPriority) => {
      switch (priority) {
        case "URGENT":
          return (
            <Badge variant="destructive" className="h-5 text-[10px] px-1.5">
              {t("priority.urgent")}
            </Badge>
          )
        case "HIGH":
          return (
            <Badge
              variant="secondary"
              className="h-5 text-[10px] px-1.5 bg-orange-500/20 text-orange-600"
            >
              {t("priority.high")}
            </Badge>
          )
        case "NORMAL":
          return (
            <Badge variant="outline" className="h-5 text-[10px] px-1.5">
              {t("priority.normal")}
            </Badge>
          )
        case "LOW":
          return (
            <Badge
              variant="outline"
              className="h-5 text-[10px] px-1.5 text-foreground/60"
            >
              {t("priority.low")}
            </Badge>
          )
        case "LOWEST":
          return (
            <Badge
              variant="outline"
              className="h-5 text-[10px] px-1.5 text-foreground/40"
            >
              {t("priority.lowest")}
            </Badge>
          )
        default:
          return null
      }
    }

    return (
      <TableRow
        className="group hover:bg-foreground/5 transition-colors border-border/40"
        data-state={isSelected && "selected"}
      >
        <TableCell>
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggle(task.id)}
            aria-label={`Select task ${task.id}`}
          />
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium text-sm">
              {t(`entityType.${task.entityType.toLowerCase()}`)}
            </span>
            <span className="text-xs text-foreground/40">
              ID: {task.entityId}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-foreground/60">{task.sourceLocale}</span>
            <span className="text-foreground/40">→</span>
            <span className="font-medium">{task.targetLocale}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            {getStatusBadge(task.status)}
            {task.errorMessage && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <AlertCircle className="h-4 w-4 text-destructive/60" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs wrap-break-word">
                    {task.errorMessage}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </TableCell>
        <TableCell>{getPriorityBadge(task.priority)}</TableCell>
        <TableCell>
          <span className="text-sm text-foreground/60">{task.retryCount}</span>
        </TableCell>
        <TableCell>
          <div className="flex flex-col gap-1 text-xs text-foreground/60">
            <span>
              {t("table.created")}: <RelativeTime date={task.createdAt} />
            </span>
            {task.updatedAt !== task.createdAt && (
              <span>
                {t("table.updated")}: <RelativeTime date={task.updatedAt} />
              </span>
            )}
          </div>
        </TableCell>
        <TableCell className="text-right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <EllipsisVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onRetry(task.id)}
                disabled={
                  isRetrying ||
                  task.status === "PENDING" ||
                  task.status === "PROCESSING"
                }
              >
                {isRetrying ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <RotateCcw className="mr-2 h-4 w-4" />
                )}
                {t("table.action.retry")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onCancel(task.id)}
                disabled={task.status !== "PENDING"}
              >
                <Ban className="mr-2 h-4 w-4" />
                {t("table.action.cancel")}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onDelete(task.id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t("table.action.delete")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )
  }
)
TranslationTaskRow.displayName = "TranslationTaskRow"

interface TranslationTaskTableProps {
  tasks: TranslationTaskItem[]
  selectedIds: string[]
  onSelectionChange: (ids: string[]) => void
  onRetry: (id: string) => void
  onCancel: (id: string) => void
  onDelete: (id: string) => void
  isRetrying?: string | null
  isLoading?: boolean
}

export function TranslationTaskTable({
  tasks,
  selectedIds,
  onSelectionChange,
  onRetry,
  onCancel,
  onDelete,
  isRetrying,
  isLoading,
}: TranslationTaskTableProps) {
  const t = useTranslations("AdminTranslationTasks")

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.length === tasks.length) {
      onSelectionChange([])
    } else {
      onSelectionChange(tasks.map((task) => task.id))
    }
  }, [selectedIds.length, tasks, onSelectionChange])

  const toggleSelect = useCallback(
    (id: string) => {
      if (selectedIds.includes(id)) {
        onSelectionChange(selectedIds.filter((i) => i !== id))
      } else {
        onSelectionChange([...selectedIds, id])
      }
    },
    [selectedIds, onSelectionChange]
  )

  return (
    <div className="relative rounded-2xl border border-border/40 bg-background/60 backdrop-blur overflow-hidden">
      {isLoading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/40 backdrop-blur-[1px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/40">
              <TableHead className="w-[40px]">
                <Checkbox
                  checked={
                    tasks.length > 0 && selectedIds.length === tasks.length
                  }
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all"
                />
              </TableHead>
              <TableHead>{t("table.entity")}</TableHead>
              <TableHead>{t("table.language")}</TableHead>
              <TableHead>{t("table.statusLabel")}</TableHead>
              <TableHead>{t("table.priorityLabel")}</TableHead>
              <TableHead>{t("table.retry")}</TableHead>
              <TableHead>{t("table.time")}</TableHead>
              <TableHead className="text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tasks.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-12 text-foreground/60"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TranslationTaskRow
                  key={task.id}
                  task={task}
                  isSelected={selectedIds.includes(task.id)}
                  onToggle={toggleSelect}
                  onRetry={onRetry}
                  onCancel={onCancel}
                  onDelete={onDelete}
                  isRetrying={isRetrying === task.id}
                />
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
