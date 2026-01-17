"use client"

import { useMemo, useState, useCallback } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { AdminPageContainer } from "@/components/admin/layout/admin-page-container"
import { AdminPageSection } from "@/components/admin/layout/admin-page-section"
import { Filter, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  TranslationTaskTable,
  TranslationTaskItem,
} from "@/components/admin/tables/translation-task-table"
import {
  TranslationTaskStatus,
  TranslationTaskPriority,
  TranslationEntityType,
} from "@prisma/client"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"

type TranslationTaskListResult = {
  items: TranslationTaskItem[]
  total: number
}

const fetcher = async (url: string): Promise<TranslationTaskListResult> => {
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error("failed")
  }
  return res.json()
}

export default function AdminTranslationTasksPage() {
  const t = useTranslations("AdminTranslationTasks")
  const [status, setStatus] = useState<string>("ALL")
  const [priority, setPriority] = useState<string>("ALL")
  const [entityType, setEntityType] = useState<string>("ALL")
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [isRetrying, setIsRetrying] = useState<string | null>(null)

  // Memoize the query URL to prevent unnecessary recalculations
  const query = useMemo(() => {
    const params = new URLSearchParams()
    if (status !== "ALL") params.set("status", status)
    if (priority !== "ALL") params.set("priority", priority)
    if (entityType !== "ALL") params.set("entityType", entityType)
    params.set("page", page.toString())
    params.set("pageSize", pageSize.toString())
    return `/api/admin/translation-tasks?${params.toString()}`
  }, [status, priority, entityType, page])

  const { data, isLoading, mutate } = useSWR<TranslationTaskListResult>(
    query,
    fetcher,
    {
      keepPreviousData: true, // Keep showing previous data while loading new page
      revalidateOnFocus: false, // Don't revalidate on window focus to save requests
    }
  )

  // Use useCallback for handlers to prevent recreating them on every render
  const handleRetry = useCallback(
    async (id: string) => {
      try {
        setIsRetrying(id)
        const res = await fetch(`/api/admin/translation-tasks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "retry" }),
        })

        if (res.ok) {
          toast.success(t("message.retrySuccess"))
          await mutate() // Revalidate data
        } else {
          toast.error(t("message.retryError"))
        }
      } catch {
        toast.error(t("message.retryError"))
      } finally {
        setIsRetrying(null)
      }
    },
    [t, mutate]
  )

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm(t("deleteConfirm.description"))) return

      try {
        const res = await fetch(`/api/admin/translation-tasks/${id}`, {
          method: "DELETE",
        })

        if (res.ok) {
          toast.success(t("message.deleteSuccess"))
          await mutate() // Revalidate data
        } else {
          toast.error(t("message.deleteError"))
        }
      } catch {
        toast.error(t("message.deleteError"))
      }
    },
    [t, mutate]
  )

  // Memoize status options to prevent re-rendering of Select items
  const statusOptions = useMemo(() => Object.values(TranslationTaskStatus), [])
  const priorityOptions = useMemo(
    () => Object.values(TranslationTaskPriority),
    []
  )
  const entityTypeOptions = useMemo(
    () => Object.values(TranslationEntityType),
    []
  )

  const totalPages = data ? Math.ceil(data.total / pageSize) : 1

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  return (
    <AdminPageContainer>
      <AdminPageSection delay={0}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-foreground/60 mt-1">
              {t("description")}
            </p>
          </div>
          <Button variant="outline" onClick={() => mutate()}>
            <RefreshCcw className="mr-2 h-4 w-4" />
            {t("refresh")}
          </Button>
        </div>
      </AdminPageSection>

      <AdminPageSection
        delay={0.2}
        className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur"
      >
        <div className="absolute inset-0 bg-linear-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

        <div className="relative space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5 text-foreground/60" />
            <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground">
              {t("filter.title")}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              value={status}
              onValueChange={(val) => {
                setStatus(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="bg-background/60 border-border/40 focus:border-border/60">
                <SelectValue placeholder={t("status.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("status.all")}</SelectItem>
                {statusOptions.map((s) => (
                  <SelectItem key={s} value={s}>
                    {t(`status.${s.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={priority}
              onValueChange={(val) => {
                setPriority(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="bg-background/60 border-border/40 focus:border-border/60">
                <SelectValue placeholder={t("priority.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("priority.all")}</SelectItem>
                {priorityOptions.map((p) => (
                  <SelectItem key={p} value={p}>
                    {t(`priority.${p.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={entityType}
              onValueChange={(val) => {
                setEntityType(val)
                setPage(1)
              }}
            >
              <SelectTrigger className="bg-background/60 border-border/40 focus:border-border/60">
                <SelectValue placeholder={t("filter.entityType.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">
                  {t("filter.entityType.all")}
                </SelectItem>
                {entityTypeOptions.map((e) => (
                  <SelectItem key={e} value={e}>
                    {t(`entityType.${e.toLowerCase()}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </AdminPageSection>

      {isLoading && !data ? (
        <div className="text-center py-12 text-foreground/60">
          {t("loading")}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="text-center py-12 text-foreground/60">{t("empty")}</div>
      ) : (
        <AdminPageSection delay={0.3} className="space-y-4">
          <TranslationTaskTable
            tasks={data.items}
            onRetry={handleRetry}
            onDelete={handleDelete}
            isRetrying={isRetrying}
          />

          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handlePageChange(Math.max(1, page - 1))}
                    disabled={page === 1}
                  >
                    <span className="sr-only">{t("pagination.prev")}</span>
                    &lt;
                  </Button>
                </PaginationItem>
                <PaginationItem>
                  <span className="flex items-center px-4 text-sm text-foreground/60">
                    {page} / {totalPages}
                  </span>
                </PaginationItem>
                <PaginationItem>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      handlePageChange(Math.min(totalPages, page + 1))
                    }
                    disabled={page === totalPages}
                  >
                    <span className="sr-only">{t("pagination.next")}</span>
                    &gt;
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </AdminPageSection>
      )}
    </AdminPageContainer>
  )
}
