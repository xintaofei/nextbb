"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useTranslations } from "next-intl"

type CheckinTriggerConfigProps = {
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
}

export function CheckinTriggerConfig({
  value,
  onChange,
}: CheckinTriggerConfigProps) {
  const t = useTranslations("AdminAutomationRules.triggerConfig.checkin")

  const consecutiveDays = (value.consecutive_days as number) || undefined

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor="consecutiveDays">{t("consecutiveDays")}</Label>
        <Input
          id="consecutiveDays"
          type="number"
          value={consecutiveDays || ""}
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : undefined
            if (val !== undefined) {
              onChange({ ...value, consecutive_days: val })
            } else {
              const newValue = { ...value }
              delete newValue.consecutive_days
              onChange(newValue)
            }
          }}
          placeholder="7"
        />
        <p className="text-xs text-muted-foreground">
          {t("consecutiveDaysHint")}
        </p>
      </div>
    </div>
  )
}
