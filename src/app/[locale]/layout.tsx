import "../globals.css"
import type { Metadata } from "next"
import { ReactNode } from "react"
import { getLocale, getMessages } from "next-intl/server"
import { NextIntlClientProvider } from "next-intl"
import { ThemeProvider } from "next-themes"
import { getTranslations } from "next-intl/server"
import { Toaster } from "@/components/ui/sonner"
import { SWRProvider } from "@/components/providers/swr-provider"

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Index")
  return {
    title: t("title"),
    description: t("description"),
  }
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  const messages = await getMessages()
  const locale = await getLocale()
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SWRProvider>{children}</SWRProvider>
            <Toaster richColors closeButton />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
