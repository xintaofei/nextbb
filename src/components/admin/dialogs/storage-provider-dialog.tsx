"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
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
import { Checkbox } from "@/components/ui/checkbox"
import { StorageProviderDTO } from "@/types/storage-provider"
import { StorageProviderType } from "@prisma/client"
import { STORAGE_PROVIDER_TYPES } from "@/types/storage-provider-config"
import { getConfigFields } from "@/lib/storage-provider-fields"

type StorageProviderFormData = {
  name: string
  providerType: StorageProviderType | ""
  config: Record<string, unknown>
  baseUrl: string
  isActive: boolean
  maxFileSize: string
  allowedTypes: string
}

type StorageProviderDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider?: StorageProviderDTO
  onSubmit: (data: StorageProviderFormData) => Promise<void>
}

export function StorageProviderDialog({
  open,
  onOpenChange,
  provider,
  onSubmit,
}: StorageProviderDialogProps) {
  const t = useTranslations("AdminStorageProviders")
  const [formData, setFormData] = useState<StorageProviderFormData>({
    name: "",
    providerType: "",
    config: {},
    baseUrl: "",
    isActive: true,
    maxFileSize: "",
    allowedTypes: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 初始化表单数据
  useEffect(() => {
    if (provider) {
      const maxFileSizeMB = provider.maxFileSize
        ? (Number(provider.maxFileSize) / (1024 * 1024)).toString()
        : ""

      setFormData({
        name: provider.name,
        providerType: provider.providerType,
        config: provider.config as unknown as Record<string, unknown>,
        baseUrl: provider.baseUrl,
        isActive: provider.isActive,
        maxFileSize: maxFileSizeMB,
        allowedTypes: provider.allowedTypes || "",
      })
    } else {
      setFormData({
        name: "",
        providerType: "",
        config: {},
        baseUrl: "",
        isActive: true,
        maxFileSize: "",
        allowedTypes: "",
      })
    }
  }, [provider, open])

  // 缓存配置字段
  const configFields = useMemo(
    () => getConfigFields(formData.providerType, t),
    [formData.providerType, t]
  )

  // 验证 URL 格式
  const isValidUrl = useCallback((url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }, [])

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 基础验证
    if (!formData.name || !formData.providerType || !formData.baseUrl) {
      return
    }

    // URL 格式验证
    if (!isValidUrl(formData.baseUrl)) {
      return
    }

    // 文件大小验证
    if (formData.maxFileSize) {
      const size = parseFloat(formData.maxFileSize)
      if (isNaN(size) || size < 0 || size > 10240) {
        return
      }
    }

    setIsSubmitting(true)
    try {
      await onSubmit(formData)
      onOpenChange(false)
    } catch (error) {
      console.error("Failed to submit form:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // 处理字段更新
  const updateFormData = useCallback(
    (updates: Partial<StorageProviderFormData>) => {
      setFormData((prev) => ({ ...prev, ...updates }))
    },
    []
  )

  // 处理配置字段更新
  const updateConfigField = useCallback((key: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      config: { ...prev.config, [key]: value },
    }))
  }, [])

  // 处理供应商类型变更
  const handleProviderTypeChange = useCallback((value: StorageProviderType) => {
    setFormData((prev) => ({
      ...prev,
      providerType: value,
      config: {},
    }))
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {provider ? t("dialog.editTitle") : t("dialog.createTitle")}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* 名称 */}
            <div className="space-y-2">
              <Label htmlFor="name">{t("dialog.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateFormData({ name: e.target.value })}
                required
                maxLength={64}
              />
            </div>

            {/* 供应商类型 */}
            <div className="space-y-2">
              <Label htmlFor="providerType">{t("dialog.providerType")}</Label>
              <Select
                value={formData.providerType}
                onValueChange={handleProviderTypeChange}
                disabled={!!provider}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("dialog.providerTypePlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {STORAGE_PROVIDER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`providerTypes.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* 基础 URL */}
            <div className="space-y-2">
              <Label htmlFor="baseUrl">{t("dialog.baseUrl")}</Label>
              <Input
                id="baseUrl"
                value={formData.baseUrl}
                onChange={(e) => updateFormData({ baseUrl: e.target.value })}
                required
                placeholder="https://cdn.example.com"
                maxLength={512}
                type="url"
              />
            </div>

            {/* 最大文件大小 */}
            <div className="space-y-2">
              <Label htmlFor="maxFileSize">{t("dialog.maxFileSize")}</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={formData.maxFileSize}
                onChange={(e) =>
                  updateFormData({ maxFileSize: e.target.value })
                }
                placeholder="100"
                min="0"
                max="10240"
                step="0.1"
              />
            </div>

            {/* 允许的文件类型 */}
            <div className="space-y-2">
              <Label htmlFor="allowedTypes">{t("dialog.allowedTypes")}</Label>
              <Input
                id="allowedTypes"
                value={formData.allowedTypes}
                onChange={(e) =>
                  updateFormData({ allowedTypes: e.target.value })
                }
                placeholder={t("dialog.allowedTypesPlaceholder")}
              />
            </div>
          </div>

          {/* 配置字段 */}
          {formData.providerType && configFields.length > 0 && (
            <div className="space-y-4 pt-4 border-t">
              <h3 className="font-semibold text-sm">
                {t("dialog.configSection")}
              </h3>
              {configFields.map((field) => (
                <div key={field.key} className="space-y-2">
                  {field.type === "checkbox" ? (
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={field.key}
                        checked={
                          (formData.config[field.key] as boolean) ?? false
                        }
                        onCheckedChange={(checked) =>
                          updateConfigField(field.key, checked)
                        }
                      />
                      <Label htmlFor={field.key} className="cursor-pointer">
                        {field.label}
                      </Label>
                    </div>
                  ) : (
                    <>
                      <Label htmlFor={field.key}>
                        {field.label}
                        {field.required && !provider && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </Label>
                      <Input
                        id={field.key}
                        type={field.type}
                        value={
                          (formData.config[field.key] as string | number) ?? ""
                        }
                        onChange={(e) => {
                          const value =
                            field.type === "number"
                              ? parseInt(e.target.value) || 0
                              : e.target.value
                          updateConfigField(field.key, value)
                        }}
                        required={field.required && !provider}
                        placeholder={
                          field.type === "password" && provider
                            ? t("dialog.secretPlaceholder")
                            : field.placeholder
                        }
                        min={field.min}
                        max={field.max}
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 操作按钮 */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("dialog.cancel")}
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? t("dialog.submitting") : t("dialog.submit")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
