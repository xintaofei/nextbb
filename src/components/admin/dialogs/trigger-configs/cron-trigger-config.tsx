"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslations } from "next-intl"

type CronTriggerConfigProps = {
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
}

export function CronTriggerConfig({ value, onChange }: CronTriggerConfigProps) {
  const t = useTranslations("AdminAutomationRules.triggerConfig.cron")

  const cron = (value.cron as string) || "0 0 * * *"
  const timezone = (value.timezone as string) || "Asia/Shanghai"

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor="cron">{t("cronExpression")}</Label>
        <Input
          id="cron"
          value={cron}
          onChange={(e) => onChange({ ...value, cron: e.target.value })}
          placeholder="0 0 * * *"
        />
        <p className="text-xs text-muted-foreground">
          {t("cronExpressionHint")}
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="timezone">{t("timezone")}</Label>
        <Select
          value={timezone}
          onValueChange={(v) => onChange({ ...value, timezone: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Asia/Shanghai">Asia/Shanghai</SelectItem>
            <SelectItem value="Asia/Tokyo">Asia/Tokyo</SelectItem>
            <SelectItem value="Asia/Hong_Kong">Asia/Hong_Kong</SelectItem>
            <SelectItem value="UTC">UTC</SelectItem>
            <SelectItem value="America/New_York">America/New_York</SelectItem>
            <SelectItem value="Europe/London">Europe/London</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
