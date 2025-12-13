import "../globals.css"
import type { Metadata } from "next"
import { ReactNode } from "react"
import { getLocale, getMessages } from "next-intl/server"
import { NextIntlClientProvider } from "next-intl"
import { ThemeProvider } from "next-themes"

export const metadata: Metadata = {
  title: "NextBB",
  description: "Next bulletin board",
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
            {children}
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
