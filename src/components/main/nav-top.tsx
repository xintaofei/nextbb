"use client"

import Image from "next/image"
import Link from "next/link"
import { useSidebar } from "@/components/ui/sidebar"
import { useConfig } from "@/components/providers/config-provider"

export function NavTop({ width = 120 }: { width?: number }) {
  const { isMobile, setOpenMobile } = useSidebar()
  const { configs } = useConfig()

  const logoSrc = configs?.["basic.logo"] || "/nextbb-logo.png"
  const siteName = configs?.["basic.name"] || "NextBB"

  return (
    <Link
      href="/"
      onClick={() => {
        if (isMobile) setOpenMobile(false)
      }}
    >
      <Image
        className="dark:invert"
        src={logoSrc}
        alt={`${siteName} Logo`}
        width={1024}
        height={326}
        style={{ width: width, height: "auto" }}
        priority
      />
    </Link>
  )
}
