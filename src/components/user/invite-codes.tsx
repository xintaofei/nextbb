"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import {
  Plus,
  Copy,
  Trash2,
  Loader2,
  ChevronDown,
  ChevronUp,
  TicketCheck,
} from "lucide-react"
import { formatLocalTime } from "@/lib/time"
import { cn } from "@/lib/utils"

type InvitedUser = {
  id: string
  inviteeId: string
  inviteeName: string
  inviteeAvatar: string
  createdAt: string
}

type InviteCode = {
  id: string
  code: string
  note: string
  maxUses: number | null
  usedCount: number
  isActive: boolean
  expiresAt: string | null
  createdAt: string
  invitations: InvitedUser[]
}

const fetcher = (url: string): Promise<{ codes: InviteCode[] }> =>
  fetch(url).then((res) => res.json())

export function InviteCodes() {
  const t = useTranslations("User.invitations")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [creating, setCreating] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<InviteCode | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [newNote, setNewNote] = useState("")
  const [newMaxUses, setNewMaxUses] = useState("")
  const [newExpiresAt, setNewExpiresAt] = useState("")

  const { data, mutate, isLoading } = useSWR(
    "/api/users/me/invite-codes",
    fetcher
  )

  const codes = data?.codes ?? []

  const toggleExpand = (id: string): void => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const getStatus = (
    code: InviteCode
  ): "active" | "inactive" | "expired" | "maxUsed" => {
    if (!code.isActive) return "inactive"
    if (code.expiresAt && new Date(code.expiresAt) < new Date())
      return "expired"
    if (code.maxUses !== null && code.usedCount >= code.maxUses)
      return "maxUsed"
    return "active"
  }

  const getStatusBadge = (code: InviteCode): React.ReactNode => {
    const status = getStatus(code)
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-600">
            {t("statusActive")}
          </Badge>
        )
      case "inactive":
        return <Badge variant="secondary">{t("statusInactive")}</Badge>
      case "expired":
        return <Badge variant="destructive">{t("statusExpired")}</Badge>
      case "maxUsed":
        return (
          <Badge variant="outline" className="text-amber-600 border-amber-600">
            {t("statusMaxUsed")}
          </Badge>
        )
    }
  }

  const handleCreate = async (): Promise<void> => {
    setCreating(true)
    try {
      const body: Record<string, string | number | null> = {}
      if (newNote.trim()) body.note = newNote.trim()
      if (newMaxUses.trim()) {
        const parsed = parseInt(newMaxUses, 10)
        if (!isNaN(parsed) && parsed >= 1) body.maxUses = parsed
      }
      if (newExpiresAt) body.expiresAt = new Date(newExpiresAt).toISOString()

      const res = await fetch("/api/users/me/invite-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error("Failed to create")
      }

      toast.success(t("createSuccess"))
      setShowCreateDialog(false)
      setNewNote("")
      setNewMaxUses("")
      setNewExpiresAt("")
      mutate()
    } catch {
      toast.error(t("createError"))
    } finally {
      setCreating(false)
    }
  }

  const handleToggleActive = async (code: InviteCode): Promise<void> => {
    try {
      const res = await fetch(`/api/users/me/invite-codes/${code.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !code.isActive }),
      })

      if (!res.ok) {
        throw new Error("Failed to update")
      }

      toast.success(t("updateSuccess"))
      mutate()
    } catch {
      toast.error(t("updateError"))
    }
  }

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(
        `/api/users/me/invite-codes/${deleteTarget.id}`,
        { method: "DELETE" }
      )

      if (!res.ok) {
        const data = await res.json()
        if (data.error === "HAS_INVITATIONS") {
          toast.error(t("deleteHasInvitations"))
          return
        }
        throw new Error("Failed to delete")
      }

      toast.success(t("deleteSuccess"))
      mutate()
    } catch {
      toast.error(t("deleteError"))
    } finally {
      setDeleting(false)
      setDeleteTarget(null)
    }
  }

  const handleCopy = async (code: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success(t("codeCopied"))
    } catch {
      toast.error("Failed to copy")
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t("createCode")}
        </Button>
      </div>

      {codes.length === 0 ? (
        <div className="text-center py-12 space-y-2">
          <TicketCheck className="h-12 w-12 mx-auto text-muted-foreground/50" />
          <p className="text-muted-foreground font-medium">
            {t("emptyState")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("emptyStateHint")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {codes.map((code) => {
            const isExpanded = expandedIds.has(code.id)
            return (
              <div
                key={code.id}
                className="border rounded-lg p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2 min-w-0">
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded truncate max-w-[240px] sm:max-w-none">
                      {code.code}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => handleCopy(code.code)}
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {getStatusBadge(code)}
                  </div>
                </div>

                {/* Info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                  <span>
                    {code.maxUses !== null
                      ? t("usedCountWithMax", {
                          used: code.usedCount,
                          max: code.maxUses,
                        })
                      : t("usedCount", { used: code.usedCount })}
                  </span>
                  <span>
                    {code.expiresAt
                      ? t("expiresAtLabel", {
                          date: formatLocalTime(code.expiresAt),
                        })
                      : t("noExpiry")}
                  </span>
                  {code.note && (
                    <span className="italic">{code.note}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={code.isActive}
                      onCheckedChange={() => handleToggleActive(code)}
                    />
                    <Label className="text-sm">
                      {code.isActive ? t("disable") : t("enable")}
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    {code.invitations.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleExpand(code.id)}
                      >
                        {t("invitedUsers")} ({code.invitations.length})
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 ml-1" />
                        ) : (
                          <ChevronDown className="h-4 w-4 ml-1" />
                        )}
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeleteTarget(code)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Invited Users List */}
                {isExpanded && code.invitations.length > 0 && (
                  <div className="border-t pt-3 space-y-2">
                    {code.invitations.map((inv) => (
                      <div
                        key={inv.id}
                        className="flex items-center gap-3"
                      >
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={inv.inviteeAvatar} />
                          <AvatarFallback className="text-xs">
                            {inv.inviteeName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{inv.inviteeName}</span>
                        <span className="text-xs text-muted-foreground">
                          {formatLocalTime(inv.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("createCode")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>{t("note")}</Label>
              <Input
                placeholder={t("notePlaceholder")}
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                maxLength={256}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("maxUses")}</Label>
              <Input
                type="number"
                placeholder={t("maxUsesPlaceholder")}
                value={newMaxUses}
                onChange={(e) => setNewMaxUses(e.target.value)}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("expiresAt")}</Label>
              <Input
                type="datetime-local"
                placeholder={t("expiresAtPlaceholder")}
                value={newExpiresAt}
                onChange={(e) => setNewExpiresAt(e.target.value)}
                className={cn(!newExpiresAt && "text-muted-foreground")}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCreateDialog(false)}
            >
              {t("cancel")}
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {creating ? t("creating") : t("createCode")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleting}>
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              {t("confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
