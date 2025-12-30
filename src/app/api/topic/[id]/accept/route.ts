import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/auth"
import { TopicType } from "@/types/topic-type"
import { z } from "zod"

const AcceptSchema = z.object({
  postId: z.string().regex(/^\d+$/).nullable(),
})

type AcceptRequest = z.infer<typeof AcceptSchema>

interface TopicsDelegate {
  findFirst(args: unknown): Promise<{
    id: bigint
    type: string
    user_id: bigint
    is_settled: boolean
  } | null>
  update(args: unknown): Promise<unknown>
}

interface PostsDelegate {
  findFirst(args: unknown): Promise<{
    id: bigint
    floor_number: number
    is_deleted: boolean
  } | null>
}

interface UsersDelegate {
  findUnique(args: unknown): Promise<{
    is_admin: boolean
  } | null>
}

interface QuestionAcceptancesDelegate {
  findUnique(args: unknown): Promise<{ topic_id: bigint } | null>
  create(args: unknown): Promise<{ topic_id: bigint }>
  delete(args: unknown): Promise<unknown>
}

interface TxClient {
  topics: TopicsDelegate
  posts: PostsDelegate
  users: UsersDelegate
  question_acceptances: QuestionAcceptancesDelegate
}

export async function POST(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    // 验证用户登录
    const auth = await getSessionUser()
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: idStr } = await ctx.params

    // 验证主题 ID
    let topicId: bigint
    try {
      topicId = BigInt(idStr)
    } catch {
      return NextResponse.json(
        { error: "Invalid topic ID format" },
        { status: 400 }
      )
    }

    // 验证请求体
    const body = (await req.json()) as AcceptRequest
    const validation = AcceptSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid request data", details: validation.error },
        { status: 400 }
      )
    }

    const { postId: postIdStr } = validation.data

    // 使用事务处理采纳逻辑
    const result = await prisma.$transaction(
      async (tx: unknown) => {
        const client = tx as TxClient

        // 查询主题信息
        const topic = await client.topics.findFirst({
          where: {
            id: topicId,
            is_deleted: false,
          },
          select: {
            id: true,
            type: true,
            user_id: true,
            is_settled: true,
          },
        })

        if (!topic) {
          throw new Error("Topic not found")
        }

        // 验证主题类型
        if (topic.type !== TopicType.QUESTION) {
          throw new Error("Topic is not a question")
        }

        // 验证权限（楼主或管理员）
        const user = await client.users.findUnique({
          where: { id: auth.userId },
          select: { is_admin: true },
        })

        const isAdmin = user?.is_admin ?? false

        if (topic.user_id !== auth.userId && !isAdmin) {
          throw new Error("Only topic owner or admin can accept answers")
        }

        // 取消采纳操作
        if (postIdStr === null) {
          // 验证主题当前有采纳记录
          const existingAcceptance =
            await client.question_acceptances.findUnique({
              where: { topic_id: topicId },
            })

          if (!existingAcceptance) {
            throw new Error("No acceptance to cancel")
          }

          // 删除采纳记录
          await client.question_acceptances.delete({
            where: { topic_id: topicId },
          })

          // 更新主题状态
          await client.topics.update({
            where: { id: topicId },
            data: { is_settled: false },
          })

          return {
            success: true,
            isSettled: false,
            acceptedPostId: null,
          }
        }

        // 采纳答案操作
        let postId: bigint
        try {
          postId = BigInt(postIdStr)
        } catch {
          throw new Error("Invalid post ID format")
        }

        // 验证主题当前无采纳记录
        const existingAcceptance = await client.question_acceptances.findUnique(
          {
            where: { topic_id: topicId },
          }
        )

        if (existingAcceptance) {
          throw new Error("Topic already has accepted answer")
        }

        // 查询目标回复
        const post = await client.posts.findFirst({
          where: {
            id: postId,
            topic_id: topicId,
            is_deleted: false,
          },
          select: {
            id: true,
            floor_number: true,
            is_deleted: true,
          },
        })

        if (!post) {
          throw new Error("Post not found")
        }

        // 验证不是首楼
        if (post.floor_number === 1) {
          throw new Error("Cannot accept the first floor")
        }

        // 创建采纳记录
        await client.question_acceptances.create({
          data: {
            topic_id: topicId,
            post_id: postId,
            accepted_by: auth.userId,
            accepted_at: new Date(),
            created_at: new Date(),
            updated_at: new Date(),
          },
        })

        // 更新主题状态
        await client.topics.update({
          where: { id: topicId },
          data: { is_settled: true },
        })

        return {
          success: true,
          isSettled: true,
          acceptedPostId: String(postId),
        }
      },
      {
        maxWait: 5000,
        timeout: 10000,
      }
    )

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    console.error("Error accepting answer:", error)

    if (error instanceof Error) {
      const errorMessage = error.message

      if (
        errorMessage === "Topic not found" ||
        errorMessage === "Post not found"
      ) {
        return NextResponse.json({ error: errorMessage }, { status: 404 })
      }

      if (
        errorMessage === "Topic is not a question" ||
        errorMessage === "Only topic owner or admin can accept answers" ||
        errorMessage === "Topic already has accepted answer" ||
        errorMessage === "Cannot accept the first floor" ||
        errorMessage === "No acceptance to cancel" ||
        errorMessage === "Invalid post ID format"
      ) {
        return NextResponse.json({ error: errorMessage }, { status: 400 })
      }

      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
