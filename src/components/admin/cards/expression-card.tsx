"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import { useTranslations } from "next-intl"
import {
  Edit,
  Trash2,
  Globe,
  Image as ImageIcon,
  GripVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Expression } from "@/types/expression"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { cn } from "@/lib/utils"

type ExpressionCardProps = {
  expression: Pick<
    Expression,
    | "id"
    | "code"
    | "name"
    | "imageUrl"
    | "thumbnailUrl"
    | "width"
    | "height"
    | "sort"
    | "isEnabled"
    | "isDeleted"
  >
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onManageTranslations: (id: string) => void
  sortableId: string
  disabled?: boolean
}

export function ExpressionCardContent({
  expression,
  onEdit,
  onDelete,
  onManageTranslations,
  attributes,
  listeners,
  isDragging,
  disabled,
}: ExpressionCardProps & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  attributes?: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  listeners?: any
  isDragging?: boolean
}) {
  const t = useTranslations("AdminExpressions")
  const tAdmin = useTranslations("Admin")
  const previewUrl = expression.thumbnailUrl || expression.imageUrl

  return (
    <motion.div
      initial={false}
      animate={
        isDragging
          ? {
              scale: 1.05,
              zIndex: 50,
              boxShadow: "0 10px 30px -10px rgba(0,0,0,0.2)",
            }
          : { scale: 1, zIndex: 1, boxShadow: "none" }
      }
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-4 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg",
        isDragging && "border-primary/50"
      )}
    >
      <div className="absolute inset-0 bg-linear-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

      <div className="relative space-y-3">
        {/* Preview Area */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              {...attributes}
              {...listeners}
              className={cn(
                "shrink-0 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              disabled={disabled}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border/40 bg-muted/30">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt={expression.name}
                  width={expression.width || 64}
                  height={expression.height || 64}
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <ImageIcon
                  className="h-6 w-6 text-muted-foreground"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            {expression.isDeleted && (
              <Badge variant="destructive" className="shrink-0 text-xs">
                {t("filter.deleted.deleted")}
              </Badge>
            )}
            {!expression.isEnabled && !expression.isDeleted && (
              <Badge variant="secondary" className="shrink-0 text-xs">
                {t("group.disabled")}
              </Badge>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onManageTranslations(expression.id)}
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              title={tAdmin("translationDialog.title")}
            >
              <Globe className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        {/* Info Area */}
        <div className="space-y-1">
          <h4 className="font-semibold text-sm leading-tight">
            {expression.name}
          </h4>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <code className="rounded bg-muted px-1.5 py-0.5">
              {expression.code}
            </code>
          </div>
          {expression.width && expression.height && (
            <div className="text-xs text-muted-foreground">
              {expression.width} × {expression.height}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(expression.id)}
            className="flex-1 text-xs h-8"
          >
            <Edit className="mr-1.5 h-3.5 w-3.5" />
            {t("translationDialog.edit")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(expression.id)}
            className="flex-1 text-xs h-8 text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-1.5 h-3.5 w-3.5" />
            {t("translationDialog.cancel")}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}

export function ExpressionCard(props: ExpressionCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: props.sortableId,
    disabled: props.disabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : "auto",
    position: "relative" as const,
  }

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "z-50")}>
      <ExpressionCardContent
        {...props}
        attributes={attributes}
        listeners={listeners}
        isDragging={isDragging}
      />
    </div>
  )
}
