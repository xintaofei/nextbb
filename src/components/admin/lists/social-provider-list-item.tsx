"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Edit, Trash2, GripVertical, Globe, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { SocialProviderItem } from "@/components/admin/cards/social-provider-card"

type SocialProviderListItemProps = {
  provider: SocialProviderItem
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleEnabled: (id: string, enabled: boolean) => void
  disabled?: boolean
}

export function SocialProviderListItem({
  provider,
  onEdit,
  onDelete,
  onToggleEnabled,
  disabled = false,
}: SocialProviderListItemProps) {
  const t = useTranslations("AdminSocialProviders")
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: provider.id,
    disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-4 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg"
    >
      <div className="absolute inset-0 bg-linear-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

      <div className="relative flex items-center gap-4">
        <button
          {...attributes}
          {...listeners}
          className="shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
          disabled={disabled}
        >
          <GripVertical className="h-5 w-5" />
        </button>

        {provider.icon ? (
          <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted/30">
            <Image
              src={provider.icon}
              alt={provider.name}
              fill
              className="object-contain p-1"
            />
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-muted/30">
            <Globe className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base truncate">
              {provider.name}
            </h3>
            <Badge
              variant="outline"
              className="text-[10px] h-5 px-1.5 font-mono font-normal text-muted-foreground"
            >
              {provider.providerKey}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
            <Key className="h-3.5 w-3.5" />
            <span className="font-mono truncate max-w-50">
              {provider.clientId.slice(0, 20)}...
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4">
          {provider.scope && (
            <div className="text-sm text-muted-foreground max-w-37.5 truncate">
              {provider.scope}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
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
              className="text-xs text-muted-foreground cursor-pointer select-none hidden sm:inline"
            >
              {provider.isEnabled ? t("card.enabled") : t("card.disabled")}
            </label>
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(provider.id)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(provider.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
