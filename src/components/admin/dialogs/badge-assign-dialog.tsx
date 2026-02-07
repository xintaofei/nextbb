"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import useSWR from "swr"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserBadge } from "@/components/common/user-badge"
import { BadgeItem, BadgeListResponse } from "@/types/badge"
import { Search, Award } from "lucide-react"
import { toast } from "sonner"

export type BadgeAssignDialogProps = {
  userId: string
  userName: string
  currentBadges: BadgeItem[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const fetcher = async (url: string): Promise<BadgeListResponse> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
}

export function BadgeAssignDialog({
  userId,
  userName,
  currentBadges,
  open,
  onOpenChange,
  onSuccess,
}: BadgeAssignDialogProps) {
  const t = useTranslations("AdminUsers.badgeDialog")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBadgeIds, setSelectedBadgeIds] = useState<Set<string>>(
    new Set()
  )
  const [isAssigning, setIsAssigning] = useState(false)
  const [isRemoving, setIsRemoving] = useState(false)

  const { data: availableBadgesData } = useSWR<BadgeListResponse>(
    open ? `/api/admin/badges/available?q=${searchQuery}` : null,
    fetcher
  )

  const currentBadgeIds = useMemo(
    () => new Set(currentBadges.map((b) => b.id)),
    [currentBadges]
  )

  const filteredAvailableBadges = useMemo(() => {
    if (!availableBadgesData) return []
    return availableBadgesData.items
  }, [availableBadgesData])

  const handleToggleBadge = (badgeId: string) => {
    const newSet = new Set(selectedBadgeIds)
    if (newSet.has(badgeId)) {
      newSet.delete(badgeId)
    } else {
      newSet.add(badgeId)
    }
    setSelectedBadgeIds(newSet)
  }

  const handleAssign = async () => {
    if (selectedBadgeIds.size === 0) {
      toast.error(t("selectAtLeastOne"))
      return
    }

    setIsAssigning(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/badges`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeIds: Array.from(selectedBadgeIds) }),
      })

      if (!response.ok) {
        throw new Error("Failed to assign badges")
      }

      toast.success(t("success"))
      setSelectedBadgeIds(new Set())
      onSuccess()
    } catch (error) {
      console.error("Assign badges error:", error)
      toast.error(t("error"))
    } finally {
      setIsAssigning(false)
    }
  }

  const handleRemove = async () => {
    if (selectedBadgeIds.size === 0) {
      toast.error(t("selectAtLeastOne"))
      return
    }

    setIsRemoving(true)
    try {
      const response = await fetch(`/api/admin/users/${userId}/badges`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ badgeIds: Array.from(selectedBadgeIds) }),
      })

      if (!response.ok) {
        throw new Error("Failed to remove badges")
      }

      toast.success(t("success"))
      setSelectedBadgeIds(new Set())
      onSuccess()
    } catch (error) {
      console.error("Remove badges error:", error)
      toast.error(t("error"))
    } finally {
      setIsRemoving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-screen max-sm:h-screen overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("assignTitle", { name: userName })}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* 当前徽章区域 */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4" />
              {t("currentBadges")} ({currentBadges.length})
            </h3>
            {currentBadges.length > 0 ? (
              <ScrollArea className="h-24 border rounded-md">
                <div className="flex flex-wrap gap-2 p-3">
                  {currentBadges.map((badge) => (
                    <div key={badge.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedBadgeIds.has(badge.id)}
                        onCheckedChange={() => handleToggleBadge(badge.id)}
                      />
                      <UserBadge
                        icon={badge.icon}
                        name={badge.name}
                        bgColor={badge.bgColor}
                        textColor={badge.textColor}
                        darkBgColor={badge.darkBgColor}
                        darkTextColor={badge.darkTextColor}
                        level={badge.level}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                {t("empty")}
              </p>
            )}
          </div>

          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t("search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 可赋予徽章区域 */}
          <div className="flex-1 space-y-2 overflow-hidden flex flex-col">
            <h3 className="text-sm font-medium">
              {t("availableBadges")} ({filteredAvailableBadges.length})
            </h3>
            <ScrollArea className="flex-1 border rounded-md">
              <div className="flex flex-wrap gap-2 p-3">
                {filteredAvailableBadges.map((badge) => {
                  const isOwned = currentBadgeIds.has(badge.id)
                  return (
                    <div key={badge.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedBadgeIds.has(badge.id)}
                        onCheckedChange={() => handleToggleBadge(badge.id)}
                        disabled={isOwned}
                      />
                      <UserBadge
                        icon={badge.icon}
                        name={badge.name}
                        bgColor={badge.bgColor}
                        textColor={badge.textColor}
                        level={badge.level}
                        size="sm"
                        className={isOwned ? "opacity-50" : ""}
                      />
                      {isOwned && (
                        <span className="text-xs text-muted-foreground">
                          ({t("alreadyOwned")})
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isAssigning || isRemoving}
          >
            {t("cancel")}
          </Button>
          <Button
            variant="destructive"
            onClick={handleRemove}
            disabled={isAssigning || isRemoving || selectedBadgeIds.size === 0}
          >
            {t("remove")}
          </Button>
          <Button
            onClick={handleAssign}
            disabled={isAssigning || isRemoving || selectedBadgeIds.size === 0}
          >
            {t("assign")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
