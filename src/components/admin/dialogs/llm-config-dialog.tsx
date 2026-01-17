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
import { LLMConfigDTO, LLMConfigFormData } from "@/types/llm"

type LLMConfigDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  config?: LLMConfigDTO
  defaultUsage?: string
  onSubmit: (data: LLMConfigFormData) => Promise<void>
}

const INTERFACE_MODES = ["OPENAI", "GEMINI", "DEEPSEEK", "ANTHROPIC", "GROK"]

export function LLMConfigDialog({
  open,
  onOpenChange,
  config,
  defaultUsage,
  onSubmit,
}: LLMConfigDialogProps) {
  const t = useTranslations("AdminLLMConfigs")
  const [formData, setFormData] = useState<LLMConfigFormData>({
    interface_mode: "OPENAI",
    name: "",
    base_url: "",
    api_key: "",
    usage: "TRANSLATION",
    is_enabled: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (config) {
      setFormData({
        interface_mode: config.interface_mode,
        name: config.name,
        base_url: config.base_url,
        api_key: "", // Don't show masked key, leave empty
        usage: config.usage,
        is_enabled: config.is_enabled,
      })
    } else {
      setFormData({
        interface_mode: "OPENAI",
        name: "",
        base_url: "",
        api_key: "",
        usage: defaultUsage || "TRANSLATION",
        is_enabled: true,
      })
    }
  }, [config, defaultUsage, open])

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("dialog.title")}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>{t("dialog.usage")}</Label>
              <div className="text-sm font-medium text-muted-foreground px-3 py-2 border rounded-md bg-muted/50">
                {t(`usages.${formData.usage}`)}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interface_mode">
                {t("dialog.interfaceMode")}
              </Label>
              <Select
                value={formData.interface_mode}
                onValueChange={(value) =>
                  setFormData({ ...formData, interface_mode: value })
                }
              >
                <SelectTrigger id="interface_mode">
                  <SelectValue placeholder="Select interface mode" />
                </SelectTrigger>
                <SelectContent>
                  {INTERFACE_MODES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">{t("dialog.name")}</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="gpt-4, gemini-pro, etc."
                required
                maxLength={64}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="base_url">{t("dialog.baseUrl")}</Label>
              <Input
                id="base_url"
                value={formData.base_url}
                onChange={(e) =>
                  setFormData({ ...formData, base_url: e.target.value })
                }
                placeholder="https://api.openai.com/v1"
                required
                maxLength={255}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="api_key">{t("dialog.apiKey")}</Label>
              <Input
                id="api_key"
                type="password"
                value={formData.api_key}
                onChange={(e) =>
                  setFormData({ ...formData, api_key: e.target.value })
                }
                placeholder={config ? t("dialog.apiKeyPlaceholder") : ""}
                required={!config} // Required only when creating
                maxLength={255}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-4">
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
