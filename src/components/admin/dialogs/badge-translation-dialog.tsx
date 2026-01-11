"use client"

import { useState } from "react"
import useSWR from "swr"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Edit2, Globe } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

type Translation = {
  locale: string
  name: string
  description: string
  isSource: boolean
  isTranslated: boolean
}

type TranslationsResponse = {
  sourceLocale: string
  translations: Translation[]
}

type BadgeTranslationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  badgeId: string | null
}

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export function BadgeTranslationDialog({
  open,
  onOpenChange,
  badgeId,
}: BadgeTranslationDialogProps) {
  const t = useTranslations("AdminBadges")
  const tAdmin = useTranslations("Admin")
  const { data, isLoading, mutate } = useSWR<TranslationsResponse>(
    open && badgeId ? `/api/admin/badges/${badgeId}/translations` : null,
    fetcher
  )

  const [editingLocale, setEditingLocale] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: "", description: "" })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleEdit = (translation: Translation) => {
    setEditingLocale(translation.locale)
    setFormData({
      name: translation.name,
      description: translation.description,
    })
  }

  const handleCancelEdit = () => {
    setEditingLocale(null)
    setFormData({ name: "", description: "" })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!badgeId || !editingLocale) return

    setIsSubmitting(true)
    try {
      const res = await fetch(`/api/admin/badges/${badgeId}/translations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          locale: editingLocale,
          ...formData,
        }),
      })

      if (res.ok) {
        toast.success(t("message.updateSuccess"))
        await mutate()
        handleCancelEdit()
      } else {
        const errorData = await res.json()
        toast.error(errorData.error || t("message.updateError"))
      }
    } catch {
      toast.error(t("message.updateError"))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {tAdmin("translationDialog.title")}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : !data ? (
          <div className="text-center py-8 text-muted-foreground">
            {t("empty")}
          </div>
        ) : (
          <ScrollArea className="flex-1 -mx-6 px-6">
            <div className="space-y-4 py-4">
              {data.translations.map((item) => (
                <div
                  key={item.locale}
                  className={cn(
                    "rounded-xl border p-4 transition-all",
                    item.isSource
                      ? "bg-primary/5 border-primary/20"
                      : "bg-card border-border/50",
                    editingLocale === item.locale && "ring-2 ring-primary/20"
                  )}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold font-mono">
                          {item.locale}
                        </span>
                        {item.isSource && (
                          <Badge variant="default" className="text-xs">
                            {tAdmin("translationDialog.sourceLanguage")}
                          </Badge>
                        )}
                        {item.isTranslated ? (
                          <Badge
                            variant="outline"
                            className="text-xs text-green-600 border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-900/50 dark:text-green-400"
                          >
                            {tAdmin("translationDialog.translated")}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="text-xs text-muted-foreground"
                          >
                            {tAdmin("translationDialog.missing")}
                          </Badge>
                        )}
                      </div>
                      {!editingLocale && (
                        <div className="text-sm text-muted-foreground">
                          {item.name || (
                            <span className="italic opacity-50">
                              {tAdmin("translationDialog.noName")}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {editingLocale !== item.locale && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit2 className="h-4 w-4 mr-2" />
                        {tAdmin("translationDialog.edit")}
                      </Button>
                    )}
                  </div>

                  {editingLocale === item.locale && (
                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label>{tAdmin("translationDialog.name")}</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) =>
                            setFormData({ ...formData, name: e.target.value })
                          }
                          placeholder={t("dialog.namePlaceholder")}
                          maxLength={32}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>{tAdmin("translationDialog.description")}</Label>
                        <Textarea
                          value={formData.description}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              description: e.target.value,
                            })
                          }
                          placeholder={t("dialog.descriptionPlaceholder")}
                          maxLength={255}
                          rows={2}
                        />
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          disabled={isSubmitting}
                        >
                          {tAdmin("translationDialog.cancel")}
                        </Button>
                        <Button type="submit" size="sm" disabled={isSubmitting}>
                          {isSubmitting && (
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                          )}
                          {tAdmin("translationDialog.save")}
                        </Button>
                      </div>
                    </form>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  )
}
