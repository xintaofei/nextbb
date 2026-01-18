"use client"

import { Input } from "@/components/ui/input"
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

type DonationTriggerConfigProps = {
  value: Record<string, unknown>
  onChange: (value: Record<string, unknown>) => void
}

const DONATION_SOURCES = [
  "KOFI",
  "PATREON",
  "PAYPAL",
  "ALIPAY",
  "WECHAT_PAY",
  "BANK_TRANSFER",
  "CRYPTO",
  "OTHER",
]

export function DonationTriggerConfig({
  value,
  onChange,
}: DonationTriggerConfigProps) {
  const t = useTranslations("AdminAutomationRules.triggerConfig.donation")

  const minAmount = (value.min_amount as number) || undefined
  const currency = (value.currency as string) || "CNY"
  const sources = (value.sources as string[]) || []

  const toggleSource = (source: string) => {
    const next = sources.includes(source)
      ? sources.filter((s) => s !== source)
      : [...sources, source]

    if (next.length > 0) {
      onChange({ ...value, sources: next })
    } else {
      const newValue = { ...value }
      delete newValue.sources
      onChange(newValue)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="space-y-2">
        <Label htmlFor="minAmount">{t("minAmount")}</Label>
        <Input
          id="minAmount"
          type="number"
          value={minAmount || ""}
          onChange={(e) => {
            const val = e.target.value ? Number(e.target.value) : undefined
            if (val !== undefined) {
              onChange({ ...value, min_amount: val })
            } else {
              const newValue = { ...value }
              delete newValue.min_amount
              onChange(newValue)
            }
          }}
          placeholder="100"
        />
        <p className="text-xs text-muted-foreground">{t("minAmountHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="currency">{t("currency")}</Label>
        <Select
          value={currency}
          onValueChange={(v) => onChange({ ...value, currency: v })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CNY">CNY (人民币)</SelectItem>
            <SelectItem value="USD">USD (美元)</SelectItem>
            <SelectItem value="EUR">EUR (欧元)</SelectItem>
            <SelectItem value="JPY">JPY (日元)</SelectItem>
            <SelectItem value="GBP">GBP (英镑)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>{t("sources")}</Label>
        <div className="grid grid-cols-2 gap-2">
          {DONATION_SOURCES.map((source) => (
            <div key={source} className="flex items-center space-x-2">
              <Checkbox
                id={`source-${source}`}
                checked={sources.includes(source)}
                onCheckedChange={() => toggleSource(source)}
              />
              <Label className="cursor-pointer">
                {t(`sourceOptions.${source}`)}
              </Label>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{t("sourcesHint")}</p>
      </div>
    </div>
  )
}
