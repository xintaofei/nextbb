"use client"

import Image from "next/image"
import Link from "next/link"
import { useSidebar } from "@/components/ui/sidebar"

export function NavTop({
  width = 120,
  height = 80,
}: {
  width?: number
  height?: number
}) {
  const { isMobile, setOpenMobile } = useSidebar()

  return (
    <Link
      href="/"
      onClick={() => {
        if (isMobile) setOpenMobile(false)
      }}
    >
      <Image
        className="dark:invert"
        src="/nextbb-logo.png"
        alt="NextBB Logo"
        width={1024}
        height={326}
        style={{ width: width, height: "auto" }}
        priority
      />
    </Link>
  )
}
