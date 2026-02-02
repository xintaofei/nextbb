import { NextResponse } from "next/server"
import { StorageReferenceType } from "@prisma/client"
import { getServerSessionUser } from "@/lib/server-auth"
import { StorageService } from "@/lib/storage"

/**
 * POST /api/upload
 *
 * General-purpose file upload endpoint.
 * Supports multiple reference types and uses the configured storage provider.
 *
 * Request body (FormData):
 * - file: File to upload
 * - referenceType: StorageReferenceType (POST, AVATAR, EXPRESSION, SITE, OTHER)
 * - subPath: Optional sub-path (e.g., groupCode for EXPRESSION)
 *
 * Response:
 * {
 *   "url": "https://...",
 *   "id": "123456",
 *   "storageKey": "posts/2026/02/xxx.jpg"
 * }
 */
export async function POST(req: Request) {
  // Verify user authentication
  const session = await getServerSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null
    const referenceTypeStr = formData.get("referenceType") as string | null
    const subPath = formData.get("subPath") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Validate and parse referenceType
    const validReferenceTypes: StorageReferenceType[] = [
      "POST",
      "AVATAR",
      "EXPRESSION",
      "SITE",
      "OTHER",
    ]

    const referenceType = (referenceTypeStr?.toUpperCase() ||
      "POST") as StorageReferenceType
    if (!validReferenceTypes.includes(referenceType)) {
      return NextResponse.json(
        {
          error: `Invalid referenceType. Must be one of: ${validReferenceTypes.join(", ")}`,
        },
        { status: 400 }
      )
    }

    // Validate required subPath for EXPRESSION type
    if (referenceType === "EXPRESSION" && !subPath) {
      return NextResponse.json(
        { error: "subPath (groupCode) is required for EXPRESSION type" },
        { status: 400 }
      )
    }

    // Upload file using StorageService
    const result = await StorageService.upload(file, {
      referenceType,
      userId: session.userId,
      subPath: subPath || undefined,
      originalFilename: file.name,
    })

    return NextResponse.json(
      {
        url: result.url,
        id: result.id.toString(),
        storageKey: result.storageKey,
        fileHash: result.fileHash,
        fileSize: result.fileSize,
        mimeType: result.mimeType,
        deduplicated: result.deduplicated,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("File upload error:", error)

    // Return specific error messages for validation errors
    if (error instanceof Error) {
      if (
        error.message.includes("Invalid file type") ||
        error.message.includes("exceeds") ||
        error.message.includes("required")
      ) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (error.message.includes("No active storage provider")) {
        return NextResponse.json(
          { error: "Storage not configured" },
          { status: 503 }
        )
      }
    }

    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
}
