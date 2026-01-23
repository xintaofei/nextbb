"use client"

import { useState } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { AdminPageContainer } from "@/components/admin/layout/admin-page-container"
import { AdminPageSection } from "@/components/admin/layout/admin-page-section"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  SocialProviderCard,
  SocialProviderItem,
} from "@/components/admin/cards/social-provider-card"
import { SocialProviderDialog } from "@/components/admin/dialogs/social-provider-dialog"
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

const fetcher = async (url: string): Promise<SocialProviderItem[]> => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    throw new Error("failed")
  }
  return res.json()
}

export default function AdminSocialProvidersPage() {
  const t = useTranslations("AdminSocialProviders")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingProvider, setEditingProvider] = useState<
    SocialProviderItem | undefined
  >(undefined)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const { data, isLoading, mutate } = useSWR<SocialProviderItem[]>(
    "/api/admin/social-providers",
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
    setDeletingId(id)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = async () => {
    if (!deletingId) return

    try {
      const res = await fetch(`/api/admin/social-providers/${deletingId}`, {
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

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch(`/api/admin/social-providers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled: enabled }),
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

  const handleSubmit = async (formData: {
    providerKey: string
    name: string
    clientId: string
    clientSecret: string
    authorizeUrl: string
    tokenUrl: string
    userinfoUrl: string
    wellKnownUrl: string
    scope: string
    icon: string
    sort: number
    isEnabled: boolean
  }) => {
    try {
      const url = editingProvider
        ? `/api/admin/social-providers/${editingProvider.id}`
        : "/api/admin/social-providers"
      const method = editingProvider ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
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
        <AdminPageSection
          delay={0.1}
          className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
        >
          {data.map((provider) => (
            <SocialProviderCard
              key={provider.id}
              provider={provider}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onToggleEnabled={handleToggleEnabled}
            />
          ))}
        </AdminPageSection>
      )}

      <SocialProviderDialog
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
