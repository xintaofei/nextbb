import { ReactNode } from "react"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/main/app-sidebar"

export default function MainLayout({
  children,
}: Readonly<{
  children: ReactNode
}>) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <main className="max-w-5xl mx-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}
