"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Loader2, Mail, KeyRound } from "lucide-react"

type PasswordResetCardProps = {
  hasPassword: boolean
}

export function PasswordResetCard({ hasPassword }: PasswordResetCardProps) {
  const t = useTranslations("User.preferences.security.passwordManagement")
  const [sending, setSending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [emailSent, setEmailSent] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [])

  const startCooldown = useCallback((seconds: number) => {
    setCooldown(seconds)
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }, [])

  const handleSendResetEmail = useCallback(async () => {
    setSending(true)
    try {
      const response = await fetch("/api/auth/password-reset/send", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 429 && data.retryAfter) {
          startCooldown(data.retryAfter)
          toast.warning(t("sendTooFrequent"))
        } else {
          toast.error(data.error || t("sendError"))
        }
        return
      }

      setEmailSent(true)
      if (data.cooldown) {
        startCooldown(data.cooldown)
      }
      toast.success(t("emailSent"))
    } catch {
      toast.error(t("sendError"))
    } finally {
      setSending(false)
    }
  }, [startCooldown, t])

  const isDisabled = sending || cooldown > 0

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("title")}</h3>
      <p className="text-sm text-muted-foreground">
        {hasPassword ? t("descriptionHasPassword") : t("descriptionNoPassword")}
      </p>

      {emailSent ? (
        <div className="flex items-start gap-3 p-4 border rounded-lg bg-muted/30">
          <Mail className="h-5 w-5 text-primary mt-0.5 shrink-0" />
          <p className="text-sm text-muted-foreground">{t("emailSent")}</p>
        </div>
      ) : null}

      <Button
        variant="outline"
        onClick={handleSendResetEmail}
        disabled={isDisabled}
      >
        {sending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            {t("sending")}
          </>
        ) : cooldown > 0 ? (
          t("cooldown", { seconds: cooldown })
        ) : (
          <>
            <KeyRound className="h-4 w-4 mr-2" />
            {t("sendResetEmail")}
          </>
        )}
      </Button>
    </div>
  )
}
