"use client"

import { useState, useEffect } from "react"
import { useTranslations, useLocale } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { EmojiPickerField } from "@/components/common/emoji-picker-field"
import { CalendarIcon, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  format,
  addHours,
  addDays,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
} from "date-fns"
import { zhCN, enUS } from "date-fns/locale"

export type CustomStatus = {
  emoji: string
  statusText: string
  expiresAt: string
}

type CustomStatusDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStatus: CustomStatus
  onSave: (status: CustomStatus) => void
}

export function CustomStatusDialog({
  open,
  onOpenChange,
  initialStatus,
  onSave,
}: CustomStatusDialogProps) {
  const t = useTranslations("User.preferences.account")
  const locale = useLocale()
  const dateLocale = locale === "zh" ? zhCN : enUS

  const [status, setStatus] = useState<CustomStatus>(initialStatus)
  const [customDate, setCustomDate] = useState<Date | undefined>(undefined)
  const [customTime, setCustomTime] = useState({ hours: "12", minutes: "00" })
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setStatus(initialStatus)
      if (initialStatus.expiresAt && initialStatus.expiresAt !== "never") {
        const expiryDate = new Date(initialStatus.expiresAt)
        setCustomDate(expiryDate)
        setCustomTime({
          hours: String(expiryDate.getHours()).padStart(2, "0"),
          minutes: String(expiryDate.getMinutes()).padStart(2, "0"),
        })
      } else {
        setCustomDate(undefined)
        setCustomTime({ hours: "12", minutes: "00" })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const handleQuickOption = (value: string): void => {
    if (value === "never") {
      setCustomDate(undefined)
      setCustomTime({ hours: "12", minutes: "00" })
      return
    }

    const now = new Date()
    let targetDate: Date

    switch (value) {
      case "1hour":
        targetDate = addHours(now, 1)
        break
      case "4hours":
        targetDate = addHours(now, 4)
        break
      case "today":
        targetDate = new Date(now.setHours(23, 59, 59, 999))
        break
      case "1week":
        targetDate = addDays(now, 7)
        break
      case "1month":
        targetDate = addDays(now, 30)
        break
      default:
        return
    }

    setCustomDate(targetDate)
    setCustomTime({
      hours: String(targetDate.getHours()).padStart(2, "0"),
      minutes: String(targetDate.getMinutes()).padStart(2, "0"),
    })
  }

  const handleClearStatus = () => {
    setStatus({
      emoji: "",
      statusText: "",
      expiresAt: "never",
    })
    setCustomDate(undefined)
    setCustomTime({ hours: "12", minutes: "00" })
  }

  const handleSave = () => {
    let expiresAtValue = "never"

    if (customDate) {
      let dateTime = new Date(customDate)
      dateTime = setHours(dateTime, parseInt(customTime.hours, 10))
      dateTime = setMinutes(dateTime, parseInt(customTime.minutes, 10))
      dateTime = setSeconds(dateTime, 0)
      dateTime = setMilliseconds(dateTime, 0)
      expiresAtValue = dateTime.toISOString()
    }

    onSave({
      emoji: status.emoji,
      statusText: status.statusText,
      expiresAt: expiresAtValue,
    })
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("customStatus")}</DialogTitle>
          <DialogDescription>{t("customStatusHelper")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <EmojiPickerField
            label={t("emoji")}
            value={status.emoji || undefined}
            onChange={(emoji) =>
              setStatus((prev) => ({ ...prev, emoji: emoji || "" }))
            }
          />

          <div className="space-y-2">
            <Label htmlFor="statusText">{t("statusText")}</Label>
            <Input
              id="statusText"
              value={status.statusText}
              onChange={(e) =>
                setStatus((prev) => ({ ...prev, statusText: e.target.value }))
              }
              placeholder={t("customStatusPlaceholder")}
              maxLength={100}
            />
            <p className="text-xs text-muted-foreground text-right">
              {status.statusText.length}/100
            </p>
          </div>

          <div className="space-y-3">
            <Label>{t("statusExpiry")}</Label>

            <div className="space-y-2">
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !customDate && "text-muted-foreground"
                    )}
                    onClick={() => {
                      if (!customDate) {
                        const now = new Date()
                        setCustomDate(now)
                        setCustomTime({
                          hours: String(now.getHours()).padStart(2, "0"),
                          minutes: String(now.getMinutes()).padStart(2, "0"),
                        })
                      }
                    }}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customDate ? (
                      format(customDate, "PPP", { locale: dateLocale }) +
                      " " +
                      customTime.hours +
                      ":" +
                      customTime.minutes
                    ) : (
                      <span>{t("statusExpiryCustomPlaceholder")}</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <div className="p-3 space-y-3">
                    <Calendar
                      mode="single"
                      selected={customDate}
                      onSelect={setCustomDate}
                      locale={dateLocale}
                      disabled={(date) =>
                        date < new Date(new Date().setHours(0, 0, 0, 0))
                      }
                    />
                    <div className="flex items-center gap-2 px-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        max="23"
                        value={customTime.hours}
                        onChange={(e) => {
                          const value = Math.max(
                            0,
                            Math.min(23, parseInt(e.target.value) || 0)
                          )
                          setCustomTime((prev) => ({
                            ...prev,
                            hours: String(value).padStart(2, "0"),
                          }))
                        }}
                        className="w-16 text-center"
                        placeholder="HH"
                      />
                      <span>:</span>
                      <Input
                        type="number"
                        min="0"
                        max="59"
                        value={customTime.minutes}
                        onChange={(e) => {
                          const value = Math.max(
                            0,
                            Math.min(59, parseInt(e.target.value) || 0)
                          )
                          setCustomTime((prev) => ({
                            ...prev,
                            minutes: String(value).padStart(2, "0"),
                          }))
                        }}
                        className="w-16 text-center"
                        placeholder="MM"
                      />
                    </div>
                    <div className="flex justify-end gap-2 px-3 pb-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setDatePickerOpen(false)}
                      >
                        {t("cancel")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => setDatePickerOpen(false)}
                      >
                        {t("apply")}
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                {t("statusExpiryCustom")}
              </Label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "1hour", label: t("statusExpiry1Hour") },
                  { value: "4hours", label: t("statusExpiry4Hours") },
                  { value: "today", label: t("statusExpiryToday") },
                  { value: "1week", label: t("statusExpiry1Week") },
                  { value: "1month", label: t("statusExpiry1Month") },
                  { value: "never", label: t("statusExpiryNever") },
                ].map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickOption(option.value)}
                    className="w-full"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClearStatus}
            className="sm:mr-auto"
          >
            {t("clearStatus")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("cancel")}
          </Button>
          <Button type="button" onClick={handleSave}>
            {t("saveStatus")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
