import { NextResponse } from "next/server"
import { getServerSessionUser } from "@/lib/server-auth"
import { StorageService, getDefaultProvider } from "@/lib/storage"

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]

function getExtFromContentType(ct: string): string {
  if (ct.includes("png")) return "png"
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg"
  if (ct.includes("webp")) return "webp"
  if (ct.includes("gif")) return "gif"
  return "jpg"
}

export async function POST(req: Request) {
  // Verify user authentication (admin only)
  const session = await getServerSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const groupCode = formData.get("groupCode") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!groupCode) {
      return NextResponse.json(
        { error: "Group code is required" },
        { status: 400 }
      )
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error: "Invalid file type. Only JPG, PNG, WEBP and GIF are allowed",
        },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 2MB limit" },
        { status: 400 }
      )
    }

    let url: string
    let path: string

    // Check if storage provider is configured
    const provider = await getDefaultProvider()

    if (provider) {
      // Use new StorageService
      const result = await StorageService.upload(file, {
        referenceType: "EXPRESSION",
        userId: session.userId,
        subPath: groupCode,
        originalFilename: file.name,
      })
      url = result.url
      path = result.storageKey
    } else {
      // Fallback to legacy Vercel Blob if no provider configured
      const { put } = await import("@vercel/blob")

      const arrayBuffer = await file.arrayBuffer()
      const ext = getExtFromContentType(file.type)
      const filename = `${crypto.randomUUID()}.${ext}`
      path = `expressions/${groupCode}/${filename}`

      const result = await put(path, arrayBuffer, {
        access: "public",
        contentType: file.type,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      })
      url = result.url
    }

    // Get image dimensions using Image API
    const width: number | null = null
    const height: number | null = null

    // Note: Image dimensions should be detected on the client side before upload
    // This is just returning the path for database storage

    return NextResponse.json(
      {
        url,
        path,
        width,
        height,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Expression image upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    )
  }
}
