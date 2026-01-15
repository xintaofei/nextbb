import { prisma } from "@/lib/prisma"
import { NotificationType } from "@prisma/client"
import { generateId } from "@/lib/id"

/**
 * Extract user IDs from mentions in HTML content
 * Format: <span data-type="mention" data-id="123" ...>
 */
export function parseMentions(html: string): bigint[] {
  const regex = /<span[^>]*data-type="mention"[^>]*data-id="(\d+)"[^>]*>/g
  const matches = [...html.matchAll(regex)]
  const ids = new Set<bigint>()

  for (const match of matches) {
    try {
      const id = BigInt(match[1])
      ids.add(id)
    } catch {
      // Ignore invalid IDs
    }
  }

  return Array.from(ids)
}

interface NotifyMentionParams {
  topicId: bigint
  postId: bigint
  senderId: bigint
  contentHtml: string
}

export async function notifyMentions({
  topicId,
  postId,
  senderId,
  contentHtml,
}: NotifyMentionParams) {
  const mentionedUserIds = parseMentions(contentHtml)

  // Filter out self-mentions
  const targetUserIds = mentionedUserIds.filter((id) => id !== senderId)

  if (targetUserIds.length === 0) return

  // Validate users exist
  const validUsers = await prisma.users.findMany({
    where: { id: { in: targetUserIds }, is_deleted: false },
    select: { id: true },
  })

  const validIds = validUsers.map((u) => u.id)

  if (validIds.length === 0) return

  const notifications = validIds.map((userId) => ({
    id: generateId(),
    user_id: userId,
    sender_id: senderId,
    type: NotificationType.MENTION,
    topic_id: topicId,
    post_id: postId,
    read: false,
    is_deleted: false,
    created_at: new Date(),
  }))

  await prisma.notifications.createMany({
    data: notifications,
  })
}

interface NotifyReplyParams {
  topicId: bigint
  postId: bigint
  senderId: bigint
  topicUserId: bigint
  replyToUserId: bigint // 0 if not replying to a specific user (just topic)
}

export async function notifyReply({
  topicId,
  postId,
  senderId,
  topicUserId,
  replyToUserId,
}: NotifyReplyParams) {
  const notifications = []
  const now = new Date()

  let notifiedTopicAuthor = false

  // 1. Notify Parent Post Author (POST_REPLY)
  if (replyToUserId > 0 && replyToUserId !== senderId) {
    notifications.push({
      id: generateId(),
      user_id: replyToUserId,
      sender_id: senderId,
      type: NotificationType.POST_REPLY,
      topic_id: topicId,
      post_id: postId,
      read: false,
      is_deleted: false,
      created_at: now,
    })
    if (replyToUserId === topicUserId) {
      notifiedTopicAuthor = true
    }
  }

  // 2. Notify Topic Author (TOPIC_REPLY)
  // Only if they haven't been notified as a post reply target
  if (topicUserId !== senderId && !notifiedTopicAuthor) {
    notifications.push({
      id: generateId(),
      user_id: topicUserId,
      sender_id: senderId,
      type: NotificationType.TOPIC_REPLY,
      topic_id: topicId,
      post_id: postId,
      read: false,
      is_deleted: false,
      created_at: now,
    })
  }

  if (notifications.length > 0) {
    await prisma.notifications.createMany({
      data: notifications,
    })
  }
}
