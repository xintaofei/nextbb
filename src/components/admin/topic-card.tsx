import { motion } from "framer-motion"
import {
  Edit,
  Trash2,
  RefreshCcw,
  Pin,
  PinOff,
  Star,
  StarOff,
  MessageSquare,
  Eye,
  Calendar,
  Clock,
  User,
} from "lucide-react"
import { useTranslations } from "next-intl"
import Image from "next/image"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar } from "@/components/ui/avatar"
import { CategoryBadge } from "@/components/common/category-badge"
import { TagBadge } from "@/components/common/tag-badge"
import { formatRelative } from "@/lib/time"

export interface TopicCardProps {
  topic: {
    id: string
    title: string
    author: {
      id: string
      name: string
      avatar: string
    }
    category: {
      id: string
      name: string
      icon: string
      bgColor: string | null
      textColor: string | null
    }
    tags: Array<{
      id: string
      name: string
      icon: string
      bgColor: string | null
      textColor: string | null
    }>
    replies: number
    views: number
    isPinned: boolean
    isCommunity: boolean
    isDeleted: boolean
    createdAt: string
    updatedAt: string
    lastActivityAt: string
  }
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onRestore: (id: string) => void
  onTogglePin: (id: string, pinned: boolean) => void
  onToggleCommunity: (id: string, community: boolean) => void
}

export function TopicCard({
  topic,
  onEdit,
  onDelete,
  onRestore,
  onTogglePin,
  onToggleCommunity,
}: TopicCardProps) {
  const t = useTranslations("AdminTopics.card")

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl border border-border/40 bg-background/60 p-6 backdrop-blur transition-all hover:border-border/60 hover:shadow-lg"
    >
      <div className="absolute inset-0 bg-linear-to-br from-foreground/4 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100 -z-10" />

      <div className="relative space-y-4">
        {/* 顶部：标题和状态 */}
        <div className="space-y-2">
          <div className="flex items-start gap-2 flex-wrap">
            <h3
              className="flex-1 min-w-0 text-base font-semibold text-foreground line-clamp-2 hover:text-primary cursor-pointer"
              onClick={() => window.open(`/topic/${topic.id}`, "_blank")}
            >
              {topic.title}
            </h3>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {topic.isPinned && (
              <Badge
                variant="secondary"
                className="bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/40"
              >
                <Pin className="h-3 w-3 mr-1" />
                {t("pinned")}
              </Badge>
            )}
            {topic.isCommunity && (
              <Badge
                variant="secondary"
                className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40"
              >
                <Star className="h-3 w-3 mr-1" />
                {t("community")}
              </Badge>
            )}
            {topic.isDeleted && (
              <Badge
                variant="destructive"
                className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                {t("deleted")}
              </Badge>
            )}
          </div>
        </div>

        {/* 中间：作者、分类、标签 */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <User className="h-4 w-4 text-foreground/40 shrink-0" />
            <Avatar className="h-6 w-6 rounded-full border border-border/40">
              <Image
                src={topic.author.avatar}
                alt={topic.author.name}
                width={24}
                height={24}
                className="h-full w-full object-cover rounded-full"
              />
            </Avatar>
            <span className="text-foreground/80 truncate">
              {topic.author.name}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <CategoryBadge
              icon={topic.category.icon}
              name={topic.category.name}
              bgColor={topic.category.bgColor}
              textColor={topic.category.textColor}
            />
          </div>

          {topic.tags.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              {topic.tags.map((tag) => (
                <TagBadge
                  key={tag.id}
                  icon={tag.icon}
                  name={tag.name}
                  bgColor={tag.bgColor}
                  textColor={tag.textColor}
                />
              ))}
            </div>
          )}
        </div>

        {/* 统计区域 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm text-foreground/60">
            <MessageSquare className="h-4 w-4" />
            <span>
              {topic.replies} {t("replies")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/60">
            <Eye className="h-4 w-4" />
            <span>
              {topic.views} {t("views")}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/60">
            <Calendar className="h-4 w-4" />
            <span className="truncate">
              {t("created")} {formatRelative(topic.createdAt)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-foreground/60">
            <Clock className="h-4 w-4" />
            <span className="truncate">
              {t("lastActivity")} {formatRelative(topic.lastActivityAt)}
            </span>
          </div>
        </div>

        <div className="border-t border-border/40" />

        {/* 操作按钮 */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(topic.id)}
            className="flex-1 min-w-20"
          >
            <Edit className="mr-2 h-4 w-4" />
            {t("edit")}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onTogglePin(topic.id, !topic.isPinned)}
            className="flex-1 min-w-20"
          >
            {topic.isPinned ? (
              <>
                <PinOff className="mr-2 h-4 w-4" />
                {t("unpin")}
              </>
            ) : (
              <>
                <Pin className="mr-2 h-4 w-4" />
                {t("pin")}
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => onToggleCommunity(topic.id, !topic.isCommunity)}
            className="flex-1 min-w-20"
          >
            {topic.isCommunity ? (
              <>
                <StarOff className="mr-2 h-4 w-4" />
                {t("unrecommend")}
              </>
            ) : (
              <>
                <Star className="mr-2 h-4 w-4" />
                {t("recommend")}
              </>
            )}
          </Button>

          {topic.isDeleted ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRestore(topic.id)}
              className="flex-1 min-w-20"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t("restore")}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onDelete(topic.id)}
              className="flex-1 min-w-20 text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {t("delete")}
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  )
}
