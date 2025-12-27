"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { Settings2, Search, Filter } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { TopicStatsCard } from "@/components/admin/topic-stats-card"
import { TopicTable } from "@/components/admin/topic-table"
import { TopicDialog } from "@/components/admin/topic-dialog"
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"

type TopicListItem = {
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
  }
  tags: Array<{
    id: string
    name: string
    icon: string
    bgColor: string | null
    textColor: string | null
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

type TopicListResult = {
  items: TopicListItem[]
  page: number
  pageSize: number
  total: number
}

type Category = {
  id: string
  name: string
  icon: string
}

type Tag = {
  id: string
  name: string
  icon: string
}

const fetcher = async (url: string): Promise<TopicListResult> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    throw new Error("failed")
  }
  return res.json()
}

const categoriesFetcher = async (url: string): Promise<Category[]> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return []
  const data = await res.json()
  return data.map((c: { id: string; name: string; icon: string }) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
  }))
}

const tagsFetcher = async (url: string): Promise<Tag[]> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) return []
  const data = await res.json()
  return data.map((t: { id: string; name: string; icon: string }) => ({
    id: t.id,
    name: t.name,
    icon: t.icon,
  }))
}

export default function AdminTopicsPage() {
  const t = useTranslations("AdminTopics")
  const [q, setQ] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(
    undefined
  )
  const [tagFilter, setTagFilter] = useState<string | undefined>(undefined)
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created_at")
  const [order, setOrder] = useState("desc")
  const [page, setPage] = useState(1)
  const pageSize = 20

  // 选中的主题IDs（批量操作）
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  // 列显示配置
  const [visibleColumns, setVisibleColumns] = useState({
    select: true,
    author: true,
    category: true,
    tags: true,
    stats: true,
    status: true,
    time: true,
  })

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTopic, setEditingTopic] = useState<TopicListItem | undefined>(
    undefined
  )
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [operatingId, setOperatingId] = useState<string | null>(null)
  const [operationType, setOperationType] = useState<
    "delete" | "restore" | null
  >(null)

  const query = useMemo(() => {
    const params = new URLSearchParams()
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    if (q.trim().length > 0) params.set("q", q.trim())
    if (categoryFilter) params.set("categoryId", categoryFilter)
    if (tagFilter) params.set("tagId", tagFilter)

    if (statusFilter === "pinned") {
      params.set("isPinned", "true")
    } else if (statusFilter === "community") {
      params.set("isCommunity", "true")
    } else if (statusFilter === "deleted") {
      params.set("isDeleted", "true")
    } else if (statusFilter === "normal") {
      params.set("isDeleted", "false")
    }

    params.set("sortBy", sortBy)
    params.set("order", order)
    return `/api/admin/topics?${params.toString()}`
  }, [q, categoryFilter, tagFilter, statusFilter, sortBy, order, page])

  const { data, isLoading, mutate } = useSWR<TopicListResult>(query, fetcher)
  const { data: categories } = useSWR<Category[]>(
    "/api/categories",
    categoriesFetcher
  )
  const { data: tags } = useSWR<Tag[]>("/api/tags", tagsFetcher)

  const stats = useMemo(() => {
    if (!data) return { total: 0, pinned: 0, community: 0, deleted: 0 }
    return {
      total: data.total,
      pinned: data.items.filter((t) => t.isPinned).length,
      community: data.items.filter((t) => t.isCommunity).length,
      deleted: data.items.filter((t) => t.isDeleted).length,
    }
  }, [data])

  const handleEdit = (id: string) => {
    const topic = data?.items.find((t) => t.id === id)
    if (topic) {
      setEditingTopic(topic)
      setDialogOpen(true)
    }
  }

  const handleDelete = (id: string) => {
    setOperatingId(id)
    setOperationType("delete")
    setConfirmDialogOpen(true)
  }

  const handleRestore = (id: string) => {
    setOperatingId(id)
    setOperationType("restore")
    setConfirmDialogOpen(true)
  }

  const confirmOperation = async () => {
    if (!operatingId) return

    try {
      const res = await fetch(`/api/admin/topics/${operatingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isDeleted: operationType === "delete",
        }),
      })

      if (res.ok) {
        toast.success(
          t(
            operationType === "delete"
              ? "message.deleteSuccess"
              : "message.restoreSuccess"
          )
        )
        await mutate()
      } else {
        toast.error(
          t(
            operationType === "delete"
              ? "message.deleteError"
              : "message.restoreError"
          )
        )
      }
    } catch {
      toast.error(
        t(
          operationType === "delete"
            ? "message.deleteError"
            : "message.restoreError"
        )
      )
    } finally {
      setConfirmDialogOpen(false)
      setOperatingId(null)
      setOperationType(null)
    }
  }

  const handleTogglePin = async (id: string, pinned: boolean) => {
    try {
      const res = await fetch(`/api/admin/topics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isPinned: pinned }),
      })

      if (res.ok) {
        toast.success(t(pinned ? "message.pinSuccess" : "message.unpinSuccess"))
        await mutate()
      } else {
        toast.error(t(pinned ? "message.pinError" : "message.unpinError"))
      }
    } catch {
      toast.error(t(pinned ? "message.pinError" : "message.unpinError"))
    }
  }

  const handleToggleCommunity = async (id: string, community: boolean) => {
    try {
      const res = await fetch(`/api/admin/topics/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isCommunity: community }),
      })

      if (res.ok) {
        toast.success(
          t(
            community
              ? "message.recommendSuccess"
              : "message.unrecommendSuccess"
          )
        )
        await mutate()
      } else {
        toast.error(
          t(community ? "message.recommendError" : "message.unrecommendError")
        )
      }
    } catch {
      toast.error(
        t(community ? "message.recommendError" : "message.unrecommendError")
      )
    }
  }

  const handleSubmit = async (formData: {
    title: string
    categoryId: string
    tagIds: string[]
    isPinned: boolean
    isCommunity: boolean
  }) => {
    try {
      if (editingTopic) {
        const res = await fetch(`/api/admin/topics/${editingTopic.id}`, {
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
      }
    } catch {
      toast.error(t("message.updateError"))
    }
  }

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setOrder(order === "asc" ? "desc" : "asc")
    } else {
      setSortBy(column)
      setOrder("desc")
    }
  }

  const handleColumnVisibilityChange = (
    column: keyof typeof visibleColumns,
    visible: boolean
  ) => {
    setVisibleColumns((prev) => ({ ...prev, [column]: visible }))
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return

    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/admin/topics/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isDeleted: true }),
          })
        )
      )
      toast.success(t("message.batchDeleteSuccess"))
      setSelectedIds([])
      await mutate()
    } catch {
      toast.error(t("message.batchDeleteError"))
    }
  }

  const handleBatchPin = async () => {
    if (selectedIds.length === 0) return

    try {
      await Promise.all(
        selectedIds.map((id) =>
          fetch(`/api/admin/topics/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ isPinned: true }),
          })
        )
      )
      toast.success(t("message.batchPinSuccess"))
      setSelectedIds([])
      await mutate()
    } catch {
      toast.error(t("message.batchPinError"))
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
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-sm text-foreground/60 mt-1">
              {t("description")}
            </p>
          </div>
        </motion.div>

        <TopicStatsCard
          totalTopics={stats.total}
          pinnedTopics={stats.pinned}
          communityTopics={stats.community}
          deletedTopics={stats.deleted}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur"
        >
          <div className="absolute inset-0 bg-linear-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

          <div className="relative space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-foreground/60" />
                <h2 className="text-sm font-semibold uppercase tracking-[0.25em] text-foreground">
                  {t("filter.title")}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {/* 批量操作 */}
                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-2 mr-4">
                    <span className="text-sm text-foreground/60">
                      {t("selected", { count: selectedIds.length })}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBatchPin}
                    >
                      {t("batchPin")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleBatchDelete}
                      className="text-destructive hover:text-destructive"
                    >
                      {t("batchDelete")}
                    </Button>
                  </div>
                )}

                {/* 列配置 */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings2 className="h-4 w-4 mr-2" />
                      {t("columns")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64" align="end">
                    <div className="space-y-4">
                      <h4 className="font-medium text-sm">
                        {t("columnsConfig")}
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="col-select" className="text-sm">
                            {t("table.selectColumn")}
                          </Label>
                          <Switch
                            id="col-select"
                            checked={visibleColumns.select}
                            onCheckedChange={(checked) =>
                              handleColumnVisibilityChange("select", checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="col-author" className="text-sm">
                            {t("table.author")}
                          </Label>
                          <Switch
                            id="col-author"
                            checked={visibleColumns.author}
                            onCheckedChange={(checked) =>
                              handleColumnVisibilityChange("author", checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="col-category" className="text-sm">
                            {t("table.category")}
                          </Label>
                          <Switch
                            id="col-category"
                            checked={visibleColumns.category}
                            onCheckedChange={(checked) =>
                              handleColumnVisibilityChange("category", checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="col-tags" className="text-sm">
                            {t("table.tags")}
                          </Label>
                          <Switch
                            id="col-tags"
                            checked={visibleColumns.tags}
                            onCheckedChange={(checked) =>
                              handleColumnVisibilityChange("tags", checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="col-stats" className="text-sm">
                            {t("table.stats")}
                          </Label>
                          <Switch
                            id="col-stats"
                            checked={visibleColumns.stats}
                            onCheckedChange={(checked) =>
                              handleColumnVisibilityChange("stats", checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="col-status" className="text-sm">
                            {t("table.status")}
                          </Label>
                          <Switch
                            id="col-status"
                            checked={visibleColumns.status}
                            onCheckedChange={(checked) =>
                              handleColumnVisibilityChange("status", checked)
                            }
                          />
                        </div>
                        <div className="flex items-center justify-between">
                          <Label htmlFor="col-time" className="text-sm">
                            {t("table.time")}
                          </Label>
                          <Switch
                            id="col-time"
                            checked={visibleColumns.time}
                            onCheckedChange={(checked) =>
                              handleColumnVisibilityChange("time", checked)
                            }
                          />
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
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
                value={categoryFilter ?? "all"}
                onValueChange={(value) =>
                  setCategoryFilter(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger className="bg-background/60 border-border/40 focus:border-border/60">
                  <SelectValue placeholder={t("filter.category.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("filter.category.all")}
                  </SelectItem>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={tagFilter ?? "all"}
                onValueChange={(value) =>
                  setTagFilter(value === "all" ? undefined : value)
                }
              >
                <SelectTrigger className="bg-background/60 border-border/40 focus:border-border/60">
                  <SelectValue placeholder={t("filter.tag.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filter.tag.all")}</SelectItem>
                  {tags?.map((tag) => (
                    <SelectItem key={tag.id} value={tag.id}>
                      {tag.icon} {tag.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-background/60 border-border/40 focus:border-border/60">
                  <SelectValue placeholder={t("filter.status.all")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("filter.status.all")}</SelectItem>
                  <SelectItem value="pinned">
                    {t("filter.status.pinned")}
                  </SelectItem>
                  <SelectItem value="community">
                    {t("filter.status.community")}
                  </SelectItem>
                  <SelectItem value="deleted">
                    {t("filter.status.deleted")}
                  </SelectItem>
                  <SelectItem value="normal">
                    {t("filter.status.normal")}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-background/60 border-border/40 focus:border-border/60">
                  <SelectValue placeholder={t("filter.sortBy")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="created_at">
                    {t("filter.sortByOptions.createdAt")}
                  </SelectItem>
                  <SelectItem value="updated_at">
                    {t("filter.sortByOptions.updatedAt")}
                  </SelectItem>
                  <SelectItem value="views">
                    {t("filter.sortByOptions.views")}
                  </SelectItem>
                  <SelectItem value="replies">
                    {t("filter.sortByOptions.replies")}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Select value={order} onValueChange={setOrder}>
                <SelectTrigger className="bg-background/60 border-border/40 focus:border-border/60">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">
                    {t("filter.orderOptions.desc")}
                  </SelectItem>
                  <SelectItem value="asc">
                    {t("filter.orderOptions.asc")}
                  </SelectItem>
                </SelectContent>
              </Select>

              <Button
                onClick={() => setPage(1)}
                className="sm:col-span-2 lg:col-span-1"
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
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <TopicTable
              topics={data.items}
              selectedIds={selectedIds}
              onSelectionChange={setSelectedIds}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onRestore={handleRestore}
              onTogglePin={handleTogglePin}
              onToggleCommunity={handleToggleCommunity}
              visibleColumns={visibleColumns}
              sortBy={sortBy}
              order={order as "asc" | "desc"}
              onSort={handleSort}
            />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
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

        <TopicDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          topic={editingTopic}
          categories={categories || []}
          tags={tags || []}
          onSubmit={handleSubmit}
        />

        <AlertDialog
          open={confirmDialogOpen}
          onOpenChange={setConfirmDialogOpen}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t(
                  operationType === "delete"
                    ? "deleteConfirm.title"
                    : "restoreConfirm.title"
                )}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t(
                  operationType === "delete"
                    ? "deleteConfirm.description"
                    : "restoreConfirm.description"
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t(
                  operationType === "delete"
                    ? "deleteConfirm.cancel"
                    : "restoreConfirm.cancel"
                )}
              </AlertDialogCancel>
              <AlertDialogAction onClick={confirmOperation}>
                {t(
                  operationType === "delete"
                    ? "deleteConfirm.confirm"
                    : "restoreConfirm.confirm"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  )
}
