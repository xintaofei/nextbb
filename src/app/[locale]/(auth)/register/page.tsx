"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { signIn } from "next-auth/react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
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
import { AuthBranding } from "@/components/auth/auth-branding"
import { OAuthButtons } from "@/components/auth/oauth-buttons"
import { useConfig } from "@/components/providers/config-provider"

type RegisterValues = {
  email: string
  password: string
  username: string
  emailCode: string
}

type RegisterSubmitValues = {
  email: string
  password: string
  username: string
  emailCode?: string
}

type ApiResponse = { success: true; email: string } | { error: string }

export default function RegisterPage() {
  const router = useRouter()
  const t = useTranslations("Auth.Register")
  const tLogin = useTranslations("Auth.Login")
  const [serverError, setServerError] = useState<string | null>(null)
  const [codeError, setCodeError] = useState<string | null>(null)
  const [sendingCode, setSendingCode] = useState(false)
  const [codeCooldown, setCodeCooldown] = useState(0)
  const [codeSent, setCodeSent] = useState(false)
  const { configs } = useConfig()

  const logoSrc = configs?.["basic.logo"] || "/nextbb-logo.png"
  const siteName = configs?.["basic.name"] || "NextBB"
  const registrationEnabled = configs?.["registration.enabled"] === true
  const emailVerifyEnabled = configs?.["registration.email_verify"] === true

  const schema = useMemo(() => {
    return z
      .object({
        email: z.email(t("error.emailInvalid")),
        password: z.string().min(8).max(72),
        username: z
          .string()
          .min(2)
          .max(32)
          .regex(
            /^[a-zA-Z0-9_\u4e00-\u9fa5-]+$/,
            "用户名只能包含字母、数字、下划线、中文和连字符"
          )
          .refine(
            (val) => {
              // 禁止URL路径分隔符和特殊字符
              const dangerousChars = /[\/\\?#@%&=+\s.,:;'"<>{}\[\]|`~!$^*()]/
              if (dangerousChars.test(val)) return false
              // 禁止以连字符开头或结尾(避免命令行参数注入)
              if (val.startsWith("-") || val.endsWith("-")) return false
              // 禁止连续连字符
              if (/--/.test(val)) return false
              return true
            },
            {
              message: "用户名包含不允许的字符或格式不正确",
            }
          ),
        emailCode: z.union([
          z.literal(""),
          z
            .string()
            .trim()
            .regex(/^\d{6}$/, { message: t("error.codeInvalid") }),
        ]),
      })
      .superRefine((data, ctx) => {
        if (emailVerifyEnabled && !data.emailCode) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["emailCode"],
            message: t("error.codeRequired"),
          })
        }
      })
  }, [emailVerifyEnabled, t])

  const form = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", username: "", emailCode: "" },
    mode: "onChange",
  })

  const emailValue = form.watch("email")
  const lastEmailRef = useRef("")

  useEffect(() => {
    if (!emailVerifyEnabled) return
    if (lastEmailRef.current !== emailValue) {
      if (lastEmailRef.current) {
        setCodeCooldown(0)
        setCodeSent(false)
        setCodeError(null)
        form.setValue("emailCode", "")
      }
      lastEmailRef.current = emailValue
    }
  }, [emailValue, emailVerifyEnabled, form])

  useEffect(() => {
    if (codeCooldown <= 0) return
    const timer = setTimeout(() => {
      setCodeCooldown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearTimeout(timer)
  }, [codeCooldown])

  const handleSendCode = async (): Promise<void> => {
    setCodeError(null)
    const isValid = await form.trigger("email")
    if (!isValid) return
    const email = form.getValues("email").trim()
    if (!email) return

    setSendingCode(true)
    try {
      const res = await fetch("/api/auth/register/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = (await res.json().catch(() => null)) as
        | { success: true; cooldown?: number; retryAfter?: number }
        | { error: string; retryAfter?: number }
        | null

      if (!res.ok || !data || "error" in data) {
        const errorMessage =
          data && "error" in data ? data.error : t("error.sendCodeFailed")
        if (res.status === 409 || res.status === 400) {
          form.setError("email", { message: errorMessage })
        } else {
          setCodeError(errorMessage)
        }
        if (data && "retryAfter" in data && data.retryAfter) {
          setCodeCooldown(data.retryAfter)
        }
        return
      }

      setCodeSent(true)
      setCodeCooldown(data.cooldown ?? 60)
    } catch (error) {
      console.error("Send code error:", error)
      setCodeError(t("error.sendCodeFailed"))
    } finally {
      setSendingCode(false)
    }
  }

  const onSubmit = async (values: RegisterValues): Promise<void> => {
    setServerError(null)
    setCodeError(null)
    const trimmedEmailCode = values.emailCode.trim()
    const payload = {
      email: values.email,
      password: values.password,
      username: values.username,
      emailCode: trimmedEmailCode ? trimmedEmailCode : undefined,
    } satisfies RegisterSubmitValues
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data: ApiResponse = await res.json()
    if (!res.ok || "error" in data) {
      setServerError("error" in data ? data.error : t("error.failed"))
      return
    }

    // 注册成功后自动登录
    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    if (result?.error) {
      setServerError(t("error.failed"))
      return
    }

    router.replace(`/`)
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-linear-to-br from-background via-background to-muted/20">
      <div className="relative min-h-screen grid lg:grid-cols-2 gap-8 lg:gap-0">
        <AuthBranding />

        {/* Right Panel - Register Form */}
        <div className="flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md space-y-4 animate-slideUp">
            {!registrationEnabled && (
              <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-medium text-center">
                {t("error.registrationNotEnabled")}
              </div>
            )}
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
              <p className="text-muted-foreground">{t("hintTitle")}</p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        {t("email")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder={t("emailPlaceholder")}
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {emailVerifyEnabled ? (
                  <FormField
                    control={form.control}
                    name="emailCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-sm font-medium">
                          {t("emailCode")}
                        </FormLabel>
                        <FormControl>
                          <div className="flex gap-2">
                            <Input
                              placeholder={t("emailCodePlaceholder")}
                              className="h-11"
                              inputMode="numeric"
                              autoComplete="one-time-code"
                              {...field}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              className="w-36 h-11 whitespace-nowrap"
                              disabled={
                                sendingCode ||
                                codeCooldown > 0 ||
                                !emailValue ||
                                !!form.formState.errors.email ||
                                form.formState.isSubmitting
                              }
                              onClick={handleSendCode}
                            >
                              {sendingCode ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : codeCooldown > 0 ? (
                                t("codeCooldown", { seconds: codeCooldown })
                              ) : codeSent ? (
                                t("resendCode")
                              ) : (
                                t("sendCode")
                              )}
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                        {codeError ? (
                          <div className="text-sm text-destructive">
                            {codeError}
                          </div>
                        ) : (
                          <div className="text-sm text-muted-foreground">
                            {t("codeHint")}
                          </div>
                        )}
                      </FormItem>
                    )}
                  />
                ) : null}
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        {t("password")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder={t("passwordPlaceholder")}
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
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        {t("username")}
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t("usernamePlaceholder")}
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
                  disabled={form.formState.isSubmitting || !registrationEnabled}
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    t("submit")
                  )}
                </Button>
              </form>
            </Form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-4 text-muted-foreground font-medium tracking-wider">
                  {tLogin("or")}
                </span>
              </div>
            </div>

            <OAuthButtons />

            <div className="text-center text-sm text-muted-foreground">
              {t("questionHaveAccount")}{" "}
              <Link
                href={`/login`}
                className="text-primary font-medium hover:underline transition-colors"
              >
                {t("toLogin")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
