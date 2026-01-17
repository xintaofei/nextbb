"use client"

import { useState, useMemo, useCallback } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { AdminPageContainer } from "@/components/admin/layout/admin-page-container"
import { AdminPageSection } from "@/components/admin/layout/admin-page-section"
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

import { LLMConfigCards } from "@/components/admin/cards/llm-config-cards"
import { LLMConfigDialog } from "@/components/admin/dialogs/llm-config-dialog"
import { LLMConfigDTO, LLMConfigFormData, LLMUsageRow } from "@/types/llm"

const fetcher = (url: string) => fetch(url).then((res) => res.json())

const USAGES = ["TRANSLATION", "CHAT", "SUMMARIZATION"]

export default function LLMConfigsPage() {
  const t = useTranslations("AdminLLMConfigs")
  const { data, error, mutate } = useSWR<{ items: LLMConfigDTO[] }>(
    "/api/admin/llm-configs",
    fetcher
  )

  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingConfig, setEditingConfig] = useState<LLMConfigDTO | undefined>(
    undefined
  )
  const [defaultUsage, setDefaultUsage] = useState<string | undefined>(
    undefined
  )

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [configToDelete, setConfigToDelete] = useState<LLMConfigDTO | null>(
    null
  )

  const handleConfigure = useCallback(
    (usage: string, config: LLMConfigDTO | null) => {
      setEditingConfig(config || undefined)
      setDefaultUsage(usage)
      setDialogOpen(true)
    },
    []
  )

  const handleDeleteClick = useCallback((config: LLMConfigDTO) => {
    setConfigToDelete(config)
    setDeleteDialogOpen(true)
  }, [])

  const handleConfirmDelete = async () => {
    if (!configToDelete) return

    try {
      const res = await fetch(`/api/admin/llm-configs/${configToDelete.id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Failed to delete")

      toast.success(t("message.deleteSuccess"))
      mutate()
    } catch {
      toast.error(t("message.deleteError"))
    } finally {
      setDeleteDialogOpen(false)
      setConfigToDelete(null)
    }
  }

  const handleSubmit = async (formData: LLMConfigFormData) => {
    try {
      const url = editingConfig
        ? `/api/admin/llm-configs/${editingConfig.id}`
        : "/api/admin/llm-configs"

      const method = editingConfig ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Failed to save")
      }

      toast.success(
        editingConfig ? t("message.updateSuccess") : t("message.createSuccess")
      )
      mutate()
    } catch (error) {
      toast.error(
        editingConfig ? t("message.updateError") : t("message.createError")
      )
      console.error(error)
      throw error // Re-throw to keep dialog open if needed
    }
  }

  const isLoading = !data && !error

  // Construct table data: merge fixed usages with existing configs
  const tableData: LLMUsageRow[] = useMemo(
    () =>
      USAGES.map((usage) => {
        const config = data?.items.find((item) => item.usage === usage) || null
        return { usage, config }
      }),
    [data]
  )

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
        </div>
      </AdminPageSection>

      <div className="mt-8">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          <LLMConfigCards
            data={tableData}
            onConfigure={handleConfigure}
            onDelete={handleDeleteClick}
          />
        )}
      </div>

      <LLMConfigDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        config={editingConfig}
        defaultUsage={defaultUsage}
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
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t("deleteConfirm.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminPageContainer>
  )
}
