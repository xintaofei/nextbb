"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useTranslations } from "next-intl"
import { Edit, Trash2, FolderOpen, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatRelative } from "@/lib/time"

type CategoryListItemProps = {
  category: {
    id: string
    name: string
    icon: string
    description: string | null
    sort: number
    bgColor: string | null
    textColor: string | null
    isDeleted: boolean
    createdAt: string
    updatedAt: string
    topicCount: number
  }
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  disabled?: boolean
}

export function CategoryListItem({
  category,
  onEdit,
  onDelete,
  disabled = false,
}: CategoryListItemProps) {
  const t = useTranslations("AdminCategories")
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: category.id,
    disabled: disabled || category.isDeleted,
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
      <div
        className="absolute inset-0 bg-linear-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10"
        style={
          category.bgColor
            ? {
                background: `linear-gradient(135deg, ${category.bgColor}15 0%, transparent 100%)`,
              }
            : undefined
        }
      />

      <div className="relative flex items-center gap-4">
        {!category.isDeleted && (
          <button
            {...attributes}
            {...listeners}
            className="shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
            disabled={disabled}
          >
            <GripVertical className="h-5 w-5" />
          </button>
        )}

        {category.icon ? (
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/40 text-xl"
            style={{
              backgroundColor: category.bgColor || "transparent",
              color: category.textColor || "inherit",
            }}
          >
            {category.icon}
          </div>
        ) : (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/40 bg-muted/30">
            <FolderOpen className="h-5 w-5 text-muted-foreground" />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-base truncate">
              {category.name}
            </h3>
            {category.isDeleted && (
              <Badge variant="destructive" className="shrink-0">
                {t("card.deleted")}
              </Badge>
            )}
          </div>
          {category.description && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">
              {category.description}
            </p>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-6 text-sm">
          <div className="flex items-center gap-1 text-muted-foreground">
            <span className="font-medium">{t("card.topics")}:</span>
            <span className="font-semibold text-foreground">
              {category.topicCount}
            </span>
          </div>
          <div className="text-muted-foreground">
            {formatRelative(category.updatedAt)}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(category.id)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(category.id)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="sm:hidden flex items-center gap-4 text-sm text-muted-foreground mt-3 pt-3 border-t border-border/40">
        <div className="flex items-center gap-1">
          <span className="font-medium">{t("card.topics")}:</span>
          <span className="font-semibold text-foreground">
            {category.topicCount}
          </span>
        </div>
        <div className="text-muted-foreground">
          {formatRelative(category.updatedAt)}
        </div>
      </div>
    </div>
  )
}
