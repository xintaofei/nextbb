import { put } from "@vercel/blob"

const MAX_SIZE = 5 * 1024 * 1024

function getExtFromContentType(ct: string | null): string {
  if (!ct) return "jpg"
  if (ct.includes("png")) return "png"
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg"
  if (ct.includes("webp")) return "webp"
  if (ct.includes("gif")) return "gif"
  return "jpg"
}

export async function uploadAvatarFromUrl(
  id: bigint,
  srcUrl: string
): Promise<string> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 10000)
  try {
    const res = await fetch(srcUrl, { signal: controller.signal })
    if (!res.ok) throw new Error("avatar fetch failed")
    const ct = res.headers.get("content-type")
    const lenHeader = res.headers.get("content-length")
    const len = lenHeader ? parseInt(lenHeader, 10) : undefined
    if (len && Number.isFinite(len) && len > MAX_SIZE) {
      throw new Error("avatar too large")
    }
    const ab = await res.arrayBuffer()
    if (ab.byteLength > MAX_SIZE) {
      throw new Error("avatar too large")
    }
    const ext = getExtFromContentType(ct)
    const idStr = id.toString()
    const key = `avatars/${idStr}.${ext}`
    const { url } = await put(key, ab, {
      access: "public",
      contentType: ct ?? "image/jpeg",
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })
    return url
  } finally {
    clearTimeout(timer)
  }
}
