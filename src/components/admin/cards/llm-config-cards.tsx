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
import { Switch } from "@/components/ui/switch"
import { Settings2, Edit, Globe, Cpu, Bot } from "lucide-react"
import { cn } from "@/lib/utils"
import { LLMConfigDTO, LLMUsageRow } from "@/types/llm"

type LLMConfigCardsProps = {
  data: LLMUsageRow[]
  onConfigure: (usage: string, config: LLMConfigDTO | null) => void
  onToggleEnabled: (config: LLMConfigDTO, enabled: boolean) => void
}

const LLMConfigCardItem = memo(function LLMConfigCardItem({
  usage,
  config,
  onConfigure,
  onToggleEnabled,
}: {
  usage: string
  config: LLMConfigDTO | null
  onConfigure: (usage: string, config: LLMConfigDTO | null) => void
  onToggleEnabled: (config: LLMConfigDTO, enabled: boolean) => void
}) {
  const t = useTranslations("AdminLLMConfigs")

  return (
    <Card
      className={cn(
        "flex flex-col transition-all hover:shadow-md",
        !config && "border-dashed opacity-80 hover:opacity-100"
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            {t(`usages.${usage}`)}
          </CardTitle>
        </div>
        {!config && (
          <Badge
            variant="outline"
            className="text-muted-foreground font-normal"
          >
            {t("table.notConfigured")}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        {config ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Bot className="h-4 w-4" />
                <span>{t("table.name")}</span>
              </div>
              <span className="text-sm font-medium">{config.name}</span>
            </div>

            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Cpu className="h-4 w-4" />
                <span>{t("table.interfaceMode")}</span>
              </div>
              <Badge
                variant="outline"
                className="h-5 px-2 font-mono text-xs font-normal"
              >
                {config.interface_mode}
              </Badge>
            </div>

            <div className="space-y-2 pt-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Globe className="h-4 w-4" />
                <span>{t("table.baseUrl")}</span>
              </div>
              <div className="rounded-md bg-muted/40 px-3 py-2 text-xs font-mono text-muted-foreground break-all border border-border/40">
                {config.base_url}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center space-y-2 text-muted-foreground py-8">
            <div className="p-3 bg-muted/40 rounded-full">
              <Settings2 className="h-6 w-6 opacity-40" />
            </div>
            <p className="text-sm">{t("table.noConfig")}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="bg-muted/20 px-6 py-3">
        <div className="flex w-full items-center justify-between gap-2">
          {config ? (
            <>
              <div className="flex items-center gap-2">
                <Switch
                  checked={config.is_enabled}
                  onCheckedChange={(checked) =>
                    onToggleEnabled(config, checked)
                  }
                  id={`switch-${usage}`}
                />
                <label
                  htmlFor={`switch-${usage}`}
                  className="text-xs text-muted-foreground cursor-pointer select-none"
                >
                  {config.is_enabled ? t("table.enabled") : t("table.disabled")}
                </label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onConfigure(usage, config)}
                className="h-8"
              >
                <Edit className="mr-2 h-3.5 w-3.5" />
                {t("table.edit")}
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
  onToggleEnabled,
}: LLMConfigCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {data.map(({ usage, config }) => (
        <LLMConfigCardItem
          key={usage}
          usage={usage}
          config={config}
          onConfigure={onConfigure}
          onToggleEnabled={onToggleEnabled}
        />
      ))}
    </div>
  )
}
