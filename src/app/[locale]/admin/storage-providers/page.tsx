"use client"

import { useState } from "react"
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
} from "@dnd-kit/sortable"
import { AdminPageContainer } from "@/components/admin/layout/admin-page-container"
import { AdminPageSection } from "@/components/admin/layout/admin-page-section"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StorageProviderDTO } from "@/types/storage-provider"
import { StorageProviderListItem } from "@/components/admin/lists/storage-provider-list-item"
import { StorageProviderDialog } from "@/components/admin/dialogs/storage-provider-dialog"
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

const fetcher = async (url: string): Promise<StorageProviderDTO[]> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    throw new Error("failed")
  }
  return res.json()
}

export default function AdminStorageProvidersPage() {
  const t = useTranslations("AdminStorageProviders")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<
    StorageProviderDTO | undefined
  >(undefined)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const { data, isLoading, mutate } = useSWR<StorageProviderDTO[]>(
    "/api/admin/storage-providers",
    fetcher
  )

  const handleCreate = () => {
    setEditingProvider(undefined)
    setDialogOpen(true)
  }

  const handleEdit = (id: string) => {
    const provider = data?.find((p) => p.id === id)
    if (provider) {
      setEditingProvider(provider)
      setDialogOpen(true)
    }
  }

  const handleDelete = (id: string) => {
    const provider = data?.find((p) => p.id === id)
    if (provider?.isDefault) {
      toast.error(t("deleteDialog.cannotDeleteDefault"))
      return
    }
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingId) return

    try {
      const res = await fetch(`/api/admin/storage-providers/${deletingId}`, {
        method: "DELETE",
      })

      if (res.ok) {
        toast.success(t("message.deleteSuccess"))
        await mutate()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || t("message.deleteError"))
      }
    } catch {
      toast.error(t("message.deleteError"))
    } finally {
      setDeleteDialogOpen(false)
      setDeletingId(null)
    }
  }

  const handleToggleActive = async (id: string, active: boolean) => {
    const provider = data?.find((p) => p.id === id)
    if (provider?.isDefault && !active) {
      toast.error(t("message.cannotDisableDefault"))
      return
    }

    try {
      const res = await fetch(`/api/admin/storage-providers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: active }),
      })

      if (res.ok) {
        toast.success(t("message.updateSuccess"))
        await mutate()
      } else {
        toast.error(t("message.updateError"))
      }
    } catch {
      toast.error(t("message.updateError"))
    }
  }

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch("/api/admin/storage-providers/set-default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      })

      if (res.ok) {
        toast.success(t("message.setDefaultSuccess"))
        await mutate()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || t("message.setDefaultError"))
      }
    } catch {
      toast.error(t("message.setDefaultError"))
    }
  }

  const handleSubmit = async (formData: {
    name: string
    providerType: string
    config: Record<string, unknown>
    baseUrl: string
    isActive: boolean
    maxFileSize: string
    allowedTypes: string
  }) => {
    try {
      const url = editingProvider
        ? `/api/admin/storage-providers/${editingProvider.id}`
        : "/api/admin/storage-providers"
      const method = editingProvider ? "PATCH" : "POST"

      const maxFileSizeNum = formData.maxFileSize
        ? parseFloat(formData.maxFileSize)
        : undefined

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          maxFileSize: maxFileSizeNum,
        }),
      })

      if (res.ok) {
        toast.success(
          editingProvider
            ? t("message.updateSuccess")
            : t("message.createSuccess")
        )
        await mutate()
        setDialogOpen(false)
      } else {
        const errorData = await res.json()
        toast.error(
          errorData.error ||
            (editingProvider
              ? t("message.updateError")
              : t("message.createError"))
        )
      }
    } catch {
      toast.error(
        editingProvider ? t("message.updateError") : t("message.createError")
      )
    }
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeId = String(active.id)
    const overId = String(over.id)

    const oldIndex = data?.findIndex((p) => p.id === activeId) ?? -1
    const newIndex = data?.findIndex((p) => p.id === overId) ?? -1

    if (oldIndex === -1 || newIndex === -1 || !data) return

    const newItems = arrayMove(data, oldIndex, newIndex)

    try {
      setIsReordering(true)
      await mutate(newItems, false)

      const itemsWithSort = newItems.map((item, index) => ({
        id: item.id,
        sort: index,
      }))

      const res = await fetch("/api/admin/storage-providers/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: itemsWithSort }),
      })

      if (res.ok) {
        toast.success(t("message.reorderSuccess"))
        await mutate()
      } else {
        toast.error(t("message.reorderError"))
        await mutate()
      }
    } catch {
      toast.error(t("message.reorderError"))
      await mutate()
    } finally {
      setIsReordering(false)
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

      {isLoading ? (
        <div className="text-center py-12 text-foreground/60">
          {t("loading")}
        </div>
      ) : !data || data.length === 0 ? (
        <AdminPageSection
          delay={0.1}
          className="text-center py-12 text-foreground/60"
        >
          {t("empty")}
        </AdminPageSection>
      ) : (
        <AdminPageSection delay={0.1} className="space-y-4">
          <div className="text-sm text-muted-foreground mb-2">
            {t("list.dragHint")}
          </div>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={data.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              {data.map((provider) => (
                <StorageProviderListItem
                  key={provider.id}
                  provider={provider}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onToggleActive={handleToggleActive}
                  onSetDefault={handleSetDefault}
                  disabled={isReordering}
                />
              ))}
            </SortableContext>
          </DndContext>
        </AdminPageSection>
      )}

      <StorageProviderDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        provider={editingProvider}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDialog.title")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDialog.description")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("deleteDialog.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("deleteDialog.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageContainer>
  )
}
