"use client"

import { useTranslations } from "next-intl"
import { motion } from "framer-motion"
import { Pencil, Trash2, Eye, EyeOff, Award, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

type BadgeItem = {
  id: string
  name: string
  icon: string
  description: string | null
  badgeType: string
  level: number
  sort: number
  bgColor: string | null
  textColor: string | null
  isEnabled: boolean
  isVisible: boolean
  isDeleted: boolean
  createdAt: string
  updatedAt: string
}

type BadgeCardProps = {
  badge: BadgeItem
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onManageTranslations: (id: string) => void
}

export function BadgeCard({
  badge,
  onEdit,
  onDelete,
  onManageTranslations,
}: BadgeCardProps) {
  const t = useTranslations("AdminBadges")
  const tAdmin = useTranslations("Admin")

  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
      case 2:
        return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
      case 3:
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
      case 4:
        return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
      case 5:
        return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
      default:
        return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    }
  }

  const cardOpacity = badge.isDeleted
    ? "opacity-50"
    : badge.isEnabled
      ? "opacity-100"
      : "opacity-75"

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg ${cardOpacity}`}
    >
      <div className="absolute inset-0 bg-linear-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

      <div className="relative p-6 space-y-4">
        {/* 头部：徽章图标和名称 */}
        <div className="flex items-start gap-3">
          <div
            className="flex h-16 w-16 items-center justify-center rounded-xl border border-border/40 text-3xl"
            style={{
              backgroundColor: badge.bgColor || "transparent",
              color: badge.textColor || "inherit",
            }}
          >
            {badge.icon || <Award className="h-8 w-8" />}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className="text-lg font-semibold truncate"
              style={{
                color: badge.textColor || "inherit",
              }}
            >
              {badge.name}
            </h3>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {t(`badgeType.${badge.badgeType}`)}
              </Badge>
              <Badge
                variant="secondary"
                className={`text-xs ${getLevelColor(badge.level)}`}
              >
                {t(
                  `level.${["common", "excellent", "rare", "epic", "legendary"][badge.level - 1] || "common"}`
                )}
              </Badge>
            </div>
          </div>
        </div>

        {/* 描述 */}
        {badge.description && (
          <p className="text-sm text-foreground/60 line-clamp-2 min-h-10">
            {badge.description}
          </p>
        )}

        {/* 底部信息栏 */}
        <div className="flex items-center justify-between pt-4 border-t border-border/40">
          <div className="flex items-center gap-2">
            {badge.isDeleted ? (
              <Badge variant="destructive" className="text-xs">
                {t("card.deleted")}
              </Badge>
            ) : (
              <>
                <Badge
                  variant={badge.isEnabled ? "default" : "secondary"}
                  className="text-xs"
                >
                  {badge.isEnabled ? t("card.enabled") : t("card.disabled")}
                </Badge>
                <div className="flex items-center gap-1 text-xs text-foreground/60">
                  {badge.isVisible ? (
                    <>
                      <Eye className="h-3 w-3" />
                      <span>{t("card.visible")}</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="h-3 w-3" />
                      <span>{t("card.hidden")}</span>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onManageTranslations(badge.id)}
              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
              title={tAdmin("translationDialog.title")}
            >
              <Globe className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit(badge.id)}
              className="h-8 w-8 p-0"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(badge.id)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
