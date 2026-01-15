import { put } from "@vercel/blob"
import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await getSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 5MB" },
        { status: 400 }
      )
    }

    const date = new Date()
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, "0")
    const day = String(date.getDate()).padStart(2, "0")

    // Simple extension extraction
    const ext = file.name.split(".").pop() || "png"
    const filename = `${crypto.randomUUID()}.${ext}`

    const { url } = await put(
      `uploads/images/${year}/${month}/${day}/${filename}`,
      file,
      {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
      }
    )

    return NextResponse.json({ url })
  } catch (error) {
    console.error("Image upload failed:", error)
    return NextResponse.json({ error: "Upload failed" }, { status: 500 })
  }
}
