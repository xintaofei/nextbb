"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"
import { Loader2 } from "lucide-react"
import { AuthBranding } from "@/components/auth/auth-branding"
import { useConfig } from "@/components/providers/config-provider"
import { toast } from "sonner"

type ResetPasswordValues = {
  newPassword: string
  confirmPassword: string
}

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations("Auth.PasswordReset")
  const token = searchParams.get("token")
  const [serverError, setServerError] = useState<string | null>(null)
  const [resetSuccess, setResetSuccess] = useState(false)
  const { configs } = useConfig()

  const logoSrc = configs?.["basic.logo"] || "/nextbb-logo.png"
  const siteName = configs?.["basic.name"] || "NextBB"

  useEffect(() => {
    if (!token) {
      router.replace("/login")
    }
  }, [token, router])

  const schema = useMemo(
    () =>
      z
        .object({
          newPassword: z
            .string()
            .min(8, t("error.passwordMin"))
            .max(72, t("error.passwordMax"))
            .refine(
              (val) => new TextEncoder().encode(val).length <= 72,
              t("error.passwordMax")
            ),
          confirmPassword: z.string(),
        })
        .refine((data) => data.newPassword === data.confirmPassword, {
          message: t("error.passwordMismatch"),
          path: ["confirmPassword"],
        }),
    [t]
  )

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
    mode: "onChange",
  })

  const onSubmit = async (values: ResetPasswordValues) => {
    setServerError(null)

    try {
      const response = await fetch("/api/auth/password-reset/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          newPassword: values.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setServerError(data.error || t("error.resetFailed"))
        return
      }

      setResetSuccess(true)
      toast.success(t("success"))
    } catch {
      setServerError(t("error.resetFailed"))
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">{t("noToken")}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-linear-to-br from-background via-background to-muted/20">
      <div className="relative min-h-screen grid lg:grid-cols-2 gap-8 lg:gap-0">
        <AuthBranding />

        <div className="flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md space-y-4 animate-slideUp">
            {/* Mobile Logo */}
            <div className="lg:hidden flex flex-col items-center gap-4">
              <div className="relative w-32 h-32">
                <Image
                  src={logoSrc}
                  alt={`${siteName} Logo`}
                  fill
                  className="object-contain"
                  priority
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="font-serif text-4xl font-bold tracking-tight">
                {t("title")}
              </h2>
              <p className="text-muted-foreground">{t("description")}</p>
            </div>

            {resetSuccess ? (
              <div className="space-y-4">
                <div className="px-4 py-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg text-green-700 dark:text-green-400 text-sm font-medium">
                  {t("success")}
                </div>
                <Button asChild className="w-full h-11 font-medium">
                  <Link href="/login">{t("backToLogin")}</Link>
                </Button>
              </div>
            ) : (
              <>
                <Form {...form}>
                  <form
                    onSubmit={form.handleSubmit(onSubmit)}
                    className="space-y-4"
                  >
                    <FormField
                      control={form.control}
                      name="newPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {t("newPassword")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={t("newPasswordPlaceholder")}
                              className="h-11"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="confirmPassword"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            {t("confirmPassword")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="password"
                              placeholder={t("confirmPasswordPlaceholder")}
                              className="h-11"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {serverError ? (
                      <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-medium">
                        {serverError}
                      </div>
                    ) : null}
                    <Button
                      type="submit"
                      className="w-full h-11 font-medium"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        t("submit")
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="text-center text-sm text-muted-foreground">
                  <Link
                    href="/login"
                    className="text-primary font-medium hover:underline transition-colors"
                  >
                    {t("backToLogin")}
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
