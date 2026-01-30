import { ReactNode } from "react"
import { SideNav } from "@/components/main/side-nav"
import { MobileHeader } from "@/components/main/mobile-header"
import { Aside } from "@/components/main/aside"
import { NewTopicProvider } from "@/components/providers/new-topic-provider"

export default function MainLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <NewTopicProvider>
      <div className="flex min-h-screen w-full max-w-7xl mx-auto flex-col sm:flex-row">
        <SideNav />
        <main className="flex-1 w-full min-w-0 border-x flex flex-col">
          <MobileHeader />
          <div className="flex-1">{children}</div>
        </main>
        <Aside />
      </div>
    </NewTopicProvider>
  )
}
