import { notFound } from "next/navigation"
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

type PageProps = {
  params: Promise<{ segments?: string[] }>
}

export default async function DynamicRoutePage({ params }: PageProps) {
  const { segments } = await params
  const locale = await getLocale()

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

  // 预取第一页数据
  const apiQuery = routeParamsToApiQuery(routeParams)
  let initialData: TopicListResult | undefined

  try {
    // 跳过 'my' 过滤器（需要认证，服务端组件无法获取用户会话）
    if (apiQuery.filter !== "my") {
      initialData = await getTopicList(
        {
          categoryId: apiQuery.categoryId,
          tagId: apiQuery.tagId,
          sort: apiQuery.sort as "latest" | "new" | undefined,
          filter: apiQuery.filter as "community" | undefined,
          userId: undefined,
        },
        1, // 第一页
        20, // pageSize 与客户端一致
        locale
      )
    }
  } catch (error) {
    console.error("Failed to pre-fetch topics:", error)
    // 优雅降级：失败时继续渲染，由客户端处理
    initialData = undefined
  }

  return (
    <DynamicRouteClient routeParams={routeParams} initialData={initialData} />
  )
}
