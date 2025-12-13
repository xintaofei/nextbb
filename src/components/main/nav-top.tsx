import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { AudioWaveform } from "lucide-react"

export function NavTop() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex flex-row justify-between items-center p-2">
          <AudioWaveform className="size-6" />
          <SidebarTrigger className="-ml-1" />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
