import { prisma } from "@/lib/prisma"
import { getRedisClient } from "@/lib/redis"
import { getTranslationsQuery, getTranslationFields } from "@/lib/locale"
import type {
  TaxonomyData,
  CategoryWithCount,
  TagWithCount,
} from "@/types/taxonomy"

const CACHE_TTL = 300

/**
 * 生成缓存键
 */
function getCacheKey(locale: string): string {
  return `taxonomy:${locale}`
}

/**
 * 从数据库获取分类数据
 */
async function fetchCategoriesFromDatabase(
  locale: string
): Promise<CategoryWithCount[]> {
  const categories = await prisma.categories.findMany({
    where: { is_deleted: false },
    select: {
      id: true,
      icon: true,
      sort: true,
      bg_color: true,
      text_color: true,
      dark_bg_color: true,
      dark_text_color: true,
      translations: getTranslationsQuery(locale, {
        name: true,
        description: true,
      }),
      _count: {
        select: {
          topics: { where: { is_deleted: false } },
        },
      },
    },
    orderBy: [{ sort: "asc" }, { updated_at: "desc" }],
  })

  return categories.map((category) => {
    const fields = getTranslationFields(category.translations, locale, {
      name: "",
      description: null,
    })

    return {
      id: category.id.toString(),
      icon: category.icon,
      sort: category.sort,
      bgColor: category.bg_color,
      textColor: category.text_color,
      darkBgColor: category.dark_bg_color,
      darkTextColor: category.dark_text_color,
      name: fields.name,
      description: fields.description,
      topicCount: category._count.topics,
    }
  })
}

/**
 * 从数据库获取标签数据
 */
async function fetchTagsFromDatabase(locale: string): Promise<TagWithCount[]> {
  const tags = await prisma.tags.findMany({
    where: { is_deleted: false },
    select: {
      id: true,
      icon: true,
      sort: true,
      bg_color: true,
      text_color: true,
      dark_bg_color: true,
      dark_text_color: true,
      translations: getTranslationsQuery(locale, {
        name: true,
        description: true,
      }),
      _count: {
        select: {
          topic_links: {
            where: { topic: { is_deleted: false } },
          },
        },
      },
    },
    orderBy: [{ sort: "desc" }, { id: "asc" }],
  })

  return tags.map((tag) => {
    const fields = getTranslationFields(tag.translations, locale, {
      name: "",
      description: null,
    })

    return {
      id: tag.id.toString(),
      icon: tag.icon,
      sort: tag.sort,
      bgColor: tag.bg_color,
      textColor: tag.text_color,
      darkBgColor: tag.dark_bg_color,
      darkTextColor: tag.dark_text_color,
      name: fields.name,
      description: fields.description,
      topicCount: tag._count.topic_links,
    }
  })
}

/**
 * 获取分类和标签数据（带Redis缓存）
 *
 * 缓存策略：
 * 1. 先尝试从Redis获取
 * 2. 如果Redis不可用或缓存miss，从数据库获取
 * 3. 将结果缓存到Redis（如果Redis可用）
 */
export async function getTaxonomyData(locale: string): Promise<TaxonomyData> {
  const cacheKey = getCacheKey(locale)

  try {
    const redis = getRedisClient()
    const cached = await redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached) as TaxonomyData
    }

    // 并行查询分类和标签
    const [categories, tags] = await Promise.all([
      fetchCategoriesFromDatabase(locale),
      fetchTagsFromDatabase(locale),
    ])

    const data: TaxonomyData = { categories, tags }

    // 异步缓存写入（不阻塞响应）
    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(data))
    } catch (cacheError) {
      console.error("[TaxonomyService] 缓存写入失败:", cacheError)
    }

    return data
  } catch (error) {
    console.error("[TaxonomyService] Redis不可用，从数据库获取:", error)

    // Redis 失败降级：直接查询数据库
    const [categories, tags] = await Promise.all([
      fetchCategoriesFromDatabase(locale),
      fetchTagsFromDatabase(locale),
    ])

    return { categories, tags }
  }
}

/**
 * 清除分类和标签缓存
 *
 * 在管理员创建/更新/删除分类或标签后调用
 */
export async function invalidateTaxonomyCache(): Promise<void> {
  try {
    const redis = getRedisClient()
    const locales = ["zh", "en"]

    // 清除所有语言的缓存
    await Promise.all(locales.map((locale) => redis.del(getCacheKey(locale))))

    console.log("[TaxonomyService] 分类和标签缓存已清除")
  } catch (error) {
    console.error("[TaxonomyService] 清除缓存失败:", error)
  }
}
