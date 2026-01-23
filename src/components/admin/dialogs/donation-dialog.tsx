"use client"

import { useState, useEffect, useMemo } from "react"
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "sonner"
import { Search, Check, X } from "lucide-react"
import type { DonationSource, DonationStatus } from "@prisma/client"

export interface DonationFormData {
  id?: string
  userId: string | null
  userName: string | null
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

type UserListItem = {
  id: string
  name: string
  email: string
  avatar: string
}

type UserListResult = {
  items: UserListItem[]
  total: number
}

const userFetcher = async (url: string): Promise<UserListResult> => {
  const res = await fetch(url)
  if (!res.ok) throw new Error("Failed to fetch")
  return res.json()
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

type DonorType = "guest" | "registered"

export function DonationDialog({
  open,
  onOpenChange,
  donation,
  onSuccess,
}: DonationDialogProps) {
  const t = useTranslations("AdminDonations")
  const [isSaving, setIsSaving] = useState(false)

  const [donorType, setDonorType] = useState<DonorType>("guest")
  const [donorName, setDonorName] = useState("")
  const [donorEmail, setDonorEmail] = useState("")
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserName, setSelectedUserName] = useState<string | null>(null)
  const [userSearchQuery, setUserSearchQuery] = useState("")
  const [showUserDropdown, setShowUserDropdown] = useState(false)
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("CNY")
  const [source, setSource] = useState<DonationSource>("OTHER")
  const [status, setStatus] = useState<DonationStatus>("PENDING")
  const [externalId, setExternalId] = useState("")
  const [isAnonymous, setIsAnonymous] = useState(false)
  const [message, setMessage] = useState("")
  const [adminNote, setAdminNote] = useState("")

  const userSearchUrl = useMemo(() => {
    if (!open || donorType !== "registered" || userSearchQuery.length < 1) {
      return null
    }
    return `/api/admin/users?q=${encodeURIComponent(userSearchQuery)}&pageSize=10`
  }, [open, donorType, userSearchQuery])

  const { data: userSearchResult } = useSWR<UserListResult>(
    userSearchUrl,
    userFetcher
  )

  useEffect(() => {
    if (donation) {
      if (donation.userId) {
        setDonorType("registered")
        setSelectedUserId(donation.userId)
        setSelectedUserName(donation.userName)
        setDonorName("")
        setDonorEmail("")
      } else {
        setDonorType("guest")
        setSelectedUserId(null)
        setSelectedUserName(null)
        setDonorName(donation.donorName || "")
        setDonorEmail(donation.donorEmail || "")
      }
      setAmount(donation.amount || "")
      setCurrency(donation.currency || "CNY")
      setSource(donation.source || "OTHER")
      setStatus(donation.status || "PENDING")
      setExternalId(donation.externalId || "")
      setIsAnonymous(donation.isAnonymous || false)
      setMessage(donation.message || "")
      setAdminNote(donation.adminNote || "")
    } else {
      setDonorType("guest")
      setDonorName("")
      setDonorEmail("")
      setSelectedUserId(null)
      setSelectedUserName(null)
      setUserSearchQuery("")
      setAmount("")
      setCurrency("CNY")
      setSource("OTHER")
      setStatus("PENDING")
      setExternalId("")
      setIsAnonymous(false)
      setMessage("")
      setAdminNote("")
    }
    setShowUserDropdown(false)
  }, [donation, open])

  const handleDonorTypeChange = (value: DonorType) => {
    setDonorType(value)
    if (value === "guest") {
      setSelectedUserId(null)
      setSelectedUserName(null)
      setUserSearchQuery("")
    } else {
      setDonorName("")
      setDonorEmail("")
    }
  }

  const handleSelectUser = (user: UserListItem) => {
    setSelectedUserId(user.id)
    setSelectedUserName(user.name)
    setUserSearchQuery("")
    setShowUserDropdown(false)
  }

  const handleClearUser = () => {
    setSelectedUserId(null)
    setSelectedUserName(null)
    setUserSearchQuery("")
  }

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error(t("dialog.error"))
      return
    }

    setIsSaving(true)
    try {
      const body: Record<string, unknown> = {
        amount: parseFloat(amount),
        currency,
        source,
        status,
        external_id: externalId || undefined,
        is_anonymous: isAnonymous,
        message: message || undefined,
        admin_note: adminNote || undefined,
      }

      if (donorType === "registered" && selectedUserId) {
        body.user_id = selectedUserId
        body.donor_name = undefined
        body.donor_email = undefined
      } else {
        body.user_id = undefined
        body.donor_name = donorName || undefined
        body.donor_email = donorEmail || undefined
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
          <div className="space-y-3">
            <Label>{t("dialog.form.donorType")}</Label>
            <RadioGroup
              value={donorType}
              onValueChange={(v) => handleDonorTypeChange(v as DonorType)}
              className="flex gap-4"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="guest" id="donor-guest" />
                <Label htmlFor="donor-guest" className="cursor-pointer">
                  {t("dialog.form.guestDonor")}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="registered" id="donor-registered" />
                <Label htmlFor="donor-registered" className="cursor-pointer">
                  {t("dialog.form.registeredDonor")}
                </Label>
              </div>
            </RadioGroup>
          </div>

          {donorType === "guest" ? (
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
                <Label htmlFor="donorEmail">
                  {t("dialog.form.donorEmail")}
                </Label>
                <Input
                  id="donorEmail"
                  type="email"
                  value={donorEmail}
                  onChange={(e) => setDonorEmail(e.target.value)}
                  placeholder={t("dialog.form.donorEmailPlaceholder")}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>{t("dialog.form.selectUser")}</Label>
              {selectedUserId ? (
                <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/50">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="flex-1">{selectedUserName}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearUser}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={userSearchQuery}
                    onChange={(e) => {
                      setUserSearchQuery(e.target.value)
                      setShowUserDropdown(true)
                    }}
                    onFocus={() => setShowUserDropdown(true)}
                    placeholder={t("dialog.form.searchUserPlaceholder")}
                    className="pl-9"
                  />
                  {showUserDropdown &&
                    userSearchQuery.length > 0 &&
                    userSearchResult &&
                    userSearchResult.items.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 border rounded-md bg-popover shadow-md">
                        <ScrollArea className="max-h-64 overflow-y-scroll">
                          {userSearchResult.items.map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-accent"
                              onClick={() => handleSelectUser(user)}
                            >
                              <div className="flex-1">
                                <div className="font-medium">{user.name}</div>
                                <div className="text-xs text-muted-foreground">
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    )}
                  {showUserDropdown &&
                    userSearchQuery.length > 0 &&
                    userSearchResult &&
                    userSearchResult.items.length === 0 && (
                      <div className="absolute z-50 w-full mt-1 border rounded-md bg-popover shadow-md p-3 text-center text-sm text-muted-foreground">
                        {t("dialog.form.noUserFound")}
                      </div>
                    )}
                </div>
              )}
            </div>
          )}

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

        <div className="flex justify-end gap-2 pt-4">
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
