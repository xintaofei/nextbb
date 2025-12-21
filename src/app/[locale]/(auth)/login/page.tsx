"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

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
  const locale = useLocale()
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
    router.replace(`/${locale}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("email")}</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder={t("emailPlaceholder")}
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
                    <FormLabel>{t("password")}</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={t("passwordPlaceholder")}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {serverError ? (
                <div className="text-destructive text-sm">{serverError}</div>
              ) : null}
              <Button type="submit" className="w-full">
                {t("submit")}
              </Button>
            </form>
          </Form>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-card px-2 text-muted-foreground">
                {t("or")}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-2">
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                signIn("github", {
                  callbackUrl: `/api/auth/bridge?locale=${locale}`,
                })
              }
            >
              {t("oauthGithub")}
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={() =>
                signIn("google", {
                  callbackUrl: `/api/auth/bridge?locale=${locale}`,
                })
              }
            >
              {t("oauthGoogle")}
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            {t("questionNoAccount")}{" "}
            <Link href={`/${locale}/register`} className="text-primary">
              {t("toRegister")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
