"use client"

import { useState } from "react"
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
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import type { Translation } from "@/types/expression"

type ExpressionTranslationDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  expressionId: string
  sourceLocale: string
  translations: Translation[]
  onSave: (locale: string, name: string) => Promise<void>
}

export function ExpressionTranslationDialog({
  open,
  onOpenChange,
  translations,
  onSave,
}: ExpressionTranslationDialogProps) {
  const t = useTranslations("AdminExpressions")
  const [editingLocale, setEditingLocale] = useState<string | null>(null)
  const [editingName, setEditingName] = useState("")
  const [isSaving, setIsSaving] = useState(false)

  const handleEdit = (locale: string, currentName: string) => {
    setEditingLocale(locale)
    setEditingName(currentName)
  }

  const handleSave = async () => {
    if (!editingLocale) return
    setIsSaving(true)
    try {
      await onSave(editingLocale, editingName)
      setEditingLocale(null)
      setEditingName("")
    } finally {
      setIsSaving(false)
    }
  }

  const handleCancel = () => {
    setEditingLocale(null)
    setEditingName("")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen max-sm:h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("translationDialog.expressionTitle")}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {translations.map((translation) => (
            <div
              key={translation.locale}
              className="flex items-center gap-3 p-3 rounded-lg border border-border/40 bg-muted/30"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Label
                    className="font-medium"
                    htmlFor={`expr-trans-${translation.locale}`}
                  >
                    {translation.locale.toUpperCase()}
                  </Label>
                  {translation.isSource && (
                    <Badge variant="default" className="text-xs">
                      {t("translationDialog.sourceLanguage")}
                    </Badge>
                  )}
                  {translation.isTranslated && !translation.isSource && (
                    <Badge variant="secondary" className="text-xs">
                      {t("translationDialog.translated")}
                    </Badge>
                  )}
                  {!translation.isTranslated && !translation.isSource && (
                    <Badge variant="outline" className="text-xs">
                      {t("translationDialog.missing")}
                    </Badge>
                  )}
                </div>
                {editingLocale === translation.locale ? (
                  <Input
                    id={`expr-trans-${translation.locale}`}
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    placeholder={t("translationDialog.name")}
                    className="mt-2"
                    maxLength={32}
                    autoFocus
                  />
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">
                    {translation.name || t("translationDialog.noName")}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {editingLocale === translation.locale ? (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleCancel}
                      disabled={isSaving}
                    >
                      {t("translationDialog.cancel")}
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={isSaving || !editingName}
                    >
                      {isSaving && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {t("translationDialog.save")}
                    </Button>
                  </>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleEdit(translation.locale, translation.name)
                    }
                  >
                    {t("translationDialog.edit")}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
