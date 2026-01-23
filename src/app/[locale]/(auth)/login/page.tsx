"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn } from "next-auth/react"
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
import Link from "next/link"
import Image from "next/image"

const schema = z.object({
  email: z.email(),
  password: z.string().min(6),
})

type LoginValues = z.infer<typeof schema>

type ApiUser = {
  id: string
  email?: string | null
}

type ApiProfile = {
  id: string
  email: string
  username: string
  avatar?: string | null
}

type ApiResponse =
  | { user: ApiUser; profile?: ApiProfile | null }
  | { error: string }

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations("Auth.Login")
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
    mode: "onChange",
  })

  const onSubmit = async (values: LoginValues) => {
    setServerError(null)
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
    const data: ApiResponse = await res.json()
    if (!res.ok || "error" in data) {
      setServerError("error" in data ? data.error : t("error.failed"))
      return
    }
    router.replace(`/`)
  }

  return (
    <div className="min-h-screen relative overflow-hidden bg-linear-to-br from-background via-background to-muted/20">
      <div className="relative min-h-screen grid lg:grid-cols-2 gap-8 lg:gap-0">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex flex-col justify-between p-12 xl:p-16 border-r border-border/40 relative overflow-hidden bg-gray-100 dark:bg-gray-900">
          {/* Wave Background - 波浪背景 */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {/* 波浪层 1 - 最慢最淡 */}
            <svg
              className="absolute top-[66%] left-0 w-full h-[34%] opacity-20 animate-wave1"
              preserveAspectRatio="none"
              viewBox="0 0 1200 400"
            >
              <path
                d="M0,80 C300,40 600,120 900,80 C1050,60 1200,80 1200,80 L1200,400 L0,400 Z"
                fill="currentColor"
                className="text-gray-300 dark:text-gray-700"
              />
            </svg>

            {/* 波浪层 2 - 中速中等 */}
            <svg
              className="absolute top-[66%] left-0 w-full h-[34%] opacity-15 animate-wave2"
              preserveAspectRatio="none"
              viewBox="0 0 1200 400"
            >
              <path
                d="M0,60 C400,100 800,20 1200,60 L1200,400 L0,400 Z"
                fill="currentColor"
                className="text-gray-400 dark:text-gray-600"
              />
            </svg>

            {/* 波浪层 3 - 最快最深 */}
            <svg
              className="absolute top-[66%] left-0 w-full h-[34%] opacity-10 animate-wave3"
              preserveAspectRatio="none"
              viewBox="0 0 1200 400"
            >
              <path
                d="M0,70 C500,30 700,110 1200,70 L1200,400 L0,400 Z"
                fill="currentColor"
                className="text-gray-500 dark:text-gray-500"
              />
            </svg>
          </div>

          <div className="space-y-8 animate-fadeIn relative z-10">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <Image
                  src="/nextbb-logo.png"
                  alt="NextBB"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="font-serif text-3xl font-bold tracking-tight">
                NextBB
              </div>
            </div>

            <div className="space-y-4 max-w-md">
              <h1 className="font-serif text-5xl xl:text-6xl font-bold leading-tight tracking-tight">
                Modern forum,{" "}
                <span className="text-primary relative inline-block">
                  reimagined
                  <div className="absolute -bottom-2 left-0 right-0 h-1 bg-primary/20" />
                </span>
              </h1>
              <p className="text-lg text-muted-foreground leading-relaxed">
                A next-generation community platform built with cutting-edge
                technology for meaningful conversations.
              </p>
            </div>
          </div>

          <div className="space-y-6 text-sm text-muted-foreground relative z-10">
            <div className="flex items-center gap-8">
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">Fast</div>
                <div>Built on Next.js 16</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">Secure</div>
                <div>Enterprise-grade auth</div>
              </div>
              <div className="space-y-1">
                <div className="text-2xl font-bold text-foreground">Modern</div>
                <div>Beautiful interface</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel - Login Form */}
        <div className="flex items-center justify-center p-6 sm:p-12">
          <div className="w-full max-w-md space-y-8 animate-slideUp">
            {/* Mobile Logo */}
            <div className="lg:hidden flex flex-col items-center gap-4 mb-8">
              <div className="relative w-16 h-16">
                <Image
                  src="/nextbb-logo.png"
                  alt="NextBB"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="font-serif text-3xl font-bold tracking-tight">
                NextBB
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="font-serif text-4xl font-bold tracking-tight">
                {t("title")}
              </h2>
              <p className="text-muted-foreground">
                Welcome back. Sign in to continue your journey.
              </p>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-5"
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
                {serverError ? (
                  <div className="px-4 py-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm font-medium">
                    {serverError}
                  </div>
                ) : null}
                <Button type="submit" className="w-full h-11 font-medium">
                  {t("submit")}
                </Button>
              </form>
            </Form>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-3 text-muted-foreground font-medium tracking-wider">
                  {t("or")}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full h-11 gap-3 font-medium"
                onClick={() =>
                  signIn("github", {
                    callbackUrl: `/api/auth/bridge`,
                  })
                }
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
                <span>{t("oauthGithub")}</span>
              </Button>

              <Button
                variant="outline"
                className="w-full h-11 gap-3 font-medium"
                onClick={() =>
                  signIn("google", {
                    callbackUrl: `/api/auth/bridge`,
                  })
                }
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                <span>{t("oauthGoogle")}</span>
              </Button>

              <Button
                variant="outline"
                className="w-full h-11 gap-3 font-medium"
                onClick={() =>
                  signIn("linuxdo", {
                    callbackUrl: `/api/auth/bridge`,
                  })
                }
              >
                <svg
                  className="w-5 h-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z" />
                </svg>
                <span>{t("oauthLinuxDo")}</span>
              </Button>
            </div>

            <div className="text-center text-sm text-muted-foreground">
              {t("questionNoAccount")}{" "}
              <Link
                href={`/register`}
                className="text-primary font-medium hover:underline transition-colors"
              >
                {t("toRegister")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
