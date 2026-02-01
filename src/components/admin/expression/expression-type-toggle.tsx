"use client"

import { useTranslations } from "next-intl"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

type ExpressionTypeToggleProps = {
  value: "IMAGE" | "TEXT"
  onChange: (value: "IMAGE" | "TEXT") => void
  disabled?: boolean
}

export function ExpressionTypeToggle({
  value,
  onChange,
  disabled,
}: ExpressionTypeToggleProps) {
  const t = useTranslations("AdminExpressions")

  return (
    <Tabs
      value={value}
      onValueChange={(v) => onChange(v as "IMAGE" | "TEXT")}
      className="w-full"
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="IMAGE" disabled={disabled}>
          {t("expressionDialog.imageTab")}
        </TabsTrigger>
        <TabsTrigger value="TEXT" disabled={disabled}>
          {t("expressionDialog.textTab")}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  )
}
