import { NextResponse } from "next/server"
import { getServerSessionUser } from "@/lib/server-auth"
import { prisma } from "@/lib/prisma"
import { generateId } from "@/lib/id"
import { StorageService, getDefaultProvider } from "@/lib/storage"

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]

export async function POST(req: Request) {
  // Verify user authentication
  const session = await getServerSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, WEBP and GIF are allowed" },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      )
    }

    // Check if storage provider is configured
    const provider = await getDefaultProvider()

    if (provider) {
      // Use new StorageService
      const result = await StorageService.upload(file, {
        referenceType: "POST",
        userId: session.userId,
        originalFilename: file.name,
      })

      return NextResponse.json({ url: result.url }, { status: 200 })
    }

    // Fallback to legacy Vercel Blob if no provider configured
    // This maintains backwards compatibility during migration
    const { put } = await import("@vercel/blob")

    const arrayBuffer = await file.arrayBuffer()
    const ext = getExtFromContentType(file.type)
    const date = new Date()
    const year = date.getFullYear()
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const filename = `${crypto.randomUUID()}.${ext}`
    const key = `uploads/${year}/${month}/${filename}`

    const { url } = await put(key, arrayBuffer, {
      access: "public",
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // Record upload in legacy uploads table
    await prisma.uploads.create({
      data: {
        id: generateId(),
        user_id: session.userId,
        url,
        pathname: key,
        content_type: file.type,
        size: file.size,
      },
    })

    return NextResponse.json({ url }, { status: 200 })
  } catch (error) {
    console.error("Image upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    )
  }
}

function getExtFromContentType(ct: string): string {
  if (ct.includes("png")) return "png"
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg"
  if (ct.includes("webp")) return "webp"
  if (ct.includes("gif")) return "gif"
  return "jpg"
}
