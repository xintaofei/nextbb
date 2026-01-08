"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import useSWR from "swr"
import { format } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"

type Log = {
  id: string
  ruleId: string
  triggeredBy: string | null
  triggerContext: unknown
  executionStatus: string
  executionResult: unknown
  errorMessage: string | null
  executedAt: string
}

type LogListResult = {
  items: Log[]
  page: number
  pageSize: number
  total: number
}

type AutomationRuleLogsDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  ruleId: string
  ruleName?: string
}

const fetcher = async (url: string): Promise<LogListResult> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch logs")
  return res.json()
}

export function AutomationRuleLogsDialog({
  open,
  onOpenChange,
  ruleId,
  ruleName,
}: AutomationRuleLogsDialogProps) {
  const t = useTranslations("AdminAutomationRules")

  const [statusFilter, setStatusFilter] = useState("all")
  const [page, setPage] = useState(1)

  // 当对话框关闭时重置状态
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setStatusFilter("all")
      setPage(1)
    }
    onOpenChange(newOpen)
  }

  const apiUrl = `/api/admin/automation-rules/${ruleId}/logs?page=${page}&pageSize=20${
    statusFilter !== "all" ? `&status=${statusFilter}` : ""
  }`

  const { data, error } = useSWR<LogListResult>(open ? apiUrl : null, fetcher)

  const loading = !data && !error
  const logs = data?.items || []
  const total = data?.total || 0

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return "default" as const
      case "FAILED":
        return "destructive" as const
      case "SKIPPED":
        return "secondary" as const
      default:
        return "outline" as const
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SUCCESS":
        return t("logsDialog.filter.statusOptions.SUCCESS")
      case "FAILED":
        return t("logsDialog.filter.statusOptions.FAILED")
      case "SKIPPED":
        return t("logsDialog.filter.statusOptions.SKIPPED")
      default:
        return status
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {t("logsDialog.title")}
            {ruleName && ` - ${ruleName}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* 筛选条件 */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("logsDialog.filter.statusOptions.all")}
                  </SelectItem>
                  <SelectItem value="SUCCESS">
                    {t("logsDialog.filter.statusOptions.SUCCESS")}
                  </SelectItem>
                  <SelectItem value="FAILED">
                    {t("logsDialog.filter.statusOptions.FAILED")}
                  </SelectItem>
                  <SelectItem value="SKIPPED">
                    {t("logsDialog.filter.statusOptions.SKIPPED")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm text-muted-foreground">
              {t("pagination.total", { count: total })}
            </div>
          </div>

          {/* 日志列表 */}
          <ScrollArea className="h-[50vh]">
            <div className="space-y-3 pr-4">
              {loading && (
                <div className="text-center text-muted-foreground py-8">
                  {t("loading")}
                </div>
              )}
              {error && (
                <div className="text-center text-destructive py-8">
                  加载日志失败
                </div>
              )}
              {!loading && !error && logs.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  {t("empty")}
                </div>
              )}
              {logs.map((log) => (
                <Card key={log.id}>
                  <CardContent className="pt-4">
                    <div className="space-y-3">
                      {/* 头部信息 */}
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={getStatusBadgeVariant(
                                log.executionStatus
                              )}
                            >
                              {getStatusLabel(log.executionStatus)}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {format(
                                new Date(log.executedAt),
                                "yyyy-MM-dd HH:mm:ss"
                              )}
                            </span>
                          </div>
                          {log.triggeredBy && (
                            <div className="text-xs text-muted-foreground">
                              {t("logsDialog.log.triggeredBy")}:{" "}
                              {String(log.triggeredBy)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 触发上下文 */}
                      {log.triggerContext != null && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">
                            {t("logsDialog.log.context")}
                          </div>
                          <div className="text-xs font-mono bg-muted p-2 rounded-md overflow-x-auto">
                            <pre className="whitespace-pre-wrap break-all">
                              {JSON.stringify(log.triggerContext, null, 2) ||
                                ""}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* 执行结果 */}
                      {log.executionResult != null && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-muted-foreground">
                            {t("logsDialog.log.result")}
                          </div>
                          <div className="text-xs font-mono bg-muted p-2 rounded-md overflow-x-auto">
                            <pre className="whitespace-pre-wrap break-all">
                              {JSON.stringify(log.executionResult, null, 2) ||
                                ""}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* 错误信息 */}
                      {log.errorMessage && (
                        <div className="space-y-1">
                          <div className="text-xs font-medium text-destructive">
                            {t("logsDialog.log.error")}
                          </div>
                          <div className="text-xs bg-destructive/10 text-destructive p-2 rounded-md">
                            {log.errorMessage}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* 分页 */}
          {total > 0 && (
            <div className="flex items-center justify-between pt-2 border-t">
              <div className="text-sm text-muted-foreground">
                {t("pagination.page", { page })}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  {t("pagination.prev")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={logs.length < 20}
                >
                  {t("pagination.next")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
