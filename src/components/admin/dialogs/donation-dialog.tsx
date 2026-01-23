"use client"

import { useState, useEffect } from "react"
import { useTranslations } from "next-intl"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import type { DonationSource, DonationStatus } from "@prisma/client"

export interface DonationFormData {
  id?: string
  donorName: string | null
  donorEmail: string | null
  amount: string
  currency: string
  source: DonationSource
  status: DonationStatus
  externalId: string | null
  isAnonymous: boolean
  message: string | null
  adminNote: string | null
}

export interface DonationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  donation: DonationFormData | null
  onSuccess: () => void
}

const SOURCES: DonationSource[] = [
  "KOFI",
  "PATREON",
  "PAYPAL",
  "ALIPAY",
  "WECHAT_PAY",
  "BANK_TRANSFER",
  "CRYPTO",
  "OTHER",
]

const STATUSES: DonationStatus[] = [
  "PENDING",
  "CONFIRMED",
  "FAILED",
  "REFUNDED",
  "CANCELLED",
]

const CURRENCIES = ["CNY", "USD", "EUR", "GBP", "JPY"]

export function DonationDialog({
  open,
  onOpenChange,
  donation,
  onSuccess,
}: DonationDialogProps) {
  const t = useTranslations("AdminDonations")
  const [isSaving, setIsSaving] = useState(false)

  const [donorName, setDonorName] = useState("")
  const [donorEmail, setDonorEmail] = useState("")
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("CNY")
  const [source, setSource] = useState<DonationSource>("OTHER")
  const [status, setStatus] = useState<DonationStatus>("PENDING")
  const [externalId, setExternalId] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [message, setMessage] = useState("")
  const [adminNote, setAdminNote] = useState("")

  useEffect(() => {
    if (donation) {
      setDonorName(donation.donorName || "")
      setDonorEmail(donation.donorEmail || "")
      setAmount(donation.amount || "")
      setCurrency(donation.currency || "CNY")
      setSource(donation.source || "OTHER")
      setStatus(donation.status || "PENDING")
      setExternalId(donation.externalId || "")
      setIsAnonymous(donation.isAnonymous || false)
      setMessage(donation.message || "")
      setAdminNote(donation.adminNote || "")
    } else {
      setDonorName("")
      setDonorEmail("")
      setAmount("")
      setCurrency("CNY")
      setSource("OTHER")
      setStatus("PENDING")
      setExternalId("")
      setIsAnonymous(false)
      setMessage("")
      setAdminNote("")
    }
  }, [donation, open])

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t("dialog.error"))
      return
    }

    setIsSaving(true)
    try {
      const body = {
        donor_name: donorName || undefined,
        donor_email: donorEmail || undefined,
        amount: parseFloat(amount),
        currency,
        source,
        status,
        external_id: externalId || undefined,
        is_anonymous: isAnonymous,
        message: message || undefined,
        admin_note: adminNote || undefined,
      }

      const url = donation?.id
        ? `/api/admin/donations/${donation.id}`
        : "/api/admin/donations"
      const method = donation?.id ? "PATCH" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        throw new Error("Failed to save")
      }

      toast.success(t("dialog.success"))
      onSuccess()
    } catch (error) {
      console.error("Save donation error:", error)
      toast.error(t("dialog.error"))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {donation ? t("dialog.editTitle") : t("dialog.createTitle")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="donorName">{t("dialog.form.donorName")}</Label>
              <Input
                id="donorName"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                placeholder={t("dialog.form.donorNamePlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="donorEmail">{t("dialog.form.donorEmail")}</Label>
              <Input
                id="donorEmail"
                type="email"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                placeholder={t("dialog.form.donorEmailPlaceholder")}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t("dialog.form.amount")}</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={t("dialog.form.amountPlaceholder")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">{t("dialog.form.currency")}</Label>
              <Select value={currency} onValueChange={setCurrency}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source">{t("dialog.form.source")}</Label>
              <Select
                value={source}
                onValueChange={(v) => setSource(v as DonationSource)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SOURCES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`source.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">{t("dialog.form.status")}</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as DonationStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {t(`status.${s}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="externalId">{t("dialog.form.externalId")}</Label>
            <Input
              id="externalId"
              value={externalId}
              onChange={(e) => setExternalId(e.target.value)}
              placeholder={t("dialog.form.externalIdPlaceholder")}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="isAnonymous">{t("dialog.form.isAnonymous")}</Label>
            <Switch
              id="isAnonymous"
              checked={isAnonymous}
              onCheckedChange={setIsAnonymous}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">{t("dialog.form.message")}</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={t("dialog.form.messagePlaceholder")}
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adminNote">{t("dialog.form.adminNote")}</Label>
            <Textarea
              id="adminNote"
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              placeholder={t("dialog.form.adminNotePlaceholder")}
              rows={2}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            {t("dialog.cancel")}
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? t("dialog.saving") : t("dialog.save")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
