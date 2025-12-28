/**
 * 路由工具函数 - 用于动态多级嵌套路由的解析和生成
 */

export type SortValue = "top" | "new" | "latest"

export type RouteParams = {
  sort?: SortValue
  categoryId?: string
  tagId?: string
}

/**
 * 路由解析结果
 */
export type ParsedRoute = RouteParams & {
  valid: boolean
  error?: string
}

/**
 * 解析 URL segments 数组，提取排序、分类、标签参数
 * @param segments URL segments 数组
 * @returns 解析结果
 */
export function parseRouteSegments(
  segments: string[] | undefined
): ParsedRoute {
  if (!segments || segments.length === 0) {
    return { valid: true }
  }

  const result: RouteParams = {}
  const seen = new Set<string>()

  // 特殊处理：如果第一个段是排序值（不带前缀），且只有一个段
  if (segments.length === 1) {
    const value = segments[0]
    if (value === "top" || value === "new" || value === "latest") {
      return {
        sort: value as SortValue,
        valid: true,
      }
    }
  }

  let i = 0
  while (i < segments.length) {
    const prefix = segments[i]

    // 检查是否为有效前缀
    if (prefix !== "i" && prefix !== "c" && prefix !== "t") {
      return {
        valid: false,
        error: `Invalid prefix: ${prefix}`,
      }
    }

    // 检查前缀是否重复
    if (seen.has(prefix)) {
      return {
        valid: false,
        error: `Duplicate prefix: ${prefix}`,
      }
    }
    seen.add(prefix)

    // 检查是否有对应的值
    if (i + 1 >= segments.length) {
      return {
        valid: false,
        error: `Missing value for prefix: ${prefix}`,
      }
    }

    const value = segments[i + 1]

    // 根据前缀类型验证和存储值
    if (prefix === "i") {
      // 验证排序值
      if (value !== "top" && value !== "new" && value !== "latest") {
        return {
          valid: false,
          error: `Invalid sort value: ${value}`,
        }
      }
      result.sort = value as SortValue
    } else if (prefix === "c") {
      // 验证分类 ID（必须为纯数字）
      if (!/^\d+$/.test(value)) {
        return {
          valid: false,
          error: `Invalid categoryId: ${value}`,
        }
      }
      result.categoryId = value
    } else if (prefix === "t") {
      // 验证标签 ID（必须为纯数字）
      if (!/^\d+$/.test(value)) {
        return {
          valid: false,
          error: `Invalid tagId: ${value}`,
        }
      }
      result.tagId = value
    }

    // 跳过前缀和值，继续处理下一对
    i += 2
  }

  return {
    ...result,
    valid: true,
  }
}

/**
 * 根据路由参数生成规范化的 URL 路径
 * @param params 路由参数
 * @returns URL 路径字符串
 */
export function buildRoutePath(params: RouteParams): string {
  const segments: string[] = []

  // 判断是否只有排序参数（没有分类和标签）
  const onlySort = params.sort && !params.categoryId && !params.tagId

  // 如果只有排序，使用简化格式 /latest、/new、/top
  if (onlySort) {
    return `/${params.sort}`
  }

  // 如果有分类或标签，使用完整格式 /i/sort/c/id
  if (params.sort) {
    segments.push("i", params.sort)
  }

  if (params.categoryId) {
    segments.push("c", params.categoryId)
  }

  if (params.tagId) {
    segments.push("t", params.tagId)
  }

  // 如果没有任何参数，返回主页路径
  if (segments.length === 0) {
    return "/"
  }

  // 构建完整路径
  return `/${segments.join("/")}`
}

/**
 * 将路由参数映射到 API 查询参数
 * @param params 路由参数
 * @returns API 查询参数对象
 */
export function routeParamsToApiQuery(params: RouteParams): {
  sort?: string
  categoryId?: string
  tagId?: string
} {
  const query: {
    sort?: string
    categoryId?: string
    tagId?: string
  } = {}

  // 映射排序参数
  if (params.sort) {
    // top → hot, new → latest, latest → latest
    if (params.sort === "top") {
      query.sort = "hot"
    } else if (params.sort === "new") {
      query.sort = "latest"
    } else {
      query.sort = "latest"
    }
  }

  // 直接传递分类和标签 ID
  if (params.categoryId) {
    query.categoryId = params.categoryId
  }

  if (params.tagId) {
    query.tagId = params.tagId
  }

  return query
}

/**
 * 从路径名中提取当前的路由参数
 * @param pathname 当前路径名
 * @returns 路由参数
 */
export function extractRouteParamsFromPathname(pathname: string): RouteParams {
  // 移除前后斜杠
  const path = pathname.replace(/^\/|\/$/g, "")

  // 如果是空路径，返回空参数
  if (!path) {
    return {}
  }

  // 分割路径段
  const segments = path.split("/")

  // 解析路由段
  const parsed = parseRouteSegments(segments)

  if (!parsed.valid) {
    return {}
  }

  return {
    sort: parsed.sort,
    categoryId: parsed.categoryId,
    tagId: parsed.tagId,
  }
}
