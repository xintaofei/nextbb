import TopicOverviewClient from "@/components/topic/topic-overview-client"
import type { Metadata } from "next"
import { getPublicConfigs } from "@/lib/config"
import { getLocale } from "next-intl/server"
import { getTopicInfo, getTopicPosts } from "@/lib/topic-service"
import { getSessionUser } from "@/lib/auth"
import { stripHtmlAndTruncate } from "@/lib/utils"

type TopicPageProps = {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: TopicPageProps): Promise<Metadata> {
  const configs = await getPublicConfigs()
  const siteName = configs["basic.name"]
  const { id: idStr } = await params
  const locale = await getLocale()
  const auth = await getSessionUser()

  let topicId: bigint
  try {
    topicId = BigInt(idStr)
  } catch {
    return {
      title: siteName,
      description: "",
    }
  }

  // 使用 topic-service 中的公共方法获取话题信息和帖子
  const [topicInfo, postsData] = await Promise.all([
    getTopicInfo(topicId, locale),
    getTopicPosts(topicId, locale, auth, 1, 15),
  ])

  if (!topicInfo) {
    return {
      title: siteName,
      description: "",
    }
  }

  // 从第一页的第一个帖子获取内容作为描述
  const firstPost = postsData.items[0]
  let description = firstPost
    ? stripHtmlAndTruncate(firstPost.content || "")
    : ""
  if (description.length > 100) {
    description = description.slice(0, 100).replace(/\n/g, " ").trim() + "..."
  }

  const authorName = firstPost?.author.name || ""

  // 构建完整的页面标题
  const fullTitle = `${topicInfo.title} - ${siteName}`

  // 构建关键词
  const keywords = [
    topicInfo.category.name,
    ...topicInfo.tags.map((tag) => tag.name),
  ]
    .filter(Boolean)
    .join(", ")

  return {
    title: fullTitle,
    description,
    keywords,
    authors: authorName ? [{ name: authorName }] : undefined,
    openGraph: {
      title: topicInfo.title,
      description,
      type: "article",
      siteName,
      locale,
    },
    twitter: {
      card: "summary",
      title: topicInfo.title,
      description,
    },
  }
}

export default async function TopicPage({ params }: TopicPageProps) {
  const { id: idStr } = await params
  const locale = await getLocale()
  const auth = await getSessionUser()

  let topicId: bigint
  try {
    topicId = BigInt(idStr)
  } catch {
    return null
  }

  // 在服务端预取数据
  const [topicInfo, initialPosts] = await Promise.all([
    getTopicInfo(topicId, locale),
    getTopicPosts(topicId, locale, auth, 1, 15),
  ])

  if (!topicInfo) {
    return null
  }

  return (
    <TopicOverviewClient
      initialTopicInfo={topicInfo}
      initialPosts={initialPosts}
    />
  )
}
