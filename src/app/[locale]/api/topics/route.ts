import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import { getSessionUser } from "@/lib/auth"
import { generateId } from "@/lib/id"
import { TopicType, BountyType } from "@/types/topic-type"
import { topicFormSchema } from "@/lib/topic-validation"
import { CreditService } from "@/lib/credit-service"
import { CreditLogType } from "@prisma/client"
import { getLocale } from "next-intl/server"
import { getTranslationsQuery, getTranslationFields } from "@/lib/locale"
import { getTopicTitle } from "@/lib/topic-translation"
import { notifyMentions } from "@/lib/notification-service"
import { emitPostCreateEvent } from "@/lib/automation/events"

interface TopicsDelegate {
  create(args: unknown): Promise<{ id: bigint }>
}

interface PostsDelegate {
  create(args: unknown): Promise<{ id: bigint }>
}

interface TopicTagsDelegate {
  createMany(args: unknown): Promise<{ count: number }>
}

interface PollOptionsDelegate {
  createMany(args: unknown): Promise<{ count: number }>
}

interface LotteryConfigsDelegate {
  create(args: unknown): Promise<{ topic_id: bigint }>
}

interface PollConfigsDelegate {
  create(args: unknown): Promise<{ topic_id: bigint }>
}

interface BountyConfigsDelegate {
  create(args: unknown): Promise<{ topic_id: bigint }>
}

interface TxClient {
  topics: TopicsDelegate
  posts: PostsDelegate
  topic_tags: TopicTagsDelegate
  poll_options: PollOptionsDelegate
  lottery_configs: LotteryConfigsDelegate
  poll_configs: PollConfigsDelegate
  bounty_configs: BountyConfigsDelegate
  users: {
    findUnique(args: unknown): Promise<{ credits: number } | null>
    update(args: unknown): Promise<unknown>
  }
}

const TopicListQuery = z.object({
  categoryId: z.string().regex(/^\d+$/).optional(),
  tagId: z.string().regex(/^\d+$/).optional(),
  sort: z.enum(["latest", "hot", "community", "new"]).optional(),
  page: z.string().regex(/^\d+$/).optional(),
  pageSize: z.string().regex(/^\d+$/).optional(),
})

type TopicParticipant = {
  id: string
  name: string
  avatar: string
}

type TopicListItem = {
  id: string
  title: string
  type: string
  category: {
    id: string
    name: string
    icon?: string
    description?: string | null
    bgColor?: string | null
    textColor?: string | null
  }
  tags: {
    id: string
    name: string
    icon: string
    description?: string | null
    bgColor?: string | null
    textColor?: string | null
  }[]
  participants: TopicParticipant[]
  replies: number
  views: number
  activity: string
  isPinned: boolean
  firstPost?: {
    id: string
    content: string
    createdAt: string
  }
}

type TopicListResult = {
  items: TopicListItem[]
  page: number
  pageSize: number
  total: number
}

export async function GET(req: Request) {
  const locale = await getLocale()
  const url = new URL(req.url)
  const q = TopicListQuery.safeParse({
    categoryId: url.searchParams.get("categoryId") ?? undefined,
    tagId: url.searchParams.get("tagId") ?? undefined,
    sort: url.searchParams.get("sort") ?? undefined,
    page: url.searchParams.get("page") ?? undefined,
    pageSize: url.searchParams.get("pageSize") ?? undefined,
  })
  if (!q.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 })
  }
  const page = q.data.page ? Number(q.data.page) : 1
  const pageSize = q.data.pageSize ? Number(q.data.pageSize) : 20
  const where: {
    is_deleted: boolean
    category_id?: bigint
    tag_links?: { some: { tag_id: bigint } }
    is_community?: boolean
  } = {
    is_deleted: false,
    ...(q.data.categoryId
      ? { category_id: BigInt(q.data.categoryId) }
      : undefined),
    ...(q.data.tagId
      ? { tag_links: { some: { tag_id: BigInt(q.data.tagId) } } }
      : undefined),
  }
  const sortMode = q.success && q.data.sort ? q.data.sort : "latest"
  if (sortMode === "community") {
    where.is_community = true
  }
  const total = await prisma.topics.count({
    where,
  })
  const topics = await prisma.topics.findMany({
    where,
    select: {
      id: true,
      translations: getTranslationsQuery(locale, { title: true }),
      type: true,
      views: true,
      is_pinned: true,
      is_community: true,
      category: {
        select: {
          id: true,
          icon: true,
          bg_color: true,
          text_color: true,
          translations: getTranslationsQuery(locale, {
            name: true,
            description: true,
          }),
        },
      },
      tag_links: {
        select: {
          tag: {
            select: {
              id: true,
              icon: true,
              bg_color: true,
              text_color: true,
              translations: getTranslationsQuery(locale, {
                name: true,
                description: true,
              }),
            },
          },
        },
      },
    },
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy:
      sortMode === "latest"
        ? [{ is_pinned: "desc" }, { id: "desc" }]
        : { id: "desc" },
  })
  type TopicRow = {
    id: bigint
    translations: {
      locale: string
      title: string
      is_source: boolean
    }[]
    type: string
    views: number
    is_pinned: boolean
    is_community: boolean
    category: {
      id: bigint
      icon: string
      bg_color: string | null
      text_color: string | null
      translations: {
        locale: string
        name: string
        description: string | null
        is_source: boolean
      }[]
    }
    tag_links: {
      tag: {
        id: bigint
        icon: string
        bg_color: string | null
        text_color: string | null
        translations: {
          locale: string
          name: string
          description: string | null
          is_source: boolean
        }[]
      }
    }[]
  }
  const topicsX = topics as unknown as TopicRow[]
  const topicIds = topicsX.map((t) => t.id)

  // 查询所有置顶话题的第一个 post（楼主 post），用于渲染三行预览
  const firstPosts: Record<
    string,
    { id: bigint; content: string; created_at: Date }
  > = {}
  const pinnedTopicIds = topicsX.filter((t) => t.is_pinned).map((t) => t.id)
  if (pinnedTopicIds.length > 0) {
    const firstPostsData = await prisma.posts.findMany({
      where: {
        topic_id: { in: pinnedTopicIds },
        floor_number: 1,
        is_deleted: false,
      },
      select: {
        id: true,
        topic_id: true,
        content: true,
        created_at: true,
      },
    })
    for (const post of firstPostsData) {
      firstPosts[String(post.topic_id)] = {
        id: post.id,
        content: post.content,
        created_at: post.created_at,
      }
    }
  }
  const posts = await prisma.posts.findMany({
    where: { topic_id: { in: topicIds }, is_deleted: false },
    select: {
      topic_id: true,
      user: { select: { id: true, name: true, avatar: true } },
      created_at: true,
      updated_at: true,
    },
    orderBy: { created_at: "asc" },
  })
  const byTopic: Record<
    string,
    {
      participants: TopicParticipant[]
      replies: number
      activity: Date | null
    }
  > = {}
  for (const t of topicIds) {
    byTopic[String(t)] = { participants: [], replies: 0, activity: null }
  }
  const seen: Record<string, Set<string>> = {}
  for (const p of posts) {
    const key = String(p.topic_id)
    if (!seen[key]) seen[key] = new Set<string>()
    if (!seen[key].has(String(p.user.id))) {
      if (byTopic[key].participants.length < 5) {
        byTopic[key].participants.push({
          id: String(p.user.id),
          name: p.user.name,
          avatar: p.user.avatar,
        })
      }
      seen[key].add(String(p.user.id))
    }
    byTopic[key].replies += 1
    const t = byTopic[key].activity
    const when = p.updated_at ?? p.created_at
    if (!t || when > t) byTopic[key].activity = when
  }
  const items: TopicListItem[] = topicsX.map((t) => {
    const agg = byTopic[String(t.id)]
    // 使用通用工具函数获取翻译字段
    const categoryFields = getTranslationFields(
      t.category.translations,
      locale,
      {
        name: "",
        description: null as string | null,
      }
    )
    const tags = t.tag_links.map(
      (l: {
        tag: {
          id: bigint
          icon: string
          bg_color: string | null
          text_color: string | null
          translations: {
            locale: string
            name: string
            description: string | null
            is_source: boolean
          }[]
        }
      }) => {
        const tagFields = getTranslationFields(l.tag.translations, locale, {
          name: "",
          description: null as string | null,
        })
        return {
          id: String(l.tag.id),
          name: tagFields.name,
          icon: l.tag.icon,
          description: tagFields.description,
          bgColor: l.tag.bg_color,
          textColor: l.tag.text_color,
        }
      }
    )
    const firstPost = firstPosts[String(t.id)]
    return {
      id: String(t.id),
      title: getTopicTitle(t.translations, locale),
      type: t.type || "GENERAL",
      category: {
        id: String(t.category.id),
        name: categoryFields.name,
        icon: t.category.icon ?? undefined,
        description: categoryFields.description ?? undefined,
        bgColor: t.category.bg_color,
        textColor: t.category.text_color,
      },
      tags,
      participants: agg.participants,
      replies: Math.max(agg.replies - 1, 0),
      views: t.views ?? 0,
      activity: agg.activity ? agg.activity.toISOString() : "",
      isPinned: Boolean(t.is_pinned),
      ...(firstPost && {
        firstPost: {
          id: String(firstPost.id),
          content: firstPost.content,
          createdAt: firstPost.created_at.toISOString(),
        },
      }),
    }
  })
  let sorted = items
  if (sortMode === "hot") {
    sorted = [...items].sort((a, b) => b.replies - a.replies)
  } else if (sortMode === "community") {
    sorted = [...items].sort((a, b) => {
      const ta = a.activity ? new Date(a.activity).getTime() : 0
      const tb = b.activity ? new Date(b.activity).getTime() : 0
      return tb - ta
    })
  }
  // latest模式下数据库已经按置顶+ID排序，不需要额外排序
  const result: TopicListResult = {
    items: sorted,
    page,
    pageSize,
    total,
  }
  return NextResponse.json(result)
}
// 使用 topic-validation.ts 中统一的验证 Schema
type TopicCreateDTO = z.infer<typeof topicFormSchema>

type TopicCreateResult = {
  topicId: string
}

export async function POST(req: Request) {
  const locale = await getLocale()
  const auth = await getSessionUser()
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: TopicCreateDTO
  try {
    const json = await req.json()
    body = topicFormSchema.parse(json)
  } catch (error) {
    console.error("Validation error:", error)
    return NextResponse.json({ error: "Invalid body" }, { status: 400 })
  }

  const user = await prisma.users.findUnique({
    where: { id: auth.userId },
    select: { is_admin: true },
  })
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const isAdmin = user.is_admin === true
  const isPinned = isAdmin ? Boolean(body.isPinned) : false
  const isCommunity = isAdmin ? Boolean(body.isCommunity) : false

  let categoryId: bigint
  try {
    categoryId = BigInt(body.categoryId)
  } catch {
    return NextResponse.json({ error: "Invalid categoryId" }, { status: 400 })
  }

  const category = await prisma.categories.findFirst({
    where: { id: categoryId, is_deleted: false },
    select: { id: true },
  })
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 })
  }

  const tagNames = [...new Set(body.tags.map((t: string) => t.trim()))].filter(
    (t) => t.length > 0
  )

  const tags = await prisma.tags.findMany({
    where: {
      is_deleted: false,
      translations: {
        some: {
          name: { in: tagNames },
        },
      },
    },
    select: {
      id: true,
      translations: {
        where: {
          name: { in: tagNames },
        },
        select: {
          name: true,
        },
      },
    },
  })

  const foundNames = new Set<string>()
  tags.forEach((t: { id: bigint; translations: { name: string }[] }) => {
    t.translations.forEach((trans) => foundNames.add(trans.name))
  })
  const missing = tagNames.filter((n) => !foundNames.has(n))
  if (missing.length > 0) {
    return NextResponse.json(
      { error: "Unknown tags", details: missing },
      { status: 400 }
    )
  }

  // BOUNTY 类型需要先扣除积分
  // 注意：CreditService 有自己的事务，与主事务分离
  // 如果后续主题创建失败，需要手动回滚积分
  let bountyDeducted = false

  if (body.type === TopicType.BOUNTY) {
    // 使用统一的积分服务扣除积分（并发安全）
    const creditResult = await CreditService.subtractCredits(
      auth.userId,
      body.bountyTotal,
      CreditLogType.BOUNTY_GIVEN,
      `发布悬赏主题，总赏金 ${body.bountyTotal}`
    )

    if (!creditResult.success) {
      return NextResponse.json(
        { error: creditResult.error || "积分扣除失败" },
        { status: 400 }
      )
    }

    bountyDeducted = true
  }

  try {
    const result = await prisma.$transaction(async (tx: unknown) => {
      const client = tx as TxClient

      const topic = await client.topics.create({
        data: {
          id: generateId(),
          category_id: categoryId,
          user_id: auth.userId,
          source_locale: locale,
          translations: {
            create: [
              {
                locale: locale,
                title: body.title,
                is_source: true,
              },
            ],
          },
          type: body.type,
          status:
            body.type === TopicType.POLL || body.type === TopicType.LOTTERY
              ? "ACTIVE"
              : "ACTIVE",
          end_time:
            body.type === TopicType.POLL && body.endTime
              ? new Date(body.endTime)
              : body.type === TopicType.LOTTERY &&
                  body.drawType === "SCHEDULED" &&
                  body.endTime
                ? new Date(body.endTime)
                : null,
          is_settled: false,
          is_pinned: isPinned,
          is_community: isCommunity,
          is_deleted: false,
        },
        select: { id: true },
      })

      const post = await client.posts.create({
        data: {
          id: generateId(),
          topic_id: topic.id,
          user_id: auth.userId,
          parent_id: BigInt(0),
          reply_to_user_id: BigInt(0),
          floor_number: 1,
          content: body.content,
          source_locale: locale,
          translations: {
            create: [
              {
                locale: locale,
                content_html: body.content_html,
                is_source: true,
              },
            ],
          },
          is_deleted: false,
        },
        select: { id: true },
      })

      if (tags.length > 0) {
        await client.topic_tags.createMany({
          data: tags.map(
            (t: { id: bigint; translations: { name: string }[] }) => ({
              topic_id: topic.id,
              tag_id: t.id,
              created_at: new Date(),
            })
          ),
          skipDuplicates: true,
        })
      }

      // POLL 类型创建投票选项和配置
      if (body.type === TopicType.POLL && body.pollOptions) {
        await client.poll_options.createMany({
          data: body.pollOptions.map((option, index) => ({
            id: generateId(),
            topic_id: topic.id,
            option_text: option.text,
            sort: index,
            is_deleted: false,
            created_at: new Date(),
          })),
        })

        // 创建投票配置
        const pollConfig = (body.pollConfig || {}) as {
          allowMultiple?: boolean
          maxChoices?: number
          showResultsBeforeVote?: boolean
          showVoterList?: boolean
        }
        await client.poll_configs.create({
          data: {
            topic_id: topic.id,
            allow_multiple: pollConfig.allowMultiple ?? false,
            max_choices: pollConfig.maxChoices ?? null,
            show_results_before_vote: pollConfig.showResultsBeforeVote ?? false,
            show_voter_list: pollConfig.showVoterList ?? false,
            created_at: new Date(),
            updated_at: new Date(),
          },
        })
      }

      // LOTTERY 类型创建抽奖配置
      if (body.type === TopicType.LOTTERY) {
        await client.lottery_configs.create({
          data: {
            topic_id: topic.id,
            draw_type: body.drawType,
            end_time:
              body.drawType === "SCHEDULED" && body.endTime
                ? new Date(body.endTime)
                : null,
            participant_threshold:
              body.drawType === "THRESHOLD" && body.participantThreshold
                ? body.participantThreshold
                : null,
            algorithm_type: body.algorithmType,
            floor_interval:
              body.algorithmType === "INTERVAL" && body.floorInterval
                ? body.floorInterval
                : null,
            fixed_floors:
              body.algorithmType === "FIXED" && body.fixedFloors
                ? JSON.stringify(body.fixedFloors)
                : null,
            winner_count:
              body.algorithmType === "RANDOM" && body.winnerCount
                ? body.winnerCount
                : null,
            entry_cost: body.entryCost ?? 0,
            is_drawn: false,
            drawn_at: null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        })
      }

      // BOUNTY 类型创建悬赏配置
      if (body.type === TopicType.BOUNTY) {
        await client.bounty_configs.create({
          data: {
            topic_id: topic.id,
            bounty_total: body.bountyTotal,
            bounty_type: body.bountyType,
            bounty_slots: body.bountySlots,
            remaining_slots: body.bountySlots,
            single_amount:
              body.bountyType === BountyType.MULTIPLE
                ? body.singleAmount
                : null,
            created_at: new Date(),
            updated_at: new Date(),
          },
        })
      }

      return { topicId: String(topic.id), postId: String(post.id) }
    })

    // Process side effects (Notifications & Events)
    try {
      const topicId = BigInt(result.topicId)
      const postId = BigInt(result.postId)

      // 1. Notify mentioned users
      await notifyMentions({
        topicId,
        postId,
        senderId: auth.userId,
        contentHtml: body.content_html,
      })

      // 2. Emit automation event
      await emitPostCreateEvent({
        postId,
        topicId,
        userId: auth.userId,
        categoryId,
        content: body.content,
        isFirstPost: true,
      })
    } catch (error) {
      console.error("Failed to process topic creation side effects:", error)
    }

    const response: TopicCreateResult = { topicId: result.topicId }
    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    // 如果主题创建失败且已扣除积分，需要回滚积分
    if (bountyDeducted && body.type === TopicType.BOUNTY) {
      await CreditService.addCredits(
        auth.userId,
        body.bountyTotal,
        CreditLogType.OTHER,
        `悬赏主题创建失败，退回赏金 ${body.bountyTotal}`
      )
    }
    console.error("Topic creation failed:", error)
    return NextResponse.json(
      { error: "Failed to create topic" },
      { status: 500 }
    )
  }
}
