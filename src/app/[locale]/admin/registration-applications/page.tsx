"use client"

import { useCallback, useMemo, useState, type ReactElement } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { Filter } from "lucide-react"
import { toast } from "sonner"
import type { RegistrationApplicationStatus } from "@prisma/client"
import { AdminPageContainer } from "@/components/admin/layout/admin-page-container"
import { AdminPageSection } from "@/components/admin/layout/admin-page-section"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
} from "@/components/ui/pagination"
import {
  RegistrationApplicationTable,
  type RegistrationApplicationItem,
} from "@/components/admin/tables/registration-application-table"
import { RegistrationReviewDialog } from "@/components/admin/dialogs/registration-review-dialog"

type RegistrationApplicationListResult = {
  items: RegistrationApplicationItem[]
  page: number
  pageSize: number
  total: number
}

const fetcher = async (
  url: string
): Promise<RegistrationApplicationListResult> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    throw new Error("failed")
  }
  return res.json()
}

const STATUSES: RegistrationApplicationStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
]

export default function AdminRegistrationApplicationsPage(): ReactElement {
  const t = useTranslations("AdminRegistrationApplications")
  const [q, setQ] = useState("")
  const [status, setStatus] = useState<string>("ALL")
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogAction, setDialogAction] = useState<"approve" | "reject">(
    "approve"
  )
  const [selected, setSelected] = useState<RegistrationApplicationItem | null>(
    null
  )
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [processingId, setProcessingId] = useState<string | null>(null)

  const query = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    if (q.trim().length > 0) params.set("q", q.trim())
    if (status !== "ALL") params.set("status", status)
    return `/api/admin/registration-applications?${params.toString()}`
  }, [page, pageSize, q, status])

  const { data, isLoading, mutate } = useSWR<RegistrationApplicationListResult>(
    query,
    fetcher
  )

  const totalPages = data ? Math.max(1, Math.ceil(data.total / pageSize)) : 1

  const handlePageChange = (nextPage: number): void => {
    setPage(nextPage)
  }

  const handleDialogOpenChange = useCallback((open: boolean): void => {
    setDialogOpen(open)
    if (!open) {
      setSelected(null)
    }
  }, [])

  const handleReview = useCallback(
    (item: RegistrationApplicationItem, action: "approve" | "reject"): void => {
      setSelected(item)
      setDialogAction(action)
      setDialogOpen(true)
    },
    []
  )

  const handleSubmitReview = useCallback(
    async (reason: string): Promise<void> => {
      if (!selected) return

      setIsSubmitting(true)
      setProcessingId(selected.id)
      try {
        const res = await fetch(
          `/api/admin/registration-applications/${selected.id}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: dialogAction, reason }),
          }
        )

        const result = (await res.json().catch(() => ({}))) as
          | { success?: boolean; emailFailed?: boolean; error?: string }
          | { error?: string }

        if (!res.ok || !result || ("error" in result && result.error)) {
          toast.error(result.error || t("message.updateFailed"))
          return
        }

        if (dialogAction === "approve") {
          toast.success(t("message.approveSuccess"))
        } else {
          toast.success(t("message.rejectSuccess"))
        }

        if ("emailFailed" in result && result.emailFailed) {
          toast.error(t("message.emailFailed"))
        }

        setDialogOpen(false)
        setSelected(null)
        await mutate()
      } catch {
        toast.error(t("message.updateFailed"))
      } finally {
        setIsSubmitting(false)
        setProcessingId(null)
      }
    },
    [dialogAction, mutate, selected, t]
  )

  return (
    <AdminPageContainer>
      <AdminPageSection delay={0}>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-foreground/60 mt-1">{t("description")}</p>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder={t("filter.searchPlaceholder")}
              value={q}
              onChange={(event) => setQ(event.target.value)}
              className="bg-background/60 border-border/40 focus:border-border/60"
            />

            <Select value={status} onValueChange={(value) => setStatus(value)}>
              <SelectTrigger className="bg-background/60 border-border/40 focus:border-border/60">
                <SelectValue placeholder={t("filter.statusAll")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("filter.statusAll")}</SelectItem>
                {STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item === "PENDING"
                      ? t("status.pending")
                      : item === "APPROVED"
                        ? t("status.approved")
                        : t("status.rejected")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              onClick={() => setPage(1)}
              className="w-full"
              variant="default"
            >
              {t("filter.apply")}
            </Button>
          </div>
        </div>
      </AdminPageSection>

      {isLoading ? (
        <div className="text-center py-12 text-foreground/60">
          {t("loading")}
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="text-center py-12 text-foreground/60">{t("empty")}</div>
      ) : (
        <AdminPageSection delay={0.3} className="space-y-4">
          <RegistrationApplicationTable
            items={data.items}
            onReview={handleReview}
            processingId={processingId}
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

      <RegistrationReviewDialog
        key={selected ? `${selected.id}-${dialogAction}` : "none"}
        open={dialogOpen}
        action={dialogAction}
        application={selected}
        isSubmitting={isSubmitting}
        onOpenChange={handleDialogOpenChange}
        onSubmit={handleSubmitReview}
      />
    </AdminPageContainer>
  )
}
