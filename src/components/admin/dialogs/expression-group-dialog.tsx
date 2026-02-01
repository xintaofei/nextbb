"use client"

import { useState, useEffect } from "react"
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
import { EmojiPickerField } from "@/components/common/emoji-picker-field"
import type {
  ExpressionGroup,
  ExpressionGroupFormData,
} from "@/types/expression"

type ExpressionGroupDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: Pick<ExpressionGroup, "id" | "code" | "name" | "icon" | "sort">
  onSubmit: (data: ExpressionGroupFormData) => Promise<void>
}

export function ExpressionGroupDialog({
  open,
  onOpenChange,
  group,
  onSubmit,
}: ExpressionGroupDialogProps) {
  const t = useTranslations("AdminExpressions")
  const [formData, setFormData] = useState<ExpressionGroupFormData>({
    code: "",
    name: "",
    icon: null,
    sort: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (group) {
      setFormData({
        code: group.code,
        name: group.name,
        icon: group.icon,
        sort: group.sort,
      })
    } else {
      setFormData({
        code: "",
        name: "",
        icon: null,
        sort: 0,
      })
    }
  }, [group, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen max-sm:h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {group ? t("groupDialog.editTitle") : t("groupDialog.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Code field - only editable when creating */}
            <div className="space-y-2">
              <Label htmlFor="code">{t("groupDialog.code")}</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) =>
                  setFormData({ ...formData, code: e.target.value })
                }
                placeholder={t("groupDialog.codePlaceholder")}
                required
                maxLength={32}
                disabled={!!group}
                pattern="[a-zA-Z0-9_]+"
              />
              {!group && (
                <p className="text-xs text-muted-foreground">
                  {t("groupDialog.codeHint")}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t("groupDialog.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={t("groupDialog.namePlaceholder")}
                required
                maxLength={32}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EmojiPickerField
                label={t("groupDialog.icon")}
                value={formData.icon || ""}
                onChange={(emoji) =>
                  setFormData({ ...formData, icon: emoji || null })
                }
                placeholder={t("groupDialog.iconPlaceholder")}
              />

              <div className="space-y-2">
                <Label htmlFor="sort">{t("groupDialog.sortValue")}</Label>
                <Input
                  id="sort"
                  type="number"
                  value={formData.sort}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      sort: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              {t("groupDialog.cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {t("groupDialog.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
