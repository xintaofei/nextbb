import { ReactNode } from "react"
import { SideNav } from "@/components/main/side-nav"
import { MobileHeader } from "@/components/main/mobile-header"

export default function MainLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <div className="flex min-h-screen w-full max-w-7xl mx-auto flex-col sm:flex-row">
      <SideNav />
      <main className="flex-1 w-full min-w-0 border-x flex flex-col">
        <MobileHeader />
        <div className="flex-1">{children}</div>
      </main>
    </div>
  )
}
