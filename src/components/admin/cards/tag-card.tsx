"use client"

import { motion } from "framer-motion"
import { useTranslations } from "next-intl"
import { Edit, Trash2, Tag, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatRelative } from "@/lib/time"

type TagCardProps = {
  tag: {
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
    usageCount: number
  }
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onManageTranslations: (id: string) => void
}

export function TagCard({
  tag,
  onEdit,
  onDelete,
  onManageTranslations,
}: TagCardProps) {
  const t = useTranslations("AdminTags")

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg"
    >
      <div
        className="absolute inset-0 bg-linear-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10"
        style={
          tag.bgColor
            ? {
                background: `linear-gradient(135deg, ${tag.bgColor}15 0%, transparent 100%)`,
              }
            : undefined
        }
      />

      <div className="relative space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            {tag.icon ? (
              <div
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/40 text-2xl"
                style={{
                  backgroundColor: tag.bgColor || "transparent",
                  color: tag.textColor || "inherit",
                }}
              >
                {tag.icon}
              </div>
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-border/40 bg-muted/30">
                <Tag className="h-6 w-6 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-lg leading-tight">
                {tag.name}
              </h3>
              {tag.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {tag.description}
                </p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2 items-end">
            {tag.isDeleted && (
              <Badge variant="destructive" className="shrink-0">
                {t("card.deleted")}
              </Badge>
            )}
            <Button
              size="icon"
              variant="ghost"
              onClick={() => onManageTranslations(tag.id)}
              className="h-8 w-8 text-muted-foreground hover:text-primary"
              title={t("translationDialog.title")}
            >
              <Globe className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-medium">{t("card.sort")}:</span>
            <span>{tag.sort}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{t("card.usages")}:</span>
            <span className="font-semibold text-foreground">
              {tag.usageCount}
            </span>
            <span className="text-xs">{t("card.times")}</span>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          {t("card.updatedAt")} {formatRelative(tag.updatedAt)}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-border/40">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(tag.id)}
            className="flex-1"
          >
            <Edit className="mr-2 h-4 w-4" />
            {t("card.edit")}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(tag.id)}
            className="flex-1 text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {t("card.delete")}
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
