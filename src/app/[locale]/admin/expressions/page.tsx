"use client"

import { useMemo, useState } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  rectSortingStrategy,
} from "@dnd-kit/sortable"
import { AdminPageContainer } from "@/components/admin/layout/admin-page-container"
import { AdminPageSection } from "@/components/admin/layout/admin-page-section"
import { Search, Plus } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ExpressionStatsCard } from "@/components/admin/stats/expression-stats-card"
import { ExpressionGroupListItem } from "@/components/admin/lists/expression-group-list-item"
import { ExpressionCard } from "@/components/admin/cards/expression-card"
import { ExpressionGroupDialog } from "@/components/admin/dialogs/expression-group-dialog"
import { ExpressionDialog } from "@/components/admin/dialogs/expression-dialog"
import { ExpressionGroupTranslationDialog } from "@/components/admin/dialogs/expression-group-translation-dialog"
import { ExpressionTranslationDialog } from "@/components/admin/dialogs/expression-translation-dialog"
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
import type {
  ExpressionGroup,
  Expression,
  ExpressionGroupListResult,
  ExpressionListResult,
  ExpressionGroupFormData,
  ExpressionFormData,
} from "@/types/expression"

const fetcher = async <T,>(url: string): Promise<T> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    throw new Error("failed")
  }
  return res.json()
}

// Hook for fetching expressions by group ID
function useGroupExpressions(
  groupId: string | null,
  enabled: string | undefined,
  sortBy: string
) {
  const query = useMemo(() => {
    if (!groupId) return null
    const params = new URLSearchParams()
    params.set("pageSize", "1000")
    params.set("groupId", groupId)
    if (typeof enabled === "string") params.set("enabled", enabled)
    params.set("sortBy", sortBy)
    return `/api/admin/expressions?${params.toString()}`
  }, [groupId, enabled, sortBy])

  return useSWR<ExpressionListResult>(query, fetcher<ExpressionListResult>, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
  })
}

export default function AdminExpressionsPage() {
  const t = useTranslations("AdminExpressions")
  const [q, setQ] = useState("")
  const [enabled, setEnabled] = useState<string | undefined>(undefined)
  const [sortBy, setSortBy] = useState("sort")

  // 管理展开的分组
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  // Dialog states
  const [groupDialogOpen, setGroupDialogOpen] = useState(false)
  const [expressionDialogOpen, setExpressionDialogOpen] = useState(false)
  const [editingGroup, setEditingGroup] = useState<ExpressionGroup | undefined>(
    undefined
  )
  const [editingExpression, setEditingExpression] = useState<
    Expression | undefined
  >(undefined)
  const [defaultGroupId, setDefaultGroupId] = useState<string | undefined>(
    undefined
  )

  // Delete dialogs
  const [deleteGroupDialogOpen, setDeleteGroupDialogOpen] = useState(false)
  const [deleteExpressionDialogOpen, setDeleteExpressionDialogOpen] =
    useState(false)
  const [deletingGroupId, setDeletingGroupId] = useState<string | null>(null)
  const [deletingExpressionId, setDeletingExpressionId] = useState<
    string | null
  >(null)

  // Translation dialogs
  const [groupTranslationDialogOpen, setGroupTranslationDialogOpen] =
    useState(false)
  const [expressionTranslationDialogOpen, setExpressionTranslationDialogOpen] =
    useState(false)
  const [translatingGroupId, setTranslatingGroupId] = useState<string | null>(
    null
  )
  const [translatingExpressionId, setTranslatingExpressionId] = useState<
    string | null
  >(null)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const groupsQuery = useMemo(() => {
    const params = new URLSearchParams()
    params.set("pageSize", "100")
    if (q.trim().length > 0) params.set("q", q.trim())
    if (typeof enabled === "string") params.set("enabled", enabled)
    params.set("sortBy", sortBy)
    return `/api/admin/expression-groups?${params.toString()}`
  }, [q, enabled, sortBy])

  const {
    data: groupsData,
    isLoading: groupsLoading,
    mutate: mutateGroups,
  } = useSWR<ExpressionGroupListResult>(
    groupsQuery,
    fetcher<ExpressionGroupListResult>
  )

  // 只为统计数据获取表情总数
  const statsQuery = useMemo(() => {
    const params = new URLSearchParams()
    params.set("pageSize", "1")
    if (typeof enabled === "string") params.set("enabled", enabled)
    return `/api/admin/expressions?${params.toString()}`
  }, [enabled])

  const { data: statsData } = useSWR<ExpressionListResult>(
    statsQuery,
    fetcher<ExpressionListResult>,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  )

  const stats = useMemo(() => {
    if (!groupsData) {
      return {
        totalGroups: 0,
        totalExpressions: 0,
        imageExpressions: 0,
        textExpressions: 0,
      }
    }

    return {
      totalGroups: groupsData.total,
      totalExpressions: statsData?.total ?? 0,
      imageExpressions: statsData?.total ?? 0,
      textExpressions: 0,
    }
  }, [groupsData, statsData])

  // Group handlers
  const handleCreateGroup = () => {
    setEditingGroup(undefined)
    setGroupDialogOpen(true)
  }

  const handleEditGroup = (id: string) => {
    const group = groupsData?.items.find((g) => g.id === id)
    if (group) {
      setEditingGroup(group)
      setGroupDialogOpen(true)
    }
  }

  const handleDeleteGroup = (id: string) => {
    setDeletingGroupId(id)
    setDeleteGroupDialogOpen(true)
  }

  const handleToggleGroupEnabled = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/expression-groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: enabled }),
      })

      if (res.ok) {
        toast.success(t("message.updateGroupSuccess"))
        await mutateGroups()
      } else {
        toast.error(t("message.updateGroupError"))
      }
    } catch {
      toast.error(t("message.updateGroupError"))
    }
  }

  const handleManageGroupTranslations = (id: string) => {
    setTranslatingGroupId(id)
    setGroupTranslationDialogOpen(true)
  }

  const confirmDeleteGroup = async () => {
    if (!deletingGroupId) return

    try {
      const res = await fetch(
        `/api/admin/expression-groups/${deletingGroupId}`,
        {
          method: "DELETE",
        }
      )

      if (res.ok) {
        toast.success(t("message.deleteGroupSuccess"))
        await mutateGroups()
        setDeleteGroupDialogOpen(false)
        setDeletingGroupId(null)
      } else {
        toast.error(t("message.deleteGroupError"))
      }
    } catch {
      toast.error(t("message.deleteGroupError"))
    }
  }

  const handleSubmitGroup = async (formData: ExpressionGroupFormData) => {
    try {
      const url = editingGroup
        ? `/api/admin/expression-groups/${editingGroup.id}`
        : "/api/admin/expression-groups"
      const method = editingGroup ? "PATCH" : "POST"

      // 如果是创建，自动计算排序值（排到最后）
      const submitData = { ...formData }
      if (!editingGroup && groupsData) {
        const maxSort = Math.max(0, ...groupsData.items.map((g) => g.sort))
        submitData.sort = maxSort + 1
      }

      // iconId 字段直接保存表情 ID，如果是 "__none__" 则设为 null
      if (submitData.iconId === "__none__") {
        submitData.iconId = null
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submitData),
      })

      if (res.ok) {
        toast.success(
          editingGroup
            ? t("message.updateGroupSuccess")
            : t("message.createGroupSuccess")
        )
        await mutateGroups()
        setGroupDialogOpen(false)
      } else {
        toast.error(
          editingGroup
            ? t("message.updateGroupError")
            : t("message.createGroupError")
        )
      }
    } catch {
      toast.error(
        editingGroup
          ? t("message.updateGroupError")
          : t("message.createGroupError")
      )
    }
  }

  // Expression handlers
  const handleAddExpression = (groupId: string) => {
    setDefaultGroupId(groupId)
    setEditingExpression(undefined)
    setExpressionDialogOpen(true)
  }

  const handleEditExpression = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/expressions/${id}`)
      if (res.ok) {
        const expression = (await res.json()) as Expression
        setEditingExpression(expression)
        setExpressionDialogOpen(true)
      }
    } catch {
      toast.error(t("message.fetchExpressionError"))
    }
  }

  const handleDeleteExpression = (id: string) => {
    setDeletingExpressionId(id)
    setDeleteExpressionDialogOpen(true)
  }

  const handleManageExpressionTranslations = (id: string) => {
    setTranslatingExpressionId(id)
    setExpressionTranslationDialogOpen(true)
  }

  const confirmDeleteExpression = async () => {
    if (!deletingExpressionId) return

    try {
      const res = await fetch(
        `/api/admin/expressions/${deletingExpressionId}`,
        {
          method: "DELETE",
        }
      )

      if (res.ok) {
        toast.success(t("message.deleteExpressionSuccess"))
        // 刷新所有展开的分组
        const { mutate: globalMutate } = await import("swr")
        await Promise.all(
          Array.from(expandedGroups).map((groupId) => {
            const params = new URLSearchParams()
            params.set("pageSize", "1000")
            params.set("groupId", groupId)
            if (typeof enabled === "string") params.set("enabled", enabled)
            params.set("sortBy", sortBy)
            const query = `/api/admin/expressions?${params.toString()}`
            return globalMutate(query)
          })
        )
        await mutateGroups()
        setDeleteExpressionDialogOpen(false)
        setDeletingExpressionId(null)
      } else {
        toast.error(t("message.deleteExpressionError"))
      }
    } catch {
      toast.error(t("message.deleteExpressionError"))
    }
  }

  const handleSubmitExpression = async (formData: ExpressionFormData) => {
    try {
      const url = editingExpression
        ? `/api/admin/expressions/${editingExpression.id}`
        : "/api/admin/expressions"
      const method = editingExpression ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        toast.success(
          editingExpression
            ? t("message.updateExpressionSuccess")
            : t("message.createExpressionSuccess")
        )
        // 刷新所有展开的分组
        const { mutate: globalMutate } = await import("swr")
        await Promise.all(
          Array.from(expandedGroups).map((groupId) => {
            const params = new URLSearchParams()
            params.set("pageSize", "1000")
            params.set("groupId", groupId)
            if (typeof enabled === "string") params.set("enabled", enabled)
            params.set("sortBy", sortBy)
            const query = `/api/admin/expressions?${params.toString()}`
            return globalMutate(query)
          })
        )
        await mutateGroups()
        setExpressionDialogOpen(false)
      } else {
        toast.error(
          editingExpression
            ? t("message.updateExpressionError")
            : t("message.createExpressionError")
        )
      }
    } catch {
      toast.error(
        editingExpression
          ? t("message.updateExpressionError")
          : t("message.createExpressionError")
      )
    }
  }

  // 切换分组展开状态
  const handleToggleGroup = (groupId: string, isOpen: boolean) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (isOpen) {
        next.add(groupId)
      } else {
        next.delete(groupId)
      }
      return next
    })
  }

  // 用于表情排序的组件
  function GroupExpressionsContent({ groupId }: { groupId: string }) {
    const {
      data: expressionsData,
      mutate: mutateGroupExpressions,
      isLoading,
    } = useGroupExpressions(
      expandedGroups.has(groupId) ? groupId : null,
      enabled,
      sortBy
    )

    const expressions = expressionsData?.items ?? []

    const handleDragEndLocal = async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const activeId = String(active.id)
      const overId = String(over.id)

      // Expression Reorder
      if (activeId.startsWith("expr-") && overId.startsWith("expr-")) {
        const oldIndex =
          expressions.findIndex((e) => `expr-${e.id}` === activeId) ?? -1
        const newIndex =
          expressions.findIndex((e) => `expr-${e.id}` === overId) ?? -1

        if (oldIndex !== -1 && newIndex !== -1) {
          const activeExpr = expressions[oldIndex]
          const overExpr = expressions[newIndex]

          // Only allow reordering within the same group
          if (activeExpr.groupId !== overExpr.groupId) return

          const newExpressions = arrayMove(expressions, oldIndex, newIndex)

          try {
            // Optimistic update
            await mutateGroupExpressions(
              {
                ...expressionsData,
                items: newExpressions,
              } as ExpressionListResult,
              false
            )

            const itemsWithSort = newExpressions.map((item, index) => ({
              id: item.id,
              sort: index,
            }))

            const res = await fetch("/api/admin/expressions/reorder", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items: itemsWithSort }),
            })

            if (res.ok) {
              toast.success(t("message.reorderExpressionSuccess"))
              await mutateGroupExpressions()
            } else {
              toast.error(t("message.reorderExpressionError"))
              await mutateGroupExpressions() // Revert
            }
          } catch {
            toast.error(t("message.reorderExpressionError"))
            await mutateGroupExpressions() // Revert
          }
        }
      }
    }

    // 显示 loading 状态
    if (isLoading) {
      return (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {t("loading")}
        </div>
      )
    }

    // 数据加载完成但没有表情
    if (expressions.length === 0) {
      return (
        <div className="text-center py-8 text-muted-foreground text-sm">
          {t("empty")}
        </div>
      )
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEndLocal}
      >
        <SortableContext
          items={expressions.map((e) => `expr-${e.id}`)}
          strategy={rectSortingStrategy}
        >
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {expressions.map((expression) => (
              <ExpressionCard
                key={expression.id}
                sortableId={`expr-${expression.id}`}
                expression={expression}
                onEdit={handleEditExpression}
                onDelete={handleDeleteExpression}
                onManageTranslations={handleManageExpressionTranslations}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    )
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    // Group Reorder
    if (activeId.startsWith("group-") && overId.startsWith("group-")) {
      const oldIndex =
        groupsData?.items.findIndex((g) => `group-${g.id}` === activeId) ?? -1
      const newIndex =
        groupsData?.items.findIndex((g) => `group-${g.id}` === overId) ?? -1

      if (oldIndex !== -1 && newIndex !== -1 && groupsData) {
        const newItems = arrayMove(groupsData.items, oldIndex, newIndex)

        try {
          // Optimistic update
          await mutateGroups(
            {
              ...groupsData,
              items: newItems,
            },
            false
          )

          const itemsWithSort = newItems.map((item, index) => ({
            id: item.id,
            sort: index,
          }))

          const res = await fetch("/api/admin/expression-groups/reorder", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: itemsWithSort }),
          })

          if (res.ok) {
            toast.success(t("message.reorderGroupSuccess"))
            await mutateGroups()
          } else {
            toast.error(t("message.reorderGroupError"))
            await mutateGroups() // Revert
          }
        } catch {
          toast.error(t("message.reorderGroupError"))
          await mutateGroups() // Revert
        }
      }
    }
  }

  const deletingGroup = groupsData?.items.find((g) => g.id === deletingGroupId)

  return (
    <AdminPageContainer>
      {/* Title and Actions */}
      <AdminPageSection delay={0}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
            <p className="text-muted-foreground mt-1">{t("description")}</p>
          </div>
          <Button onClick={handleCreateGroup}>
            <Plus className="mr-2 h-4 w-4" />
            {t("createGroupButton")}
          </Button>
        </div>
      </AdminPageSection>

      {/* Stats */}
      <AdminPageSection delay={0.1}>
        <ExpressionStatsCard
          totalGroups={stats.totalGroups}
          totalExpressions={stats.totalExpressions}
          imageExpressions={stats.imageExpressions}
          textExpressions={stats.textExpressions}
        />
      </AdminPageSection>

      {/* Filters */}
      <AdminPageSection delay={0.2}>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("searchPlaceholder")}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <Select
              value={enabled}
              onValueChange={(v) => setEnabled(v === "all" ? undefined : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder={t("filter.enabled.all")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter.enabled.all")}</SelectItem>
                <SelectItem value="true">
                  {t("filter.enabled.enabled")}
                </SelectItem>
                <SelectItem value="false">
                  {t("filter.enabled.disabled")}
                </SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sort">
                  {t("filter.sortByOptions.sort")}
                </SelectItem>
                <SelectItem value="updated_at">
                  {t("filter.sortByOptions.updatedAt")}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </AdminPageSection>

      {/* Groups List */}
      <AdminPageSection delay={0.3}>
        <div className="space-y-4">
          {groupsLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              {t("loading")}
            </div>
          ) : groupsData && groupsData.items.length > 0 ? (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={groupsData.items.map((g) => `group-${g.id}`)}
                strategy={verticalListSortingStrategy}
              >
                {groupsData.items.map((group) => {
                  return (
                    <ExpressionGroupListItem
                      key={group.id}
                      sortableId={`group-${group.id}`}
                      group={group}
                      expressions={[]}
                      onEdit={handleEditGroup}
                      onDelete={handleDeleteGroup}
                      onToggleEnabled={handleToggleGroupEnabled}
                      onManageTranslations={handleManageGroupTranslations}
                      onAddExpression={handleAddExpression}
                      isOpen={expandedGroups.has(group.id)}
                      onOpenChange={(isOpen) =>
                        handleToggleGroup(group.id, isOpen)
                      }
                    >
                      <GroupExpressionsContent groupId={group.id} />
                    </ExpressionGroupListItem>
                  )
                })}
              </SortableContext>
            </DndContext>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              {t("empty")}
            </div>
          )}
        </div>
      </AdminPageSection>

      {/* Dialogs */}
      <ExpressionGroupDialog
        open={groupDialogOpen}
        onOpenChange={setGroupDialogOpen}
        group={editingGroup}
        expressions={[]}
        onSubmit={handleSubmitGroup}
      />

      <ExpressionDialog
        open={expressionDialogOpen}
        onOpenChange={setExpressionDialogOpen}
        expression={editingExpression}
        groups={groupsData?.items || []}
        defaultGroupId={defaultGroupId}
        onSubmit={handleSubmitExpression}
      />

      <ExpressionGroupTranslationDialog
        open={groupTranslationDialogOpen}
        onOpenChange={setGroupTranslationDialogOpen}
        groupId={translatingGroupId}
      />

      <ExpressionTranslationDialog
        open={expressionTranslationDialogOpen}
        onOpenChange={setExpressionTranslationDialogOpen}
        expressionId={translatingExpressionId}
      />

      <AlertDialog
        open={deleteGroupDialogOpen}
        onOpenChange={setDeleteGroupDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirm.groupTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm.groupDescription", {
                count: deletingGroup?.expressionCount || 0,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteConfirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteGroup}>
              {t("deleteConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={deleteExpressionDialogOpen}
        onOpenChange={setDeleteExpressionDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("deleteConfirm.expressionTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirm.expressionDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteConfirm.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteExpression}>
              {t("deleteConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageContainer>
  )
}
