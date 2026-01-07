"use client"

import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslations } from "next-intl"
import useSWR from "swr"

type BadgeGrantActionConfigProps = {
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
}

type Badge = {
  id: string
  name: string
  icon: string
}

export function BadgeGrantActionConfig({
  value,
  onChange,
}: BadgeGrantActionConfigProps) {
  const t = useTranslations("AdminAutomationRules.actionConfig.badgeGrant")
  const { data: badgesData } = useSWR<{ items: Badge[] }>(
    "/api/admin/badges?enabled=true&deleted=false&pageSize=100"
  )

  const badgeId = (value.badge_id as string) || ""
  const autoGrant = (value.auto_grant as boolean) ?? true

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor="badgeId">{t("badge")}</Label>
        <Select
          value={badgeId}
          onValueChange={(v) => onChange({ ...value, badge_id: v })}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("badgePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {badgesData?.items.map((badge) => (
              <SelectItem key={badge.id} value={badge.id}>
                {badge.icon} {badge.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Checkbox
          checked={autoGrant}
          onCheckedChange={(checked) =>
            onChange({ ...value, auto_grant: Boolean(checked) })
          }
        />
        <Label>{t("autoGrant")}</Label>
      </div>
    </div>
  )
}
