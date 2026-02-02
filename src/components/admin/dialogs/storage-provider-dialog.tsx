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
import { Checkbox } from "@/components/ui/checkbox"
import { StorageProviderDTO } from "@/types/storage-provider"
import { StorageProviderType } from "@prisma/client"

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

const PROVIDER_TYPES: StorageProviderType[] = [
  "LOCAL",
  "VERCEL_BLOB",
  "ALIYUN_OSS",
  "AWS_S3",
  "TENCENT_COS",
  "QINIU",
  "UPYUN",
  "MINIO",
]

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

  useEffect(() => {
    if (provider) {
      const maxFileSizeMB = provider.maxFileSize
        ? (Number(provider.maxFileSize) / (1024 * 1024)).toString()
        : ""

      const sensitiveFields = getSensitiveFields(provider.providerType)
      const config = {
        ...(provider.config as unknown as Record<string, unknown>),
      }
      for (const field of sensitiveFields) {
        if (config[field] === "••••••••") {
          config[field] = ""
        }
      }

      setFormData({
        name: provider.name,
        providerType: provider.providerType,
        config,
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

  const getSensitiveFields = (
    providerType: StorageProviderType | ""
  ): string[] => {
    const sensitiveFieldsMap: Record<string, string[]> = {
      VERCEL_BLOB: ["token"],
      ALIYUN_OSS: ["accessKeySecret"],
      AWS_S3: ["secretAccessKey"],
      TENCENT_COS: ["secretKey"],
      QINIU: ["secretKey"],
      UPYUN: ["password"],
      MINIO: ["secretKey"],
    }
    return sensitiveFieldsMap[providerType] || []
  }

  const getConfigFields = (
    providerType: StorageProviderType | ""
  ): Array<{ key: string; label: string; type: string; required: boolean }> => {
    const configMap: Record<
      string,
      Array<{ key: string; label: string; type: string; required: boolean }>
    > = {
      LOCAL: [
        {
          key: "basePath",
          label: t("dialog.config.basePath"),
          type: "text",
          required: true,
        },
      ],
      VERCEL_BLOB: [
        {
          key: "token",
          label: t("dialog.config.token"),
          type: "password",
          required: true,
        },
      ],
      ALIYUN_OSS: [
        {
          key: "accessKeyId",
          label: t("dialog.config.accessKeyId"),
          type: "text",
          required: true,
        },
        {
          key: "accessKeySecret",
          label: t("dialog.config.accessKeySecret"),
          type: "password",
          required: true,
        },
        {
          key: "region",
          label: t("dialog.config.region"),
          type: "text",
          required: true,
        },
        {
          key: "bucket",
          label: t("dialog.config.bucket"),
          type: "text",
          required: true,
        },
        {
          key: "endpoint",
          label: t("dialog.config.endpoint"),
          type: "text",
          required: false,
        },
      ],
      AWS_S3: [
        {
          key: "accessKeyId",
          label: t("dialog.config.accessKeyId"),
          type: "text",
          required: true,
        },
        {
          key: "secretAccessKey",
          label: t("dialog.config.secretAccessKey"),
          type: "password",
          required: true,
        },
        {
          key: "region",
          label: t("dialog.config.region"),
          type: "text",
          required: true,
        },
        {
          key: "bucket",
          label: t("dialog.config.bucket"),
          type: "text",
          required: true,
        },
      ],
      TENCENT_COS: [
        {
          key: "secretId",
          label: t("dialog.config.secretId"),
          type: "text",
          required: true,
        },
        {
          key: "secretKey",
          label: t("dialog.config.secretKey"),
          type: "password",
          required: true,
        },
        {
          key: "region",
          label: t("dialog.config.region"),
          type: "text",
          required: true,
        },
        {
          key: "bucket",
          label: t("dialog.config.bucket"),
          type: "text",
          required: true,
        },
      ],
      QINIU: [
        {
          key: "accessKey",
          label: t("dialog.config.accessKey"),
          type: "text",
          required: true,
        },
        {
          key: "secretKey",
          label: t("dialog.config.secretKey"),
          type: "password",
          required: true,
        },
        {
          key: "bucket",
          label: t("dialog.config.bucket"),
          type: "text",
          required: true,
        },
      ],
      UPYUN: [
        {
          key: "operator",
          label: t("dialog.config.operator"),
          type: "text",
          required: true,
        },
        {
          key: "password",
          label: t("dialog.config.password"),
          type: "password",
          required: true,
        },
        {
          key: "bucket",
          label: t("dialog.config.bucket"),
          type: "text",
          required: true,
        },
      ],
      MINIO: [
        {
          key: "endpoint",
          label: t("dialog.config.endpoint"),
          type: "text",
          required: true,
        },
        {
          key: "port",
          label: t("dialog.config.port"),
          type: "number",
          required: true,
        },
        {
          key: "accessKey",
          label: t("dialog.config.accessKey"),
          type: "text",
          required: true,
        },
        {
          key: "secretKey",
          label: t("dialog.config.secretKey"),
          type: "password",
          required: true,
        },
        {
          key: "bucket",
          label: t("dialog.config.bucket"),
          type: "text",
          required: true,
        },
        {
          key: "useSsl",
          label: t("dialog.config.useSsl"),
          type: "checkbox",
          required: true,
        },
      ],
    }
    return configMap[providerType] || []
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.providerType || !formData.baseUrl) {
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

  const configFields = getConfigFields(formData.providerType)

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
            <div className="space-y-2">
              <Label htmlFor="name">{t("dialog.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                maxLength={64}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="providerType">{t("dialog.providerType")}</Label>
              <Select
                value={formData.providerType}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    providerType: value as StorageProviderType,
                    config: {},
                  })
                }
                disabled={!!provider}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={t("dialog.providerTypePlaceholder")}
                  />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {t(`providerTypes.${type}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">{t("dialog.baseUrl")}</Label>
              <Input
                id="baseUrl"
                value={formData.baseUrl}
                onChange={(e) =>
                  setFormData({ ...formData, baseUrl: e.target.value })
                }
                required
                placeholder="https://cdn.example.com"
                maxLength={512}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maxFileSize">{t("dialog.maxFileSize")}</Label>
              <Input
                id="maxFileSize"
                type="number"
                value={formData.maxFileSize}
                onChange={(e) =>
                  setFormData({ ...formData, maxFileSize: e.target.value })
                }
                placeholder="100"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allowedTypes">{t("dialog.allowedTypes")}</Label>
              <Input
                id="allowedTypes"
                value={formData.allowedTypes}
                onChange={(e) =>
                  setFormData({ ...formData, allowedTypes: e.target.value })
                }
                placeholder={t("dialog.allowedTypesPlaceholder")}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isActive: checked as boolean })
                }
              />
              <Label htmlFor="isActive" className="cursor-pointer">
                {t("dialog.isActive")}
              </Label>
            </div>
          </div>

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
                          setFormData({
                            ...formData,
                            config: {
                              ...formData.config,
                              [field.key]: checked,
                            },
                          })
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
                        {field.required && (
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
                          setFormData({
                            ...formData,
                            config: {
                              ...formData.config,
                              [field.key]: value,
                            },
                          })
                        }}
                        required={field.required}
                        placeholder={
                          field.type === "password" && provider
                            ? t("dialog.secretPlaceholder")
                            : undefined
                        }
                      />
                    </>
                  )}
                </div>
              ))}
            </div>
          )}

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
