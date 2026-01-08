"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslations } from "next-intl"

type PostLikeTriggerConfigProps = {
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
}

/**
 * 点赞触发器配置组件
 *
 * 支持的配置项:
 * - min_count: 最小点赞数量
 */
export function PostLikeTriggerConfig({
  value,
  onChange,
}: PostLikeTriggerConfigProps) {
  const t = useTranslations("AdminAutomationRules.triggerConfig.postLike")

  const minCount = (value.min_count as number) || undefined

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor="minCount">{t("minCount")}</Label>
        <Input
          id="minCount"
          type="number"
          min="1"
          value={minCount || ""}
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : undefined
            if (val !== undefined && val > 0) {
              onChange({ ...value, min_count: val })
            } else {
              const newValue = { ...value }
              delete newValue.min_count
              onChange(newValue)
            }
          }}
          placeholder="10"
        />
        <p className="text-xs text-muted-foreground">{t("minCountHint")}</p>
      </div>
    </div>
  )
}
