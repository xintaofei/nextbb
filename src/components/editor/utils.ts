export const parseContent = (value: string | undefined) => {
  if (!value) return ""
  try {
    const parsed = JSON.parse(value)
    if (
      parsed &&
      typeof parsed === "object" &&
      parsed.type === "doc" &&
      Array.isArray(parsed.content)
    ) {
      return parsed
    }
  } catch {
    // Not JSON, treat as markdown
  }
  return value
}

export const calculatePopoverStyle = (
  x: number,
  y: number,
  isOpen: boolean
): React.CSSProperties => {
  if (!isOpen || typeof window === "undefined") return {}

  const height = 400 // estimated max height
  const gap = 10
  const windowHeight = window.innerHeight
  const bottomSpace = windowHeight - y

  const shouldFlip = bottomSpace < height && y > height

  return {
    position: "fixed" as const,
    left: `${x}px`,
    zIndex: 99999,
    pointerEvents: "auto" as const,
    ...(shouldFlip
      ? { bottom: `${windowHeight - y + gap}px`, top: "auto" }
      : { top: `${y + gap}px`, bottom: "auto" }),
  }
}
