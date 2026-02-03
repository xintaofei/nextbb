"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
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
import type {
  ExpressionGroup,
  ExpressionGroupFormData,
  Expression,
  ExpressionGroupSize,
} from "@/types/expression"
import {
  EXPRESSION_GROUP_SIZE_OPTIONS,
  getExpressionGroupSizePx,
} from "@/lib/expression-size"

type ExpressionGroupDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  group?: Pick<
    ExpressionGroup,
    "id" | "code" | "name" | "iconId" | "sort" | "expressionSize"
  >
  expressions?: Pick<Expression, "id" | "name" | "imageUrl" | "thumbnailUrl">[]
  onSubmit: (data: ExpressionGroupFormData) => Promise<void>
}

export function ExpressionGroupDialog({
  open,
  onOpenChange,
  group,
  expressions = [],
  onSubmit,
}: ExpressionGroupDialogProps) {
  const t = useTranslations("AdminExpressions")
  const [formData, setFormData] = useState<ExpressionGroupFormData>({
    code: "",
    name: "",
    iconId: null,
    expressionSize: "SMALL",
    sort: 0,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (group) {
      setFormData({
        code: group.code,
        name: group.name,
        iconId: group.iconId,
        expressionSize: group.expressionSize ?? "SMALL",
        sort: group.sort,
      })
    } else {
      setFormData({
        code: "",
        name: "",
        iconId: null,
        expressionSize: "SMALL",
        sort: 0,
      })
    }
  }, [group, open])

  const previewExpression =
    expressions.find((expr) => expr.id === formData.iconId) ??
    expressions[0] ??
    null
  const previewUrl =
    previewExpression?.thumbnailUrl || previewExpression?.imageUrl || ""
  const previewSizePx = getExpressionGroupSizePx(formData.expressionSize)

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

            <div className="space-y-2">
              <Label htmlFor="expressionSize">
                {t("groupDialog.expressionSize")}
              </Label>
              <Select
                value={formData.expressionSize}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    expressionSize: value as ExpressionGroupSize,
                  })
                }
              >
                <SelectTrigger id="expressionSize">
                  <SelectValue
                    placeholder={t("groupDialog.expressionSizePlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {EXPRESSION_GROUP_SIZE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t("groupDialog.expressionSizeHint")}
              </p>
              <div className="flex items-center gap-3 rounded-lg border border-dashed border-border/60 bg-muted/30 p-3">
                <div
                  className="flex items-center justify-center rounded-md border border-border/60 bg-background/70"
                  style={{ width: previewSizePx, height: previewSizePx }}
                >
                  {previewUrl ? (
                    <Image
                      src={previewUrl}
                      alt={previewExpression.name}
                      width={previewSizePx}
                      height={previewSizePx}
                      className="max-w-full max-h-full object-contain"
                    />
                  ) : (
                    <span className="text-sm leading-none">😀</span>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {t("groupDialog.expressionSizePreview", {
                    size: previewSizePx,
                  })}
                </div>
              </div>
            </div>

            {/* Icon field - only show when editing and has expressions */}
            {group && expressions.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="icon">{t("groupDialog.icon")}</Label>
                <Select
                  value={formData.iconId || "__none__"}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      iconId: value === "__none__" ? null : value,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={t("groupDialog.selectIconPlaceholder")}
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">
                      {t("groupDialog.noIcon")}
                    </SelectItem>
                    {expressions.map((expr) => {
                      const iconPreview =
                        expr.thumbnailUrl || expr.imageUrl || ""
                      return (
                        <SelectItem key={expr.id} value={expr.id}>
                          <div className="flex items-center gap-2">
                            {iconPreview && (
                              <Image
                                src={iconPreview}
                                alt={expr.name}
                                width={24}
                                height={24}
                                className="w-6 h-6 object-contain"
                              />
                            )}
                            <span>{expr.name}</span>
                          </div>
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("groupDialog.iconHint")}
                </p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
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
