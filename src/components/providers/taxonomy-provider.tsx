"use client"

import { createContext, useContext, useMemo, type ReactNode } from "react"
import type {
  TaxonomyData,
  CategoryWithCount,
  TagWithCount,
} from "@/types/taxonomy"

interface TaxonomyContextValue {
  categories: CategoryWithCount[]
  tags: TagWithCount[]
}

const TaxonomyContext = createContext<TaxonomyContextValue | undefined>(
  undefined
)

interface TaxonomyProviderProps {
  children: ReactNode
  initialData: TaxonomyData
}

/**
 * 分类和标签数据提供者
 *
 * 通过 Context 提供分类和标签数据给所有子组件
 * 数据在服务端获取并缓存，客户端只做展示
 */
export function TaxonomyProvider({
  children,
  initialData,
}: TaxonomyProviderProps) {
  const contextValue = useMemo(
    () => ({
      categories: initialData.categories,
      tags: initialData.tags,
    }),
    [initialData.categories, initialData.tags]
  )

  return (
    <TaxonomyContext.Provider value={contextValue}>
      {children}
    </TaxonomyContext.Provider>
  )
}

/**
 * 获取所有分类
 *
 * @throws {Error} 如果在 TaxonomyProvider 外部使用
 *
 * @example
 * ```tsx
 * function CategoriesList() {
 *   const categories = useCategories()
 *   return (
 *     <div>
 *       {categories.map(cat => (
 *         <div key={cat.id}>{cat.name} ({cat.topicCount})</div>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useCategories(): CategoryWithCount[] {
  const context = useContext(TaxonomyContext)
  if (context === undefined) {
    throw new Error("useCategories must be used within TaxonomyProvider")
  }
  return context.categories
}

/**
 * 获取所有标签
 *
 * @throws {Error} 如果在 TaxonomyProvider 外部使用
 *
 * @example
 * ```tsx
 * function PopularTags() {
 *   const tags = useTags()
 *   const popular = [...tags]
 *     .sort((a, b) => b.topicCount - a.topicCount)
 *     .slice(0, 20)
 *
 *   return (
 *     <div className="flex flex-wrap gap-2">
 *       {popular.map(tag => (
 *         <span key={tag.id}>{tag.name} ({tag.topicCount})</span>
 *       ))}
 *     </div>
 *   )
 * }
 * ```
 */
export function useTags(): TagWithCount[] {
  const context = useContext(TaxonomyContext)
  if (context === undefined) {
    throw new Error("useTags must be used within TaxonomyProvider")
  }
  return context.tags
}

/**
 * 获取完整的分类和标签数据
 *
 * @throws {Error} 如果在 TaxonomyProvider 外部使用
 *
 * @example
 * ```tsx
 * function TaxonomyStats() {
 *   const { categories, tags } = useTaxonomy()
 *   return (
 *     <div>
 *       <p>分类数: {categories.length}</p>
 *       <p>标签数: {tags.length}</p>
 *     </div>
 *   )
 * }
 * ```
 */
export function useTaxonomy(): TaxonomyContextValue {
  const context = useContext(TaxonomyContext)
  if (context === undefined) {
    throw new Error("useTaxonomy must be used within TaxonomyProvider")
  }
  return context
}
