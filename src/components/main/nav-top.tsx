import Image from "next/image"

export function NavTop({
  width = 120,
  height = 80,
}: {
  width?: number
  height?: number
}) {
  return (
    <Image
      className="dark:invert"
      src="/nextbb-logo.png"
      alt="Vercel logomark"
      width={width}
      height={height}
    />
  )
}
