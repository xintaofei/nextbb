import { ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/main/app-sidebar"
import { MobileSidebarTrigger } from "@/components/main/mobile-sidebar-trigger"

export default function MainLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <div className="max-w-5xl mx-auto">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <MobileSidebarTrigger />
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
