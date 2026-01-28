import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { getServerSessionUser } from "@/lib/server-auth"
import { prisma } from "@/lib/prisma"

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
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
  // 验证用户身份
  const session = await getServerSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // 获取表单数据
    const formData = await req.formData()
    const file = formData.get("avatar") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // 验证文件类型
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, WEBP and GIF are allowed" },
        { status: 400 }
      )
    }

    // 验证文件大小
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds 5MB limit" },
        { status: 400 }
      )
    }

    // 将文件转换为 ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()

    // 上传到 Vercel Blob
    const userId = session.userId.toString()
    const ext = getExtFromContentType(file.type)
    const key = `avatars/${userId}.${ext}`

    const { url } = await put(key, arrayBuffer, {
      access: "public",
      contentType: file.type,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    })

    // 更新用户头像 URL
    const updatedUser = await prisma.users.update({
      where: { id: session.userId },
      data: {
        avatar: url,
        updated_at: new Date(),
      },
      select: {
        id: true,
        avatar: true,
      },
    })

    return NextResponse.json(
      {
        id: String(updatedUser.id),
        avatar: updatedUser.avatar,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Avatar upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload avatar" },
      { status: 500 }
    )
  }
}
