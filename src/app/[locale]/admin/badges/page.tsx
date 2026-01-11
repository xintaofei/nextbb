"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { AdminPageContainer } from "@/components/admin/layout/admin-page-container"
import { AdminPageSection } from "@/components/admin/layout/admin-page-section"
import { Search, Filter, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { BadgeStatsCard } from "@/components/admin/stats/badge-stats-card"
import { BadgeCard } from "@/components/admin/cards/badge-card"
import { BadgeDialog } from "@/components/admin/dialogs/badge-dialog"
import { BadgeTranslationDialog } from "@/components/admin/dialogs/badge-translation-dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"

type BadgeListItem = {
  id: string
  name: string
  icon: string
  description: string | null
  badgeType: string
  level: number
  sort: number
  bgColor: string | null
  textColor: string | null
  sourceLocale: string
  isEnabled: boolean
  isVisible: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

type BadgeListResult = {
  items: BadgeListItem[]
  page: number
  pageSize: number
  total: number
}

const fetcher = async (url: string): Promise<BadgeListResult> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    throw new Error("failed")
  }
  return res.json()
}

export default function AdminBadgesPage() {
  const t = useTranslations("AdminBadges")
  const [q, setQ] = useState("")
  const [badgeType, setBadgeType] = useState<string | undefined>(undefined)
  const [level, setLevel] = useState<string | undefined>(undefined)
  const [status, setStatus] = useState<string | undefined>(undefined)
  const [sortBy, setSortBy] = useState("updated_at")
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingBadge, setEditingBadge] = useState<BadgeListItem | undefined>(
    undefined
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [translationDialogOpen, setTranslationDialogOpen] = useState(false)
  const [translatingBadgeId, setTranslatingBadgeId] = useState<string | null>(
    null
  )

  const query = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    if (q.trim().length > 0) params.set("q", q.trim())
    if (badgeType && badgeType !== "all") params.set("badgeType", badgeType)
    if (level && level !== "all") params.set("level", level)
    if (status === "enabled") params.set("enabled", "true")
    else if (status === "disabled") params.set("enabled", "false")
    else if (status === "deleted") params.set("deleted", "true")
    params.set("sortBy", sortBy)
    return `/api/admin/badges?${params.toString()}`
  }, [q, badgeType, level, status, sortBy, page])

  const { data, isLoading, mutate } = useSWR<BadgeListResult>(query, fetcher)

  const stats = useMemo(() => {
    if (!data)
      return {
        total: 0,
        enabled: 0,
        disabled: 0,
        deleted: 0,
        typeDistribution: {},
      }

    const enabled = data.items.filter((b) => b.isEnabled && !b.isDeleted).length
    const disabled = data.items.filter(
      (b) => !b.isEnabled && !b.isDeleted
    ).length
    const deleted = data.items.filter((b) => b.isDeleted).length

    const typeDistribution: Record<string, number> = {}
    data.items.forEach((badge) => {
      if (!badge.isDeleted) {
        typeDistribution[badge.badgeType] =
          (typeDistribution[badge.badgeType] || 0) + 1
      }
    })

    return {
      total: data.total,
      enabled,
      disabled,
      deleted,
      typeDistribution,
    }
  }, [data])

  const handleCreate = () => {
    setEditingBadge(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (id: string) => {
    const badge = data?.items.find((b) => b.id === id)
    if (badge) {
      setEditingBadge(badge)
      setDialogOpen(true)
    }
  }

  const handleManageTranslations = (id: string) => {
    setTranslatingBadgeId(id)
    setTranslationDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingId) return

    try {
      const res = await fetch(`/api/admin/badges/${deletingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDeleted: true }),
      })

      if (res.ok) {
        toast.success(t("message.deleteSuccess"))
        await mutate()
      } else {
        toast.error(t("message.deleteError"))
      }
    } catch {
      toast.error(t("message.deleteError"))
    } finally {
      setDeleteDialogOpen(false)
      setDeletingId(null)
    }
  }

  const handleSubmit = async (formData: {
    name: string
    icon: string
    description: string | null
    badgeType: string
    level: number
    sort: number
    bgColor: string | null
    textColor: string | null
    isEnabled: boolean
    isVisible: boolean
  }) => {
    try {
      const url = editingBadge
        ? `/api/admin/badges/${editingBadge.id}`
        : "/api/admin/badges"
      const method = editingBadge ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success(
          editingBadge ? t("message.updateSuccess") : t("message.createSuccess")
        )
        await mutate()
        setDialogOpen(false)
      } else {
        const errorData = await res.json()
        toast.error(
          errorData.error ||
            (editingBadge ? t("message.updateError") : t("message.createError"))
        )
      }
    } catch {
      toast.error(
        editingBadge ? t("message.updateError") : t("message.createError")
      )
    }
  }

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
          <Button onClick={handleCreate}>
            <Plus className="mr-2 h-4 w-4" />
            {t("createButton")}
          </Button>
        </div>
      </AdminPageSection>

      <BadgeStatsCard
        totalBadges={stats.total}
        enabledBadges={stats.enabled}
        disabledBadges={stats.disabled}
        deletedBadges={stats.deleted}
        typeDistribution={stats.typeDistribution}
      />

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/40" />
              <Input
                placeholder={t("searchPlaceholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9 bg-background/60 border-border/40 focus:border-border/60"
              />
            </div>

            <Select
              value={badgeType ?? "all"}
              onValueChange={(value) =>
                setBadgeType(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="bg-background/60 border-border/40 focus:border-border/60">
                <SelectValue placeholder={t("filter.badgeTypeOptions.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("filter.badgeTypeOptions.all")}
                </SelectItem>
                <SelectItem value="achievement">
                  {t("filter.badgeTypeOptions.achievement")}
                </SelectItem>
                <SelectItem value="honor">
                  {t("filter.badgeTypeOptions.honor")}
                </SelectItem>
                <SelectItem value="role">
                  {t("filter.badgeTypeOptions.role")}
                </SelectItem>
                <SelectItem value="event">
                  {t("filter.badgeTypeOptions.event")}
                </SelectItem>
                <SelectItem value="special">
                  {t("filter.badgeTypeOptions.special")}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={level ?? "all"}
              onValueChange={(value) =>
                setLevel(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="bg-background/60 border-border/40 focus:border-border/60">
                <SelectValue placeholder={t("filter.levelOptions.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("filter.levelOptions.all")}
                </SelectItem>
                <SelectItem value="1">{t("filter.levelOptions.1")}</SelectItem>
                <SelectItem value="2">{t("filter.levelOptions.2")}</SelectItem>
                <SelectItem value="3">{t("filter.levelOptions.3")}</SelectItem>
                <SelectItem value="4">{t("filter.levelOptions.4")}</SelectItem>
                <SelectItem value="5">{t("filter.levelOptions.5")}</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={status ?? "all"}
              onValueChange={(value) =>
                setStatus(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="bg-background/60 border-border/40 focus:border-border/60">
                <SelectValue placeholder={t("filter.statusOptions.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">
                  {t("filter.statusOptions.all")}
                </SelectItem>
                <SelectItem value="enabled">
                  {t("filter.statusOptions.enabled")}
                </SelectItem>
                <SelectItem value="disabled">
                  {t("filter.statusOptions.disabled")}
                </SelectItem>
                <SelectItem value="deleted">
                  {t("filter.statusOptions.deleted")}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-background/60 border-border/40 focus:border-border/60">
                <SelectValue placeholder={t("filter.sortBy")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updated_at">
                  {t("filter.sortByOptions.updatedAt")}
                </SelectItem>
                <SelectItem value="sort">
                  {t("filter.sortByOptions.sort")}
                </SelectItem>
                <SelectItem value="level">
                  {t("filter.sortByOptions.level")}
                </SelectItem>
              </SelectContent>
            </Select>
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
        <AdminPageSection
          delay={0.3}
          className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
        >
          {data.items.map((badge) => (
            <BadgeCard
              key={badge.id}
              badge={badge}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onManageTranslations={handleManageTranslations}
            />
          ))}
        </AdminPageSection>
      )}

      <AdminPageSection
        delay={0.4}
        className="flex items-center justify-between rounded-2xl border border-border/40 bg-background/60 p-4 backdrop-blur"
      >
        <span className="text-sm text-foreground/60">
          {t("pagination.total", { count: data?.total ?? 0 })}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            disabled={(data?.page ?? 1) <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            {t("pagination.prev")}
          </Button>
          <span className="text-sm min-w-20 text-center">
            {t("pagination.page", { page: data?.page ?? 1 })}
          </span>
          <Button
            variant="ghost"
            disabled={!data ? true : data.page * data.pageSize >= data.total}
            onClick={() => setPage((p) => p + 1)}
          >
            {t("pagination.next")}
          </Button>
        </div>
      </AdminPageSection>

      <BadgeDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        badge={editingBadge}
        onSubmit={handleSubmit}
      />

      <BadgeTranslationDialog
        open={translationDialogOpen}
        onOpenChange={setTranslationDialogOpen}
        badgeId={translatingBadgeId}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteConfirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              {t("deleteConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageContainer>
  )
}
