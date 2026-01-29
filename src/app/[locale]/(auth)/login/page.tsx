"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useTranslations } from "next-intl"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { signIn, useSession } from "next-auth/react"
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
import { Loader2 } from "lucide-react"
import { AuthBranding } from "@/components/auth/auth-branding"
import { OAuthButtons } from "@/components/auth/oauth-buttons"
import { useConfig } from "@/components/providers/config-provider"

type LoginValues = {
  email: string
  password: string
}

export default function LoginPage() {
  const router = useRouter()
  const t = useTranslations("Auth.Login")
  const [serverError, setServerError] = useState<string | null>(null)
  const { configs } = useConfig()
  const { update } = useSession()

  const logoSrc = configs?.["basic.logo"] || "/nextbb-logo.png"
  const siteName = configs?.["basic.name"] || "NextBB"

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

    const result = await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    })

    if (result?.error) {
      setServerError(t("error.failed"))
      return
    }

    // 强制更新 NextAuth session，确保客户端立即获取最新状态
    await update()

    // 使用客户端路由跳转，提供流畅的用户体验
    router.push("/")
    // 触发服务端组件刷新，确保服务端也能获取最新 session
    router.refresh()
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

            <OAuthButtons />

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
