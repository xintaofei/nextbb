import "@/app/globals.css"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { ReactNode } from "react"
import { getLocale, getMessages } from "next-intl/server"
import { NextIntlClientProvider } from "next-intl"
import { ThemeProvider } from "next-themes"
import { Toaster } from "@/components/ui/sonner"
import { SWRProvider } from "@/components/providers/swr-provider"
import NextTopLoader from "nextjs-toploader"
import { getPublicConfigs } from "@/lib/config"
import { ConfigProvider } from "@/components/providers/config-provider"
import { NewTopicProvider } from "@/components/providers/new-topic-provider"

export async function generateMetadata(): Promise<Metadata> {
  const configs = await getPublicConfigs()
  return {
    title: configs["basic.name"],
    description: configs["basic.description"],
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const messages = await getMessages()
  const locale = await getLocale()
  const configs = await getPublicConfigs()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`antialiased`}>
        <NextTopLoader
          color="var(--color-muted-foreground)" // 进度条颜色
          initialPosition={0.08} // 初始位置
          crawlSpeed={200} // 爬行速度
          height={3} // 进度条高度 (px)
          showSpinner={false} // 是否显示右侧的加载小圆圈
          easing="ease" // 动画效果
          speed={200} // 动画速度
          shadow="0 0 10px var(--color-muted-foreground),0 0 5px var(--color-muted-foreground)" // 进度条阴影
        />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ConfigProvider initialConfigs={configs}>
              <SWRProvider>
                <NewTopicProvider>{children}</NewTopicProvider>
              </SWRProvider>
            </ConfigProvider>
            <Toaster richColors closeButton />
            <Analytics />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
