"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useTranslations } from "next-intl"

type CreditChangeActionConfigProps = {
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
}

export function CreditChangeActionConfig({
  value,
  onChange,
}: CreditChangeActionConfigProps) {
  const t = useTranslations("AdminAutomationRules.actionConfig.creditChange")

  const amount = (value.amount as number) || 0
  const description = (value.description as string) || ""

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor="amount">{t("amount")}</Label>
        <Input
          id="amount"
          type="number"
          value={amount}
          onChange={(e) =>
            onChange({ ...value, amount: Number(e.target.value) || 0 })
          }
          placeholder="10"
          required
        />
        <p className="text-xs text-muted-foreground">{t("amountHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">{t("description")}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onChange({ ...value, description: e.target.value })}
          placeholder={t("descriptionPlaceholder")}
          rows={3}
          required
        />
      </div>
    </div>
  )
}
