"use client"

import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Edit, Trash2, Globe, Image as ImageIcon, Type } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Expression } from "@/types/expression"

type ExpressionCardProps = {
  expression: Pick<
    Expression,
    | "id"
    | "code"
    | "name"
    | "type"
    | "imageUrl"
    | "textContent"
    | "width"
    | "height"
    | "sort"
    | "isEnabled"
    | "isDeleted"
  >
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onManageTranslations: (id: string) => void
}

export function ExpressionCard({
  expression,
  onEdit,
  onDelete,
  onManageTranslations,
}: ExpressionCardProps) {
  const t = useTranslations("AdminExpressions")
  const tAdmin = useTranslations("Admin")

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-4 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

      <div className="relative space-y-3">
        {/* Preview Area */}
        <div className="flex items-center justify-between">
          <div className="flex h-16 w-16 items-center justify-center rounded-xl border border-border/40 bg-muted/30">
            {expression.type === "IMAGE" && expression.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={expression.imageUrl}
                alt={expression.name}
                className="max-w-full max-h-full object-contain"
                style={{
                  width: expression.width ? `${expression.width}px` : "auto",
                  height: expression.height ? `${expression.height}px` : "auto",
                  maxWidth: "100%",
                  maxHeight: "100%",
                }}
              />
            ) : expression.type === "TEXT" && expression.textContent ? (
              <span className="text-3xl">{expression.textContent}</span>
            ) : (
              <div className="text-muted-foreground">
                {expression.type === "IMAGE" ? (
                  <ImageIcon className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Type className="h-6 w-6" aria-hidden="true" />
                )}
              </div>
            )}
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
            <Badge variant="outline" className="text-xs">
              {expression.type === "IMAGE"
                ? t("expression.image")
                : t("expression.text")}
            </Badge>
          </div>
          {expression.type === "IMAGE" &&
            expression.width &&
            expression.height && (
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
