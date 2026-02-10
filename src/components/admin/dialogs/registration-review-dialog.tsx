"use client"

import { memo, useState, type ReactElement } from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { RegistrationApplicationItem } from "@/components/admin/tables/registration-application-table"

export type RegistrationReviewDialogProps = {
  open: boolean
  action: "approve" | "reject"
  application: RegistrationApplicationItem | null
  isSubmitting: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (reason: string) => Promise<void>
}

function RegistrationReviewDialogComponent({
  open,
  action,
  application,
  isSubmitting,
  onOpenChange,
  onSubmit,
}: RegistrationReviewDialogProps): ReactElement {
  const t = useTranslations("AdminRegistrationApplications")
  const [reason, setReason] = useState("")

  const title =
    action === "approve" ? t("dialog.titleApprove") : t("dialog.titleReject")
  const submitLabel =
    action === "approve" ? t("dialog.submitApprove") : t("dialog.submitReject")

  const handleSubmit = async (): Promise<void> => {
    if (reason.trim().length === 0 || !application) return
    await onSubmit(reason)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          setReason("")
        }
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            {application
              ? `${application.username} (${application.email})`
              : ""}
          </div>
          <div className="space-y-2">
            <Label htmlFor="review-reason">{t("dialog.reasonLabel")}</Label>
            <Textarea
              id="review-reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder={t("dialog.reasonPlaceholder")}
              className="min-h-28"
              maxLength={500}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              {t("dialog.cancel")}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || reason.trim().length === 0}
            >
              {submitLabel}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export const RegistrationReviewDialog = memo(RegistrationReviewDialogComponent)
