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

type TagFormData = {
  name: string
  icon: string
  description: string | null
  sort: number
  bgColor: string | null
  textColor: string | null
  darkBgColor: string | null
  darkTextColor: string | null
}

type TagDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  tag?: {
    id: string
    name: string
    icon: string
    description: string | null
    sort: number
    bgColor: string | null
    textColor: string | null
    darkBgColor: string | null
    darkTextColor: string | null
  }
  onSubmit: (data: TagFormData) => Promise<void>
}

export function TagDialog({
  open,
  onOpenChange,
  tag,
  onSubmit,
}: TagDialogProps) {
  const t = useTranslations("AdminTags")
  const [formData, setFormData] = useState<TagFormData>({
    name: "",
    icon: "",
    description: "",
    sort: 0,
    bgColor: null,
    textColor: null,
    darkBgColor: null,
    darkTextColor: null,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (tag) {
      setFormData({
        name: tag.name,
        icon: tag.icon,
        description: tag.description || "",
        sort: tag.sort,
        bgColor: tag.bgColor,
        textColor: tag.textColor,
        darkBgColor: tag.darkBgColor,
        darkTextColor: tag.darkTextColor,
      })
    } else {
      setFormData({
        name: "",
        icon: "",
        description: "",
        sort: 0,
        bgColor: null,
        textColor: null,
        darkBgColor: null,
        darkTextColor: null,
      })
    }
  }, [tag, open])

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
            {tag ? t("dialog.editTitle") : t("dialog.createTitle")}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <EmojiPickerField
                label={t("dialog.icon")}
                value={formData.icon}
                onChange={(emoji) =>
                  setFormData({ ...formData, icon: emoji || "" })
                }
                placeholder={t("dialog.iconPlaceholder")}
              />

              <div className="space-y-2">
                <Label htmlFor="sort">{t("dialog.sortValue")}</Label>
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

            <div className="space-y-2">
              <Label htmlFor="description">{t("dialog.description")}</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder={t("dialog.descriptionPlaceholder")}
                maxLength={256}
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
                  onChange={(color) =>
                    setFormData({ ...formData, bgColor: color })
                  }
                  placeholder={t("dialog.bgColorPlaceholder")}
                />

                <ColorPickerField
                  label={t("dialog.textColor")}
                  value={formData.textColor}
                  onChange={(color) =>
                    setFormData({ ...formData, textColor: color })
                  }
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
                  onChange={(color) =>
                    setFormData({ ...formData, darkBgColor: color })
                  }
                  placeholder={t("dialog.darkBgColorPlaceholder")}
                />

                <ColorPickerField
                  label={t("dialog.darkTextColor")}
                  value={formData.darkTextColor}
                  onChange={(color) =>
                    setFormData({ ...formData, darkTextColor: color })
                  }
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
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
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">
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
