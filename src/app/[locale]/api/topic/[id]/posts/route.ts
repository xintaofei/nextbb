import { NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { getLocale } from "next-intl/server"
import { getTopicPosts } from "@/lib/topic-service"
import { PostPage } from "@/types/topic"

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const locale = await getLocale()
  const auth = await getSessionUser()
  const { id: idStr } = await ctx.params
  let topicId: bigint
  try {
    topicId = BigInt(idStr)
  } catch {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const url = new URL(req.url)
  const page = Math.max(Number(url.searchParams.get("page") ?? "1"), 1)
  const pageSize = Math.max(Number(url.searchParams.get("pageSize") ?? "15"), 1)

  const result: PostPage = await getTopicPosts(
    topicId,
    locale,
    auth,
    page,
    pageSize
  )
  return NextResponse.json(result)
}
