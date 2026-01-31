import { notFound, redirect } from "next/navigation"
import { getLocale } from "next-intl/server"
import {
  parseRouteSegments,
  routeParamsToApiQuery,
  type RouteParams,
} from "@/lib/route-utils"
import { DynamicRouteClient } from "@/components/main/dynamic-route-client"
import {
  getTopicList,
  type TopicListResult,
} from "@/lib/services/topic-service"
import { getServerSessionUser } from "@/lib/server-auth"

type PageProps = {
  params: Promise<{ segments?: string[] }>
}

export default async function DynamicRoutePage({ params }: PageProps) {
  // 并行获取 locale 和 session（如果可能）
  // 提前开始异步任务，避免瀑布流
  const localePromise = getLocale()
  const { segments } = await params

  // 解析路由参数
  const parsed = parseRouteSegments(segments)
  if (!parsed.valid) {
    notFound()
  }

  const routeParams: RouteParams = {
    sort: parsed.sort,
    filter: parsed.filter,
    categoryId: parsed.categoryId,
    tagId: parsed.tagId,
  }

  const apiQuery = routeParamsToApiQuery(routeParams)

  // 只在需要时获取用户会话（用于 'my' 过滤器）
  let auth = null
  const locale = await localePromise

  if (apiQuery.filter === "my") {
    auth = await getServerSessionUser()
    // 如果用户未登录，重定向到登录页面
    if (!auth) {
      redirect("/login")
    }
  }

  let initialData: TopicListResult | undefined

  try {
    initialData = await getTopicList(
      {
        categoryId: apiQuery.categoryId,
        tagId: apiQuery.tagId,
        sort: apiQuery.sort as "latest" | "new" | undefined,
        filter: apiQuery.filter as "community" | "my" | undefined,
        userId: auth?.userId,
      },
      1, // 第一页
      20, // pageSize 与客户端一致
      locale
    )
  } catch (error) {
    console.error("Failed to pre-fetch topics:", error)
    // 优雅降级：失败时继续渲染，由客户端处理
    initialData = undefined
  }

  return (
    <DynamicRouteClient routeParams={routeParams} initialData={initialData} />
  )
}
