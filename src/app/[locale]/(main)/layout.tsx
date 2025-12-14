import { ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/main/app-sidebar"

export default function MainLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <div className="max-w-[86rem] mx-auto">
      <SidebarProvider>
        <AppSidebar variant="floating" />
        <SidebarInset>{children}</SidebarInset>
      </SidebarProvider>
    </div>
  )
}
