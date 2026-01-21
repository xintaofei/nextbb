export function formatDateTime(iso: string, locale?: string): string {
  if (!iso) return ""
  const date = new Date(iso)
  return date.toLocaleString(locale || undefined, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
}

export function formatRelative(
  iso: string,
  t: (key: string, values?: Record<string, string | number | Date>) => string
): string {
  if (!iso) return ""
  const now = Date.now()
  const then = new Date(iso).getTime()
  const diff = Math.floor((now - then) / 1000)
  if (diff < 60) return t("Common.Time.second", { count: diff })
  if (diff < 3600)
    return t("Common.Time.minute", { count: Math.floor(diff / 60) })
  if (diff < 86400)
    return t("Common.Time.hour", { count: Math.floor(diff / 3600) })
  return t("Common.Time.day", { count: Math.floor(diff / 86400) })
}

// 格式化为 YYYY-MM-DD HH:mm (本地时间)
export function formatLocalTime(isoString: string): string {
  const date = new Date(isoString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day} ${hours}:${minutes}`
}
