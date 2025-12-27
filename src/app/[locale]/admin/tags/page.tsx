"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { AdminPageContainer } from "@/components/admin/layout/admin-page-container"
import { AdminPageSection } from "@/components/admin/layout/admin-page-section"
import { Search, Filter, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TagStatsCard } from "@/components/admin/stats/tag-stats-card"
import { TagCard } from "@/components/admin/cards/tag-card"
import { TagDialog } from "@/components/admin/dialogs/tag-dialog"
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

type TagListItem = {
  id: string
  name: string
  icon: string
  description: string
  sort: number
  bgColor: string | null
  textColor: string | null
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  usageCount: number
}

type TagListResult = {
  items: TagListItem[]
  page: number
  pageSize: number
  total: number
}

const fetcher = async (url: string): Promise<TagListResult> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    throw new Error("failed")
  }
  return res.json()
}

export default function AdminTagsPage() {
  const t = useTranslations("AdminTags")
  const [q, setQ] = useState("")
  const [deleted, setDeleted] = useState<string | undefined>(undefined)
  const [sortBy, setSortBy] = useState("updated_at")
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTag, setEditingTag] = useState<TagListItem | undefined>(
    undefined
  )
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const query = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    if (q.trim().length > 0) params.set("q", q.trim())
    if (typeof deleted === "string") params.set("deleted", deleted)
    params.set("sortBy", sortBy)
    return `/api/admin/tags?${params.toString()}`
  }, [q, deleted, sortBy, page])

  const { data, isLoading, mutate } = useSWR<TagListResult>(query, fetcher)

  const stats = useMemo(() => {
    if (!data)
      return {
        total: 0,
        active: 0,
        deleted: 0,
        hottest: undefined,
      }

    const active = data.items.filter((t) => !t.isDeleted).length
    const deleted = data.items.filter((t) => t.isDeleted).length
    const hottest = data.items.reduce(
      (max, tag) => (tag.usageCount > (max?.usageCount || 0) ? tag : max),
      data.items[0]
    )

    return {
      total: data.total,
      active,
      deleted,
      hottest: hottest
        ? { name: hottest.name, usageCount: hottest.usageCount }
        : undefined,
    }
  }, [data])

  const handleCreate = () => {
    setEditingTag(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (id: string) => {
    const tag = data?.items.find((t) => t.id === id)
    if (tag) {
      setEditingTag(tag)
      setDialogOpen(true)
    }
  }

  const handleDelete = (id: string) => {
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingId) return

    try {
      const res = await fetch(`/api/admin/tags/${deletingId}`, {
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
    description: string
    sort: number
    bgColor: string | null
    textColor: string | null
  }) => {
    try {
      if (editingTag) {
        const res = await fetch(`/api/admin/tags/${editingTag.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (res.ok) {
          toast.success(t("message.updateSuccess"))
          await mutate()
        } else {
          toast.error(t("message.updateError"))
        }
      } else {
        const res = await fetch("/api/admin/tags", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        if (res.ok) {
          toast.success(t("message.createSuccess"))
          await mutate()
        } else {
          toast.error(t("message.createError"))
        }
      }
    } catch {
      toast.error(
        editingTag ? t("message.updateError") : t("message.createError")
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

      <TagStatsCard
        totalTags={stats.total}
        activeTags={stats.active}
        deletedTags={stats.deleted}
        hottestTag={stats.hottest}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              value={deleted ?? "all"}
              onValueChange={(value) =>
                setDeleted(value === "all" ? undefined : value)
              }
            >
              <SelectTrigger className="bg-background/60 border-border/40 focus:border-border/60">
                <SelectValue placeholder={t("filter.deleted.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter.deleted.all")}</SelectItem>
                <SelectItem value="false">
                  {t("filter.deleted.normal")}
                </SelectItem>
                <SelectItem value="true">
                  {t("filter.deleted.deleted")}
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
                <SelectItem value="usage_count">
                  {t("filter.sortByOptions.usageCount")}
                </SelectItem>
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
        <AdminPageSection
          delay={0.3}
          className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
        >
          {data.items.map((tag) => (
            <TagCard
              key={tag.id}
              tag={tag}
              onEdit={handleEdit}
              onDelete={handleDelete}
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

      <TagDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        tag={editingTag}
        onSubmit={handleSubmit}
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
