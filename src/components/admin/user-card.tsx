import { motion } from "framer-motion"
import { Mail, Calendar, Shield, User } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Avatar } from "@/components/ui/avatar"
import { useTranslations } from "next-intl"

export interface UserCardProps {
  user: {
    id: string
    email: string
    name: string
    avatar: string
    isAdmin: boolean
    status: number
    isDeleted: boolean
    createdAt: string
  }
  onToggleAdmin: (id: string, value: boolean) => void
  onToggleStatus: (id: string, value: boolean) => void
  onToggleDeleted: (id: string, value: boolean) => void
}

export function UserCard({
  user,
  onToggleAdmin,
  onToggleStatus,
  onToggleDeleted,
}: UserCardProps) {
  const t = useTranslations("AdminUsers.card")

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
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 rounded-xl border-2 border-border/40">
              <img
                src={user.avatar}
                alt={user.name}
                className="h-full w-full object-cover"
              />
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-base truncate">{user.name}</h3>
              <div className="flex items-center gap-1.5 text-xs text-foreground/60 mt-0.5">
                <Mail className="h-3.5 w-3.5" />
                <span className="truncate">{user.email}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            {user.isAdmin && (
              <Badge
                variant="secondary"
                className="bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/40"
              >
                <Shield className="h-3 w-3 mr-1" />
                {t("admin")}
              </Badge>
            )}
            {user.isDeleted && (
              <Badge
                variant="destructive"
                className="bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/40"
              >
                {t("deleted")}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-foreground/60">
          <Calendar className="h-3.5 w-3.5" />
          <span>
            {t("joined")} {new Date(user.createdAt).toLocaleDateString()}
          </span>
        </div>

        <div className="border-t border-border/40" />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/20 bg-background/40 p-3 transition-all hover:border-border/40 hover:bg-background/60">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <Shield className="h-4 w-4 text-violet-600 dark:text-violet-400 shrink-0" />
              <span className="text-xs font-medium truncate">{t("role")}</span>
            </div>
            <Switch
              checked={user.isAdmin}
              onCheckedChange={(checked) => onToggleAdmin(user.id, checked)}
            />
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/20 bg-background/40 p-3 transition-all hover:border-border/40 hover:bg-background/60">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <User
                className={`h-4 w-4 shrink-0 ${
                  user.status === 1
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-foreground/40"
                }`}
              />
              <span className="text-xs font-medium truncate">
                {t("active")}
              </span>
            </div>
            <Switch
              checked={user.status === 1}
              onCheckedChange={(checked) => onToggleStatus(user.id, checked)}
            />
          </div>

          <div className="flex items-center justify-between gap-2 rounded-lg border border-border/20 bg-background/40 p-3 transition-all hover:border-border/40 hover:bg-background/60">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <User
                className={`h-4 w-4 shrink-0 ${
                  user.isDeleted
                    ? "text-red-600 dark:text-red-400"
                    : "text-foreground/40"
                }`}
              />
              <span className="text-xs font-medium truncate">
                {t("deletedStatus")}
              </span>
            </div>
            <Switch
              checked={user.isDeleted}
              onCheckedChange={(checked) => onToggleDeleted(user.id, checked)}
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}
