import { NextResponse } from "next/server"
import { getServerSessionUser } from "@/lib/server-auth"
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

    if (!provider) {
      return NextResponse.json(
        { error: "Storage provider not configured" },
        { status: 500 }
      )
    }

    // Use StorageService
    const result = await StorageService.upload(file, {
      referenceType: "POST",
      userId: session.userId,
      originalFilename: file.name,
    })

    return NextResponse.json({ url: result.url }, { status: 200 })
  } catch (error) {
    console.error("Image upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    )
  }
}
