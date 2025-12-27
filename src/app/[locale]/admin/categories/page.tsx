"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { Search, Filter, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CategoryStatsCard } from "@/components/admin/category-stats-card"
import { CategoryCard } from "@/components/admin/category-card"
import { CategoryDialog } from "@/components/admin/category-dialog"
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

type CategoryListItem = {
  id: string
  name: string
  icon: string
  description: string | null
  sort: number
  bgColor: string | null
  textColor: string | null
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  topicCount: number
}

type CategoryListResult = {
  items: CategoryListItem[]
  page: number
  pageSize: number
  total: number
}

const fetcher = async (url: string): Promise<CategoryListResult> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    throw new Error("failed")
  }
  return res.json()
}

export default function AdminCategoriesPage() {
  const t = useTranslations("AdminCategories")
  const [q, setQ] = useState("")
  const [deleted, setDeleted] = useState<string | undefined>(undefined)
  const [sortBy, setSortBy] = useState("updated_at")
  const [page, setPage] = useState(1)
  const pageSize = 20

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<
    CategoryListItem | undefined
  >(undefined)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const query = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    if (q.trim().length > 0) params.set("q", q.trim())
    if (typeof deleted === "string") params.set("deleted", deleted)
    params.set("sortBy", sortBy)
    return `/api/admin/categories?${params.toString()}`
  }, [q, deleted, sortBy, page])

  const { data, isLoading, mutate } = useSWR<CategoryListResult>(query, fetcher)

  const stats = useMemo(() => {
    if (!data)
      return {
        total: 0,
        active: 0,
        deleted: 0,
        hottest: undefined,
      }

    const active = data.items.filter((c) => !c.isDeleted).length
    const deleted = data.items.filter((c) => c.isDeleted).length
    const hottest = data.items.reduce(
      (max, cat) => (cat.topicCount > (max?.topicCount || 0) ? cat : max),
      data.items[0]
    )

    return {
      total: data.total,
      active,
      deleted,
      hottest: hottest
        ? { name: hottest.name, topicCount: hottest.topicCount }
        : undefined,
    }
  }, [data])

  const handleCreate = () => {
    setEditingCategory(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (id: string) => {
    const category = data?.items.find((c) => c.id === id)
    if (category) {
      setEditingCategory(category)
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
      const res = await fetch(`/api/admin/categories/${deletingId}`, {
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
      if (editingCategory) {
        const res = await fetch(`/api/admin/categories/${editingCategory.id}`, {
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
        const res = await fetch("/api/admin/categories", {
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
        editingCategory ? t("message.updateError") : t("message.createError")
      )
    }
  }

  return (
    <div className="relative px-6 py-8 lg:py-12">
      <div className="mx-auto max-w-7xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                {t("title")}
              </h1>
              <p className="text-sm text-foreground/60 mt-1">
                {t("description")}
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" />
              {t("createButton")}
            </Button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <CategoryStatsCard
            totalCategories={stats.total}
            activeCategories={stats.active}
            deletedCategories={stats.deleted}
            hottestCategory={stats.hottest}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
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
                  <SelectItem value="topic_count">
                    {t("filter.sortByOptions.topicCount")}
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
        </motion.div>

        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-foreground/60"
          >
            {t("loading")}
          </motion.div>
        ) : !data || data.items.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 text-foreground/60"
          >
            {t("empty")}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
          >
            {data.items.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
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
        </motion.div>

        <CategoryDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          category={editingCategory}
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
      </div>
    </div>
  )
}
