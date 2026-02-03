import { NextResponse } from "next/server"
import { put } from "@vercel/blob"
import sharp from "sharp"
import { getServerSessionUser } from "@/lib/server-auth"
import { getExpressionImagePath } from "@/lib/expression-utils"

const MAX_SIZE = 2 * 1024 * 1024 // 2MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
]

/**
 * 检测 GIF 是否为动画（多帧）
 */
async function isAnimatedGif(buffer: ArrayBuffer): Promise<boolean> {
  const uint8 = new Uint8Array(buffer)
  let frames = 0

  // 搜索 GIF 图像分隔符 (0x21, 0xF9, 0x04)
  for (let i = 0; i < uint8.length - 2; i++) {
    if (uint8[i] === 0x21 && uint8[i + 1] === 0xf9 && uint8[i + 2] === 0x04) {
      frames++
      if (frames > 1) return true
    }
  }
  return false
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
    const expressionCode = formData.get("expressionCode") as string | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!groupCode) {
      return NextResponse.json(
        { error: "Group code is required" },
        { status: 400 }
      )
    }

    if (!expressionCode) {
      return NextResponse.json(
        { error: "Expression code is required" },
        { status: 400 }
      )
    }

    // 验证 expressionCode 格式（仅字母数字下划线连字符）
    if (!/^[a-zA-Z0-9_-]+$/.test(expressionCode)) {
      return NextResponse.json(
        { error: "Invalid expression code format" },
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

    const arrayBuffer = await file.arrayBuffer()
    let finalBuffer: Buffer | ArrayBuffer = arrayBuffer
    let isAnimated = false
    let contentType = file.type

    // 检测是否为动画 GIF
    if (file.type === "image/gif") {
      isAnimated = await isAnimatedGif(arrayBuffer)
    }

    // 非动画图片转换为 WebP
    if (!isAnimated) {
      const webpBuffer = await sharp(Buffer.from(arrayBuffer))
        .webp({ quality: 90 })
        .toBuffer()
      finalBuffer = webpBuffer
      contentType = "image/webp"
    }

    // 生成文件路径
    const key = getExpressionImagePath(groupCode, expressionCode, isAnimated)

    const { url, pathname } = await put(key, finalBuffer, {
      access: "public",
      contentType: contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
      addRandomSuffix: false,
    })

    // 返回数据，包含 is_animated 标识
    return NextResponse.json(
      {
        url,
        path: pathname,
        isAnimated,
        width: null,
        height: null,
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
