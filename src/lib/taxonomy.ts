import { unstable_cache, revalidateTag } from "next/cache"
import {
  getTaxonomyData as getDataFromService,
  invalidateTaxonomyCache as invalidateRedisCache,
} from "@/lib/services/taxonomy-service"
import type { TaxonomyData } from "@/types/taxonomy"

/**
 * 获取分类和标签数据（带 Next.js unstable_cache）
 *
 * 多层缓存架构：
 * 1. Next.js unstable_cache (ISR 5分钟)
 * 2. Redis (5分钟 TTL)
 * 3. PostgreSQL (Prisma)
 */
export async function getTaxonomyData(locale: string): Promise<TaxonomyData> {
  const getCachedData = unstable_cache(
    async (loc: string): Promise<TaxonomyData> => {
      return getDataFromService(loc)
    },
    [`taxonomy-data-${locale}`],
    {
      tags: [`taxonomy-data-${locale}`],
      revalidate: 300,
    }
  )

  return getCachedData(locale)
}

/**
 * 清除分类和标签缓存
 *
 * 在管理员创建/更新/删除分类或标签后调用
 * @param locale 可选，指定语言。如果省略则清除所有语言
 */
export async function revalidateTaxonomy(locale?: string): Promise<void> {
  // 清除 Redis 缓存
  await invalidateRedisCache()

  // 清除 Next.js unstable_cache 缓存
  if (locale) {
    revalidateTag(`taxonomy-data-${locale}`, "default")
  } else {
    // 清除所有语言
    const locales = ["zh", "en"]
    locales.forEach((loc) => revalidateTag(`taxonomy-data-${loc}`, "default"))
  }

  console.log("[Taxonomy] 分类和标签缓存已重新验证")
}
