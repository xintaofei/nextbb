"use client"

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

interface TranslationTaskTableProps {
  tasks: TranslationTaskItem[]
  onRetry: (id: string) => void
  onDelete: (id: string) => void
  isRetrying?: string | null
}

export function TranslationTaskTable({
  tasks,
  onRetry,
  onDelete,
  isRetrying,
}: TranslationTaskTableProps) {
  const t = useTranslations("AdminTranslationTasks")

  const getStatusBadge = (status: TranslationTaskStatus) => {
    switch (status) {
      case "COMPLETED":
        return (
          <Badge variant="default" className="bg-green-500 hover:bg-green-600">
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
    <div className="rounded-2xl border border-border/40 bg-background/60 backdrop-blur overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent border-border/40">
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
                  colSpan={7}
                  className="text-center py-12 text-foreground/60"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              tasks.map((task) => (
                <TableRow
                  key={task.id}
                  className="group hover:bg-foreground/5 transition-colors border-border/40"
                >
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium text-sm">
                        {task.entityType}
                      </span>
                      <span className="text-xs text-foreground/40">
                        ID: {task.entityId}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-foreground/60">
                        {task.sourceLocale}
                      </span>
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
                            <TooltipContent className="max-w-xs break-words">
                              {task.errorMessage}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>{getPriorityBadge(task.priority)}</TableCell>
                  <TableCell>
                    <span className="text-sm text-foreground/60">
                      {task.retryCount}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1 text-xs text-foreground/60">
                      <span>
                        {t("table.created")}:{" "}
                        <RelativeTime date={task.createdAt} />
                      </span>
                      {task.updatedAt !== task.createdAt && (
                        <span>
                          {t("table.updated")}:{" "}
                          <RelativeTime date={task.updatedAt} />
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
                            task.status === "COMPLETED" ||
                            task.status === "PROCESSING" ||
                            isRetrying === task.id
                          }
                        >
                          {isRetrying === task.id ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          ) : (
                            <RotateCcw className="mr-2 h-4 w-4" />
                          )}
                          {t("table.action.retry")}
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
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
