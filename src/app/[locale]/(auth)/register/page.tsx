"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import Link from "next/link"

const schema = z.object({
  email: z.email(),
  password: z.string().min(8).max(72),
  username: z.string().min(2).max(32),
})

type RegisterValues = z.infer<typeof schema>

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

export default function RegisterPage() {
  const router = useRouter()
  const locale = useLocale()
  const [serverError, setServerError] = useState<string | null>(null)

  const form = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "", username: "" },
    mode: "onChange",
  })

  const onSubmit = async (values: RegisterValues) => {
    setServerError(null)
    const payload = {
      email: values.email,
      password: values.password,
      username: values.username,
    }
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
    const data: ApiResponse = await res.json()
    if (!res.ok || "error" in data) {
      setServerError("error" in data ? data.error : "注册失败")
      return
    }
    router.replace(`/${locale}`)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>注册</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="name@example.com"
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
                    <FormLabel>密码</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="请输入密码"
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
                    <FormLabel>用户名</FormLabel>
                    <FormControl>
                      <Input placeholder="请输入用户名" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {serverError ? (
                <div className="text-destructive text-sm">{serverError}</div>
              ) : null}
              <Button type="submit" className="w-full">
                注册
              </Button>
            </form>
          </Form>
          <Alert>
            <AlertTitle>支持社交账号一键注册</AlertTitle>
            <AlertDescription>
              使用 GitHub 或 Google 登录后，将自动创建账号并完成登录。
            </AlertDescription>
          </Alert>
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
              使用 GitHub 一键注册
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
              使用 Google 一键注册
            </Button>
          </div>
          <div className="text-sm text-muted-foreground">
            已有账号？{" "}
            <Link href={`/${locale}/login`} className="text-primary">
              去登录
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
