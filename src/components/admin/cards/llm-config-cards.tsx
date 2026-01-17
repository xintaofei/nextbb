"use client"

import { memo } from "react"
import { useTranslations } from "next-intl"
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Settings2, Edit, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { LLMConfigDTO, LLMUsageRow } from "@/types/llm"

type LLMConfigCardsProps = {
  data: LLMUsageRow[]
  onConfigure: (usage: string, config: LLMConfigDTO | null) => void
  onDelete: (config: LLMConfigDTO) => void
}

const LLMConfigCardItem = memo(function LLMConfigCardItem({
  usage,
  config,
  onConfigure,
  onDelete,
}: {
  usage: string
  config: LLMConfigDTO | null
  onConfigure: (usage: string, config: LLMConfigDTO | null) => void
  onDelete: (config: LLMConfigDTO) => void
}) {
  const t = useTranslations("AdminLLMConfigs")

  return (
    <Card
      className={cn(
        "flex flex-col transition-all hover:shadow-md",
        !config && "border-dashed opacity-80 hover:opacity-100"
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">
            {t(`usages.${usage}`)}
          </CardTitle>
        </div>
        {config ? (
          <Badge variant={config.is_enabled ? "default" : "secondary"}>
            {config.is_enabled ? t("table.enabled") : t("table.disabled")}
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            {t("table.notConfigured")}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-1 space-y-4 pt-4">
        {config ? (
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("table.name")}:</span>
              <span className="font-medium">{config.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">
                {t("table.interfaceMode")}:
              </span>
              <Badge variant="outline">{config.interface_mode}</Badge>
            </div>
            <div className="flex flex-col space-y-1.5">
              <span className="text-muted-foreground">
                {t("table.baseUrl")}:
              </span>
              <span className="truncate text-xs text-muted-foreground/80 font-mono bg-muted/50 p-1.5 rounded border">
                {config.base_url}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-2 text-muted-foreground py-6">
            <div className="p-3 bg-muted/50 rounded-full">
              <Settings2 className="h-6 w-6 opacity-40" />
            </div>
            <p className="text-sm">{t("table.noConfig")}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/20 px-6 py-3">
        <div className="flex w-full items-center justify-end gap-2">
          {config ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConfigure(usage, config)}
                className="h-8"
              >
                <Edit className="mr-2 h-3.5 w-3.5" />
                {t("table.edit")}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                onClick={() => onDelete(config)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="w-full"
              onClick={() => onConfigure(usage, config)}
            >
              <Settings2 className="mr-2 h-3.5 w-3.5" />
              {t("table.configure")}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  )
})

export function LLMConfigCards({
  data,
  onConfigure,
  onDelete,
}: LLMConfigCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map(({ usage, config }) => (
        <LLMConfigCardItem
          key={usage}
          usage={usage}
          config={config}
          onConfigure={onConfigure}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
