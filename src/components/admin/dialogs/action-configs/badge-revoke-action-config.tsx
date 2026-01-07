"use client"

import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTranslations } from "next-intl"
import useSWR from "swr"

type BadgeRevokeActionConfigProps = {
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
}

type Badge = {
  id: string
  name: string
  icon: string
}

export function BadgeRevokeActionConfig({
  value,
  onChange,
}: BadgeRevokeActionConfigProps) {
  const t = useTranslations("AdminAutomationRules.actionConfig.badgeRevoke")
  const { data: badgesData } = useSWR<{ items: Badge[] }>(
    "/api/admin/badges?enabled=true&deleted=false&pageSize=100"
  )

  const badgeId = (value.badge_id as string) || ""
  const reason = (value.reason as string) || ""

  return (
    <div className="space-y-4 rounded-lg border p-4 bg-red-50/50">
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

      <div className="space-y-2">
        <Label htmlFor="reason">{t("reason")}</Label>
        <Textarea
          id="reason"
          value={reason}
          onChange={(e) => onChange({ ...value, reason: e.target.value })}
          placeholder={t("reasonPlaceholder")}
          rows={3}
        />
      </div>
    </div>
  )
}
