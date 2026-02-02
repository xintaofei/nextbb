"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useTranslations } from "next-intl"
import { Edit, Trash2, GripVertical, Star, HardDrive } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { StorageProviderDTO } from "@/types/storage-provider"

type StorageProviderListItemProps = {
  provider: StorageProviderDTO
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, active: boolean) => void
  onSetDefault: (id: string) => void
  disabled?: boolean
}

export function StorageProviderListItem({
  provider,
  onEdit,
  onDelete,
  onToggleActive,
  onSetDefault,
  disabled = false,
}: StorageProviderListItemProps) {
  const t = useTranslations("AdminStorageProviders")
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

  const maxFileSizeMB = provider.maxFileSize
    ? (Number(provider.maxFileSize) / (1024 * 1024)).toFixed(0)
    : null

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

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-muted/30">
          <HardDrive className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base truncate">
              {provider.name}
            </h3>
            <Badge
              variant="outline"
              className="text-[10px] h-5 px-1.5 font-mono font-normal text-muted-foreground"
            >
              {t(`providerTypes.${provider.providerType}`)}
            </Badge>
            {provider.isDefault && (
              <Badge
                variant="default"
                className="text-[10px] h-5 px-1.5 bg-yellow-500/10 text-yellow-600 dark:text-yellow-500 border-yellow-500/20"
              >
                <Star className="h-3 w-3 mr-0.5 fill-current" />
                {t("list.default")}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 text-sm text-muted-foreground">
            {maxFileSizeMB && <span>{maxFileSizeMB}MB</span>}
            {provider.fileCount !== undefined && (
              <span>{provider.fileCount} files</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {!provider.isDefault && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onSetDefault(provider.id)}
              className="h-8 text-xs hidden sm:flex gap-1"
            >
              <Star className="h-3.5 w-3.5" />
              {t("list.setDefault")}
            </Button>
          )}
          <div className="flex items-center gap-2">
            <Switch
              checked={provider.isActive}
              onCheckedChange={(checked) =>
                onToggleActive(provider.id, checked)
              }
              id={`switch-${provider.id}`}
              disabled={provider.isDefault}
            />
            <label
              htmlFor={`switch-${provider.id}`}
              className="text-xs text-muted-foreground cursor-pointer select-none hidden sm:inline"
            >
              {provider.isActive ? t("list.enabled") : t("list.disabled")}
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
            disabled={provider.isDefault}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
