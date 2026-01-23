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
import { Edit, Trash2, Globe, Key, Link2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type SocialProviderItem = {
  id: string
  providerKey: string
  name: string
  clientId: string
  clientSecret: string
  authorizeUrl: string | null
  tokenUrl: string | null
  userinfoUrl: string | null
  wellKnownUrl: string | null
  scope: string | null
  icon: string | null
  sort: number
  isEnabled: boolean
  createdAt: string
  updatedAt: string
}

type SocialProviderCardProps = {
  provider: SocialProviderItem
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleEnabled: (id: string, enabled: boolean) => void
}

export const SocialProviderCard = memo(function SocialProviderCard({
  provider,
  onEdit,
  onDelete,
  onToggleEnabled,
}: SocialProviderCardProps) {
  const t = useTranslations("AdminSocialProviders")

  return (
    <Card
      className={cn(
        "flex flex-col transition-all shadow-none hover:shadow-md",
        !provider.isEnabled && "opacity-60"
      )}
    >
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            {provider.icon && <span className="text-lg">{provider.icon}</span>}
            {provider.name}
          </CardTitle>
          <Badge
            variant="outline"
            className="text-xs font-mono font-normal text-muted-foreground"
          >
            {provider.providerKey}
          </Badge>
        </div>
        <Badge
          variant={provider.isEnabled ? "default" : "secondary"}
          className="text-xs"
        >
          {provider.isEnabled ? t("card.enabled") : t("card.disabled")}
        </Badge>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Key className="h-4 w-4" />
            <span>{t("card.clientId")}</span>
          </div>
          <span className="text-sm font-mono truncate max-w-[180px]">
            {provider.clientId.slice(0, 16)}...
          </span>
        </div>

        {provider.scope && (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Link2 className="h-4 w-4" />
              <span>{t("card.scope")}</span>
            </div>
            <span className="text-sm font-mono truncate max-w-[180px]">
              {provider.scope}
            </span>
          </div>
        )}

        {(provider.authorizeUrl || provider.wellKnownUrl) && (
          <div className="space-y-2 pt-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Globe className="h-4 w-4" />
              <span>{t("card.endpoints")}</span>
            </div>
            <div className="rounded-md bg-muted/40 px-3 py-2 text-xs font-mono text-muted-foreground break-all border border-border/40">
              {provider.wellKnownUrl || provider.authorizeUrl}
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter className="bg-muted/20 px-6 py-3">
        <div className="flex w-full items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Switch
              checked={provider.isEnabled}
              onCheckedChange={(checked) =>
                onToggleEnabled(provider.id, checked)
              }
              id={`switch-${provider.id}`}
            />
            <label
              htmlFor={`switch-${provider.id}`}
              className="text-xs text-muted-foreground cursor-pointer select-none"
            >
              {provider.isEnabled ? t("card.enabled") : t("card.disabled")}
            </label>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(provider.id)}
              className="h-8"
            >
              <Edit className="mr-2 h-3.5 w-3.5" />
              {t("card.edit")}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(provider.id)}
              className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </CardFooter>
    </Card>
  )
})
