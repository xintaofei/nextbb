import { notFound } from "next/navigation"
import { parseRouteSegments, type RouteParams } from "@/lib/route-utils"
import { DynamicRouteClient } from "@/components/main/dynamic-route-client"

type PageProps = {
  params: Promise<{ segments?: string[] }>
}

export default async function DynamicRoutePage({ params }: PageProps) {
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

  return <DynamicRouteClient routeParams={routeParams} />
}
