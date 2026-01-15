import Image from "next/image"
import Link from "next/link"

export function NavTop({
  width = 120,
  height = 80,
}: {
  width?: number
  height?: number
}) {
  return (
    <Link href="/">
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
