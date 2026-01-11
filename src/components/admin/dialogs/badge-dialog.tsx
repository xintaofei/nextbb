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
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ColorPickerField } from "../fields/color-picker-field"
import { EmojiPickerField } from "../fields/emoji-picker-field"

type BadgeFormData = {
  name: string
  icon: string
  description: string | null
  badgeType: string
  level: number
  sort: number
  bgColor: string | null
  textColor: string | null
  isEnabled: boolean
  isVisible: boolean
}

type BadgeDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  badge?: {
    id: string
    name: string
    icon: string
    description: string | null
    badgeType: string
    level: number
    sort: number
    bgColor: string | null
    textColor: string | null
    isEnabled: boolean
    isVisible: boolean
  }
  onSubmit: (data: BadgeFormData) => Promise<void>
}

export function BadgeDialog({
  open,
  onOpenChange,
  badge,
  onSubmit,
}: BadgeDialogProps) {
  const t = useTranslations("AdminBadges")
  const [formData, setFormData] = useState<BadgeFormData>({
    name: "",
    icon: "",
    description: "",
    badgeType: "achievement",
    level: 1,
    sort: 0,
    bgColor: null,
    textColor: null,
    isEnabled: true,
    isVisible: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (badge) {
      setFormData({
        name: badge.name,
        icon: badge.icon,
        description: badge.description || "",
        badgeType: badge.badgeType,
        level: badge.level,
        sort: badge.sort,
        bgColor: badge.bgColor,
        textColor: badge.textColor,
        isEnabled: badge.isEnabled,
        isVisible: badge.isVisible,
      })
    } else {
      setFormData({
        name: "",
        icon: "",
        description: "",
        badgeType: "achievement",
        level: 1,
        sort: 0,
        bgColor: null,
        textColor: null,
        isEnabled: true,
        isVisible: true,
      })
    }
  }, [badge, open])

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

  const badgeTypes = [
    "achievement",
    "honor",
    "role",
    "event",
    "special",
  ] as const

  const badgeLevels = [1, 2, 3, 4, 5] as const

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen max-sm:h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {badge ? t("dialog.editTitle") : t("dialog.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* 徽章名称 */}
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

            {/* 图标和排序值 */}
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

            {/* 徽章描述 */}
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

            {/* 徽章类型和等级 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="badgeType">{t("dialog.badgeType")}</Label>
                <Select
                  value={formData.badgeType}
                  onValueChange={(value) =>
                    setFormData({ ...formData, badgeType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("dialog.badgeTypePlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {badgeTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {t(`badgeType.${type}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="level">{t("dialog.level")}</Label>
                <Select
                  value={String(formData.level)}
                  onValueChange={(value) =>
                    setFormData({ ...formData, level: parseInt(value) })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("dialog.levelPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent>
                    {badgeLevels.map((level) => (
                      <SelectItem key={level} value={String(level)}>
                        {t(`filter.levelOptions.${level}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 背景色和文字色 */}
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

            {/* 颜色预览 */}
            {(formData.bgColor || formData.textColor) && (
              <div className="space-y-2">
                <Label>{t("dialog.colorPreview")}</Label>
                <div
                  className="h-16 rounded-lg border border-border/40 flex items-center justify-center text-xl font-semibold"
                  style={{
                    backgroundColor: formData.bgColor || "transparent",
                    color: formData.textColor || "inherit",
                  }}
                >
                  {(formData.icon || "🏆") + " " + (formData.name || "预览")}
                </div>
              </div>
            )}

            {/* 状态开关 */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/60 p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isEnabled" className="text-base">
                    {t("dialog.isEnabled")}
                  </Label>
                </div>
                <Switch
                  id="isEnabled"
                  checked={formData.isEnabled}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isEnabled: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border/40 bg-background/60 p-4">
                <div className="space-y-0.5">
                  <Label htmlFor="isVisible" className="text-base">
                    {t("dialog.isVisible")}
                  </Label>
                </div>
                <Switch
                  id="isVisible"
                  checked={formData.isVisible}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isVisible: checked })
                  }
                />
              </div>
            </div>
          </div>

          {/* 操作按钮 */}
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
