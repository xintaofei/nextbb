import { NextRequest, NextResponse } from "next/server"
import { getSessionUser } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NotificationType, Prisma } from "@prisma/client"
import { getTranslationsQuery } from "@/lib/locale"
import { getTopicTitle } from "@/lib/topic-translation"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ locale: string }> }
) {
  const session = await getSessionUser()
  const { locale } = await params
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const filter = searchParams.get("filter") || "all"
  const page = parseInt(searchParams.get("page") || "1")
  const limit = parseInt(searchParams.get("limit") || "20")
  const skip = (page - 1) * limit

  const where: Prisma.notificationsWhereInput = {
    user_id: BigInt(session.userId),
    is_deleted: false,
  }

  // 根据 filter 映射 NotificationType
  if (filter === "mentions") {
    where.type = NotificationType.MENTION
  } else if (filter === "replies") {
    where.type = {
      in: [NotificationType.TOPIC_REPLY, NotificationType.POST_REPLY],
    }
  } else if (filter === "likes") {
    where.type = NotificationType.LIKE
  } else if (filter === "awards") {
    where.type = {
      in: [
        NotificationType.BADGE_AWARD,
        NotificationType.BOUNTY_REWARD,
        NotificationType.LOTTERY_WIN,
      ],
    }
  } else if (filter === "system") {
    where.type = NotificationType.SYSTEM
  }

  const [items, total] = await Promise.all([
    prisma.notifications.findMany({
      where,
      include: {
        sender: {
          select: {
            name: true,
            avatar: true,
          },
        },
        topic: {
          select: {
            id: true,
            translations: getTranslationsQuery(locale, { title: true }),
          },
        },
        post: {
          select: {
            id: true,
            floor_number: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
      skip,
      take: limit,
    }),
    prisma.notifications.count({ where }),
  ])

  // 处理 BigInt 转换为 String
  const serializedItems = items.map((item) => ({
    ...item,
    id: item.id.toString(),
    user_id: item.user_id.toString(),
    sender_id: item.sender_id?.toString(),
    topic_id: item.topic_id?.toString(),
    post_id: item.post_id?.toString(),
    topic: item.topic
      ? {
          id: item.topic.id.toString(),
          title: getTopicTitle(item.topic.translations, locale),
        }
      : null,
    post: item.post ? { ...item.post, id: item.post.id.toString() } : null,
  }))

  return NextResponse.json({
    items: serializedItems,
    total,
    page,
    limit,
    hasMore: skip + items.length < total,
  })
}

export async function POST() {
  const session = await getSessionUser()
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 标记所有未读通知为已读
  await prisma.notifications.updateMany({
    where: {
      user_id: session.userId,
      read: false,
    },
    data: {
      read: true,
    },
  })

  return NextResponse.json({ success: true })
}
