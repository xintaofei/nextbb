"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import Link from "next/link"
import Image from "next/image"
import { AuthBranding } from "@/components/auth/auth-branding"
import { OAuthButtons } from "@/components/auth/oauth-buttons"

type LoginValues = {
  email: string
  password: string
}

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

  const schema = z.object({
    email: z.email(t("error.emailInvalid")),
    password: z.string().min(6, t("error.passwordMin")),
  })

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
        <AuthBranding />

        {/* Right Panel - Login Form */}
        <div className="flex items-center justify-center p-4 sm:p-8">
          <div className="w-full max-w-md space-y-4 animate-slideUp">
            {/* Mobile Logo */}
            <div className="lg:hidden flex flex-col items-center gap-4">
              <div className="relative w-32 h-32">
                <Image
                  src="/nextbb-logo.png"
                  alt="NextBB"
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
              <p className="text-muted-foreground">{t("welcomeBack")}</p>
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
                <span className="bg-background px-4 text-muted-foreground font-medium tracking-wider">
                  {t("or")}
                </span>
              </div>
            </div>

            <OAuthButtons
              githubText={t("oauthGithub")}
              googleText={t("oauthGoogle")}
              linuxdoText={t("oauthLinuxDo")}
              callbackUrl="/api/auth/bridge"
            />

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
