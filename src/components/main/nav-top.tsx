import Image from "next/image"

export function NavTop() {
  return (
    <Image
      className="dark:invert"
      src="/nextbb-logo.png"
      alt="Vercel logomark"
      width={120}
      height={80}
    />
  )
}
