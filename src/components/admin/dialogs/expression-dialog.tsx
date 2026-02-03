"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react"
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
    | "imagePath"
    | "imageUrl"
    | "width"
    | "height"
    | "sort"
    | "isAnimated"
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
    imagePath: "",
    width: null,
    height: null,
    isAnimated: false,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>("")

  // Code 唯一性检查状态
  const [isCheckingCode, setIsCheckingCode] = useState(false)
  const [codeExists, setCodeExists] = useState(false)
  const checkTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (expression) {
      setFormData({
        groupId: expression.groupId,
        code: expression.code,
        name: expression.name,
        imagePath: expression.imagePath,
        width: expression.width,
        height: expression.height,
        sort: expression.sort,
        isAnimated: expression.isAnimated,
      })
      setImageUrl(expression.imageUrl)
    } else {
      setFormData({
        groupId: defaultGroupId || "",
        code: "",
        name: "",
        imagePath: "",
        width: null,
        height: null,
        isAnimated: false,
      })
      setImageUrl("")
    }
    // 重置检查状态
    setCodeExists(false)
    setIsCheckingCode(false)
  }, [expression, defaultGroupId, open])

  // Code 唯一性检查函数
  const checkCodeExists = useCallback(
    async (groupId: string, code: string) => {
      if (!groupId || !code || !/^[a-zA-Z0-9_-]+$/.test(code)) {
        setCodeExists(false)
        return
      }

      setIsCheckingCode(true)
      try {
        const params = new URLSearchParams({
          groupId,
          code,
        })
        if (expression?.id) {
          params.append("excludeId", expression.id)
        }

        const response = await fetch(
          `/api/admin/expressions/check-code?${params}`
        )
        const data = await response.json()
        setCodeExists(data.exists || false)
      } catch (error) {
        console.error("Check code error:", error)
        setCodeExists(false)
      } finally {
        setIsCheckingCode(false)
      }
    },
    [expression?.id]
  )

  // Code 输入时防抖检查
  useEffect(() => {
    // 编辑模式或 code 为空时不检查
    if (expression || !formData.code.trim() || !formData.groupId) {
      setCodeExists(false)
      setIsCheckingCode(false)
      return
    }

    // 清除之前的定时器
    if (checkTimeoutRef.current) {
      clearTimeout(checkTimeoutRef.current)
    }

    // 300ms 防抖
    checkTimeoutRef.current = setTimeout(() => {
      checkCodeExists(formData.groupId, formData.code)
    }, 300)

    return () => {
      if (checkTimeoutRef.current) {
        clearTimeout(checkTimeoutRef.current)
      }
    }
  }, [formData.code, formData.groupId, expression, checkCodeExists])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证 Code 格式（仅在创建时验证，编辑时 code 已禁用）
    if (!expression && !/^[a-zA-Z0-9_-]+$/.test(formData.code)) {
      toast.error(t("message.codeFormatError"))
      return
    }

    // 验证 Code 唯一性（仅在创建时）
    if (!expression && codeExists) {
      toast.error(t("message.codeDuplicate"))
      return
    }

    // 验证图片必须上传
    if (!formData.imagePath) {
      toast.error(t("message.imageRequired"))
      return
    }

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
                <div className="relative">
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({ ...formData, code: e.target.value })
                    }
                    placeholder={t("expressionDialog.codePlaceholder")}
                    required
                    maxLength={32}
                    disabled={!!expression || !!imageUrl}
                    className={
                      !expression && codeExists
                        ? "border-red-500 focus-visible:ring-red-500"
                        : ""
                    }
                  />
                  {/* Code 检查状态指示器 */}
                  {!expression && formData.code.trim() && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {isCheckingCode ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      ) : codeExists ? (
                        <AlertCircle className="h-4 w-4 text-red-500" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                  )}
                </div>
                {!expression && !imageUrl && (
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">
                      {t("expressionDialog.codeHint")}
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      {t("expressionDialog.codeFormatHint")}
                    </p>
                    <p className="text-xs text-muted-foreground/70">
                      {t("expressionDialog.codeWarning")}
                    </p>
                  </div>
                )}
                {/* Code 重复错误提示 */}
                {!expression && !imageUrl && codeExists && (
                  <p className="text-xs text-red-600 dark:text-red-400 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {t("expressionDialog.codeDuplicateError")}
                  </p>
                )}
                {imageUrl && !expression && (
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {t("expressionDialog.codeLockedAfterUpload")}
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

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>{t("expressionDialog.uploadImage")}</Label>
              {/* Code 格式验证提示 */}
              {!formData.code.trim() ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/30 p-3">
                  <p className="text-sm text-amber-800 dark:text-amber-200">
                    {t("expressionDialog.codeRequiredForUpload")}
                  </p>
                </div>
              ) : !/^[a-zA-Z0-9_-]+$/.test(formData.code) ? (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-3">
                  <p className="text-sm text-red-800 dark:text-red-200">
                    {t("expressionDialog.codeFormatInvalid")}
                  </p>
                </div>
              ) : codeExists ? (
                <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/30 p-3">
                  <p className="text-sm text-red-800 dark:text-red-200 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    {t("expressionDialog.codeDuplicateError")}
                  </p>
                </div>
              ) : (
                <>
                  <ExpressionImageUploader
                    value={imageUrl}
                    onChange={(url, dimensions, isAnimated) => {
                      setImageUrl(url)
                      setFormData({
                        ...formData,
                        imagePath: url,
                        width: dimensions.width,
                        height: dimensions.height,
                        isAnimated,
                      })
                    }}
                    groupCode={selectedGroup?.code || "default"}
                    expressionCode={formData.code}
                    disabled={!formData.code.trim()}
                  />
                  {/* 图片信息和说明 */}
                  <div className="space-y-1.5">
                    {formData.width && formData.height && (
                      <div className="text-sm text-muted-foreground">
                        {t("expressionDialog.dimensions")}: {formData.width} ×{" "}
                        {formData.height}
                        {formData.isAnimated && (
                          <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded">
                            {t("expressionDialog.animatedBadge")}
                          </span>
                        )}
                      </div>
                    )}
                    {formData.code.trim() && selectedGroup && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p>
                          {t("expressionDialog.storagePathLabel")}
                          <code className="mx-1 px-1.5 py-0.5 bg-muted rounded">
                            expressions/{selectedGroup.code}/{formData.code}.
                            {formData.isAnimated ? "gif" : "webp"}
                          </code>
                        </p>
                        <p className="text-muted-foreground/80">
                          {t("expressionDialog.formatConversionHint")}
                        </p>
                      </div>
                    )}
                  </div>
                </>
              )}
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
            <Button
              type="submit"
              className="flex-1"
              disabled={isSubmitting || (!expression && codeExists)}
            >
              {t("expressionDialog.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
