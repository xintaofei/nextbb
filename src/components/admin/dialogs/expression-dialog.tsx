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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ExpressionTypeToggle } from "../expression/expression-type-toggle"
import { ExpressionImageUploader } from "../expression/expression-image-uploader"
import type {
  Expression,
  ExpressionGroup,
  ExpressionFormData,
} from "@/types/expression"

type ExpressionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  expression?: Pick<
    Expression,
    | "id"
    | "groupId"
    | "code"
    | "name"
    | "type"
    | "imagePath"
    | "imageUrl"
    | "textContent"
    | "width"
    | "height"
    | "sort"
  >
  groups: Array<Pick<ExpressionGroup, "id" | "code" | "name">>
  defaultGroupId?: string
  onSubmit: (data: ExpressionFormData) => Promise<void>
}

export function ExpressionDialog({
  open,
  onOpenChange,
  expression,
  groups,
  defaultGroupId,
  onSubmit,
}: ExpressionDialogProps) {
  const t = useTranslations("AdminExpressions")
  const [formData, setFormData] = useState<ExpressionFormData>({
    groupId: defaultGroupId || "",
    code: "",
    name: "",
    type: "IMAGE",
    imagePath: null,
    textContent: null,
    width: null,
    height: null,
    sort: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)

  useEffect(() => {
    if (expression) {
      setFormData({
        groupId: expression.groupId,
        code: expression.code,
        name: expression.name,
        type: expression.type,
        imagePath: expression.imagePath,
        textContent: expression.textContent,
        width: expression.width,
        height: expression.height,
        sort: expression.sort,
      })
      setImageUrl(expression.imageUrl)
    } else {
      setFormData({
        groupId: defaultGroupId || "",
        code: "",
        name: "",
        type: "IMAGE",
        imagePath: null,
        textContent: null,
        width: null,
        height: null,
        sort: 0,
      })
      setImageUrl(null)
    }
  }, [expression, defaultGroupId, open])

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

  const selectedGroup = groups.find((g) => g.id === formData.groupId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen max-sm:h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {expression
              ? t("expressionDialog.editTitle")
              : t("expressionDialog.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Group Selection */}
            <div className="space-y-2">
              <Label htmlFor="group">{t("expressionDialog.selectGroup")}</Label>
              <Select
                value={formData.groupId}
                onValueChange={(value) =>
                  setFormData({ ...formData, groupId: value })
                }
                disabled={!!expression}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("expressionDialog.selectGroupPlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Code and Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">{t("expressionDialog.code")}</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) =>
                    setFormData({ ...formData, code: e.target.value })
                  }
                  placeholder={t("expressionDialog.codePlaceholder")}
                  required
                  maxLength={32}
                  disabled={!!expression}
                />
                {!expression && (
                  <p className="text-xs text-muted-foreground">
                    {t("expressionDialog.codeHint")}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">{t("expressionDialog.name")}</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={t("expressionDialog.namePlaceholder")}
                  required
                  maxLength={32}
                />
              </div>
            </div>

            {/* Type Toggle */}
            <div className="space-y-2">
              <Label>{t("expressionDialog.type")}</Label>
              <ExpressionTypeToggle
                value={formData.type}
                onChange={(type) => setFormData({ ...formData, type })}
                disabled={!!expression}
              />
            </div>

            {/* Type-specific fields */}
            {formData.type === "IMAGE" ? (
              <div className="space-y-2">
                <Label>{t("expressionDialog.uploadImage")}</Label>
                <ExpressionImageUploader
                  value={imageUrl}
                  onChange={(url, path, dimensions) => {
                    setImageUrl(url)
                    setFormData({
                      ...formData,
                      imagePath: path,
                      width: dimensions.width,
                      height: dimensions.height,
                    })
                  }}
                  groupCode={selectedGroup?.code || "default"}
                />
                {formData.width && formData.height && (
                  <div className="text-sm text-muted-foreground">
                    {t("expressionDialog.dimensions")}: {formData.width} ×{" "}
                    {formData.height}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="textContent">
                  {t("expressionDialog.textContent")}
                </Label>
                <Input
                  id="textContent"
                  value={formData.textContent || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, textContent: e.target.value })
                  }
                  placeholder={t("expressionDialog.textPlaceholder")}
                  required={formData.type === "TEXT"}
                  maxLength={64}
                />
              </div>
            )}

            {/* Sort Value */}
            <div className="space-y-2">
              <Label htmlFor="sort">{t("expressionDialog.sortValue")}</Label>
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

          <div className="flex items-center gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isSubmitting}
            >
              {t("expressionDialog.cancel")}
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {t("expressionDialog.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
