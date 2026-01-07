"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslations } from "next-intl"
import { CategoriesMultiSelect } from "./categories-multi-select"

type PostCreateTriggerConfigProps = {
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
}

export function PostCreateTriggerConfig({
  value,
  onChange,
}: PostCreateTriggerConfigProps) {
  const t = useTranslations("AdminAutomationRules.triggerConfig.postCreate")

  const categoryIds = (value.category_ids as number[]) || []
  const minContentLength = (value.min_content_length as number) || undefined

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label>{t("categories")}</Label>
        <CategoriesMultiSelect
          value={categoryIds.map(String)}
          onChange={(ids) => {
            const numIds = ids.map(Number).filter((n) => !isNaN(n))
            if (numIds.length > 0) {
              onChange({ ...value, category_ids: numIds })
            } else {
              const newValue = { ...value }
              delete newValue.category_ids
              onChange(newValue)
            }
          }}
          placeholder={t("categoriesHint")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="minContentLength">{t("minContentLength")}</Label>
        <Input
          id="minContentLength"
          type="number"
          value={minContentLength || ""}
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : undefined
            if (val !== undefined) {
              onChange({ ...value, min_content_length: val })
            } else {
              const newValue = { ...value }
              delete newValue.min_content_length
              onChange(newValue)
            }
          }}
          placeholder="100"
        />
        <p className="text-xs text-muted-foreground">
          {t("minContentLengthHint")}
        </p>
      </div>
    </div>
  )
}
