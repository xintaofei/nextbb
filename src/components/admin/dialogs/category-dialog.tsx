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
import { Textarea } from "@/components/ui/textarea"
import { ColorPickerField } from "../fields/color-picker-field"
import { EmojiPickerField } from "@/components/common/emoji-picker-field"
import { useColorAutoFill } from "@/hooks/use-color-auto-fill"

type CategoryFormData = {
  name: string
  icon: string
  description: string | null
  bgColor: string | null
  textColor: string | null
  darkBgColor: string | null
  darkTextColor: string | null
}

type CategoryDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: {
    id: string
    name: string
    icon: string
    description: string | null
    bgColor: string | null
    textColor: string | null
    darkBgColor: string | null
    darkTextColor: string | null
  }
  onSubmit: (data: CategoryFormData) => Promise<void>
}

export function CategoryDialog({
  open,
  onOpenChange,
  category,
  onSubmit,
}: CategoryDialogProps) {
  const t = useTranslations("AdminCategories")
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    icon: "",
    description: "",
    bgColor: null,
    textColor: null,
    darkBgColor: null,
    darkTextColor: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 使用颜色自动填充 Hook
  const {
    handleLightBgChange,
    handleLightTextChange,
    handleDarkBgChange,
    handleDarkTextChange,
  } = useColorAutoFill(formData, setFormData)

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        icon: category.icon,
        description: category.description || "",
        bgColor: category.bgColor,
        textColor: category.textColor,
        darkBgColor: category.darkBgColor,
        darkTextColor: category.darkTextColor,
      })
    } else {
      setFormData({
        name: "",
        icon: "",
        description: "",
        bgColor: null,
        textColor: null,
        darkBgColor: null,
        darkTextColor: null,
      })
    }
  }, [category, open])

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
            {category ? t("dialog.editTitle") : t("dialog.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">{t("dialog.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder={t("dialog.namePlaceholder")}
                required
                maxLength={32}
              />
            </div>

            <div className="space-y-2">
              <EmojiPickerField
                label={t("dialog.icon")}
                value={formData.icon}
                onChange={(emoji) =>
                  setFormData({ ...formData, icon: emoji || "" })
                }
                placeholder={t("dialog.iconPlaceholder")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t("dialog.description")}</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={t("dialog.descriptionPlaceholder")}
                maxLength={255}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                {t("dialog.lightModeColors")}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ColorPickerField
                  label={t("dialog.bgColor")}
                  value={formData.bgColor}
                  onChange={handleLightBgChange}
                  placeholder={t("dialog.bgColorPlaceholder")}
                />

                <ColorPickerField
                  label={t("dialog.textColor")}
                  value={formData.textColor}
                  onChange={handleLightTextChange}
                  placeholder={t("dialog.textColorPlaceholder")}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                {t("dialog.darkModeColors")}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <ColorPickerField
                  label={t("dialog.darkBgColor")}
                  value={formData.darkBgColor}
                  onChange={handleDarkBgChange}
                  placeholder={t("dialog.darkBgColorPlaceholder")}
                />

                <ColorPickerField
                  label={t("dialog.darkTextColor")}
                  value={formData.darkTextColor}
                  onChange={handleDarkTextChange}
                  placeholder={t("dialog.darkTextColorPlaceholder")}
                />
              </div>
            </div>

            {(formData.bgColor ||
              formData.textColor ||
              formData.darkBgColor ||
              formData.darkTextColor) && (
              <div className="space-y-2">
                <Label>{t("dialog.colorPreview")}</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="space-y-1 p-4 bg-background border rounded-lg">
                    <span className="text-xs text-muted-foreground">
                      {t("dialog.lightPreview")}
                    </span>
                    <div
                      className="h-14 rounded-lg border border-border/40 flex items-center justify-center text-lg font-semibold"
                      style={{
                        backgroundColor: formData.bgColor || "transparent",
                        color: formData.textColor || "inherit",
                      }}
                    >
                      {(formData.icon || "") + " " + (formData.name || "预览")}
                    </div>
                  </div>
                  <div className="space-y-1 p-4 bg-primary border rounded-lg">
                    <span className="text-xs text-muted">
                      {t("dialog.darkPreview")}
                    </span>
                    <div
                      className="h-14 rounded-lg border border-border/40 flex items-center justify-center text-lg font-semibold bg-zinc-900"
                      style={{
                        backgroundColor:
                          formData.darkBgColor || formData.bgColor || undefined,
                        color:
                          formData.darkTextColor ||
                          formData.textColor ||
                          "#e4e4e7",
                      }}
                    >
                      {(formData.icon || "") + " " + (formData.name || "预览")}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              {t("dialog.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {t("dialog.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
