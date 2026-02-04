import { prisma } from "@/lib/prisma"
import { TranslationTaskStatus } from "@prisma/client"
import {
  TranslationCategoryCreatedEvent,
  TranslationTagCreatedEvent,
  TranslationBadgeCreatedEvent,
  TranslationTopicCreatedEvent,
  TranslationPostCreatedEvent,
  TranslationExpressionGroupCreatedEvent,
  TranslationExpressionCreatedEvent,
  BaseTranslationCreatedEvent,
} from "./types"
import { translationService } from "@/lib/services/translation-service"

/**
 * 翻译事件处理器接口
 */
export interface ITranslationHandler<T> {
  handle(event: T): Promise<void>
}

/**
 * 基础翻译处理器
 * 封装了任务状态更新的通用逻辑
 */
export abstract class BaseTranslationHandler<
  T extends BaseTranslationCreatedEvent,
> implements ITranslationHandler<T> {
  async handle(event: T): Promise<void> {
    const { taskId } = event

    try {
      // 1. 更新状态为处理中
      await prisma.translation_tasks.update({
        where: { id: taskId },
        data: {
          status: TranslationTaskStatus.PROCESSING,
          started_at: new Date(),
          error_message: null,
        },
      })

      // 2. 执行具体业务逻辑
      await this.execute(event)

      // 3. 更新状态为已完成
      await prisma.translation_tasks.update({
        where: { id: taskId },
        data: {
          status: TranslationTaskStatus.COMPLETED,
          completed_at: new Date(),
        },
      })
    } catch (error) {
      console.error(`[Translation] Task ${taskId} failed:`, error)

      // 4. 更新状态为失败
      const errorMessage =
        error instanceof Error ? error.message : String(error)

      try {
        await prisma.translation_tasks.update({
          where: { id: taskId },
          data: {
            status: TranslationTaskStatus.FAILED,
            error_message: errorMessage,
            retry_count: {
              increment: 1,
            },
          },
        })
      } catch (updateError) {
        console.error(
          `[Translation] Failed to update error status for task ${taskId}:`,
          updateError
        )
      }
    }
  }

  /**
   * 执行具体的翻译逻辑
   * 子类需实现此方法
   */
  protected abstract execute(event: T): Promise<void>
}

/**
 * 分类翻译处理器
 */
export class CategoryTranslationHandler extends BaseTranslationHandler<TranslationCategoryCreatedEvent> {
  protected async execute(
    event: TranslationCategoryCreatedEvent
  ): Promise<void> {
    const { entityId, targetLocale } = event
    const id = BigInt(entityId)

    // 1. 获取源分类数据
    // 我们需要获取源语言的翻译作为翻译源
    const category = await prisma.categories.findUnique({
      where: { id },
      include: {
        translations: {
          where: { is_source: true },
        },
      },
    })

    if (!category) throw new Error(`Category ${entityId} not found`)

    // 获取源语言和源数据
    const sourceLocale = category.source_locale
    const sourceTranslation = category.translations[0]

    if (!sourceTranslation) {
      throw new Error(`No source translation found for Category ${entityId}`)
    }

    const sourceData = {
      name: sourceTranslation.name,
      description: sourceTranslation.description,
    }

    // 2. 调用翻译服务
    const result = await translationService.translateSimpleEntity(
      "CATEGORY",
      sourceData,
      sourceLocale,
      targetLocale
    )

    // 3. 保存翻译结果
    await prisma.category_translations.upsert({
      where: {
        category_id_locale: {
          category_id: id,
          locale: targetLocale,
        },
      },
      update: {
        name: result.name,
        description: result.description,
        version: { increment: 1 },
      },
      create: {
        category_id: id,
        locale: targetLocale,
        name: result.name,
        description: result.description,
        version: 1,
        is_source: false,
      },
    })
  }
}

/**
 * 标签翻译处理器
 */
export class TagTranslationHandler extends BaseTranslationHandler<TranslationTagCreatedEvent> {
  protected async execute(event: TranslationTagCreatedEvent): Promise<void> {
    const { entityId, targetLocale } = event
    const id = BigInt(entityId)

    const tag = await prisma.tags.findUnique({
      where: { id },
      include: {
        translations: {
          where: { is_source: true },
        },
      },
    })

    if (!tag) throw new Error(`Tag ${entityId} not found`)

    const sourceLocale = tag.source_locale
    const sourceTranslation = tag.translations[0]

    if (!sourceTranslation) {
      throw new Error(`No source translation found for Tag ${entityId}`)
    }

    const sourceData = {
      name: sourceTranslation.name,
      description: sourceTranslation.description,
    }

    const result = await translationService.translateSimpleEntity(
      "TAG",
      sourceData,
      sourceLocale,
      targetLocale
    )

    await prisma.tag_translations.upsert({
      where: {
        tag_id_locale: {
          tag_id: id,
          locale: targetLocale,
        },
      },
      update: {
        name: result.name,
        description: result.description,
        version: { increment: 1 },
      },
      create: {
        tag_id: id,
        locale: targetLocale,
        name: result.name,
        description: result.description,
        version: 1,
        is_source: false,
      },
    })
  }
}

/**
 * 徽章翻译处理器
 */
export class BadgeTranslationHandler extends BaseTranslationHandler<TranslationBadgeCreatedEvent> {
  protected async execute(event: TranslationBadgeCreatedEvent): Promise<void> {
    const { entityId, targetLocale } = event
    const id = BigInt(entityId)

    const badge = await prisma.badges.findUnique({
      where: { id },
      include: {
        translations: {
          where: { is_source: true },
        },
      },
    })

    if (!badge) throw new Error(`Badge ${entityId} not found`)

    const sourceLocale = badge.source_locale
    const sourceTranslation = badge.translations[0]

    if (!sourceTranslation) {
      throw new Error(`No source translation found for Badge ${entityId}`)
    }

    const sourceData = {
      name: sourceTranslation.name,
      description: sourceTranslation.description,
    }

    const result = await translationService.translateSimpleEntity(
      "BADGE",
      sourceData,
      sourceLocale,
      targetLocale
    )

    await prisma.badge_translations.upsert({
      where: {
        badge_id_locale: {
          badge_id: id,
          locale: targetLocale,
        },
      },
      update: {
        name: result.name,
        description: result.description,
        version: { increment: 1 },
      },
      create: {
        badge_id: id,
        locale: targetLocale,
        name: result.name,
        description: result.description,
        version: 1,
        is_source: false,
      },
    })
  }
}

/**
 * 话题翻译处理器
 * 注意：话题翻译仅包含标题。内容的翻译由 PostTranslationHandler 处理（针对首贴）。
 */
export class TopicTranslationHandler extends BaseTranslationHandler<TranslationTopicCreatedEvent> {
  protected async execute(event: TranslationTopicCreatedEvent): Promise<void> {
    const { entityId, targetLocale } = event
    const id = BigInt(entityId)

    const topic = await prisma.topics.findUnique({
      where: { id },
      include: {
        translations: {
          where: { is_source: true },
        },
      },
    })

    if (!topic) throw new Error(`Topic ${entityId} not found`)

    const sourceLocale = topic.source_locale
    const sourceTranslation = topic.translations[0]

    if (!sourceTranslation) {
      throw new Error(`No source translation found for Topic ${entityId}`)
    }

    // 对于 Topic，我们只翻译标题
    // 内容通常在关联的第一个 Post 中，由 PostTranslationHandler 处理
    const sourceData = {
      title: sourceTranslation.title,
      content: "", // 占位符，实际不会用于更新 content
    }

    const result = await translationService.translateTopic(
      sourceData,
      sourceLocale,
      targetLocale
    )

    // 保存翻译 (仅标题)
    await prisma.topic_translations.upsert({
      where: {
        topic_id_locale: {
          topic_id: id,
          locale: targetLocale,
        },
      },
      update: {
        title: result.title,
        version: { increment: 1 },
      },
      create: {
        topic_id: id,
        locale: targetLocale,
        title: result.title,
        version: 1,
        is_source: false,
      },
    })
  }
}

/**
 * 帖子翻译处理器
 */
export class PostTranslationHandler extends BaseTranslationHandler<TranslationPostCreatedEvent> {
  protected async execute(event: TranslationPostCreatedEvent): Promise<void> {
    const { entityId, targetLocale } = event
    const id = BigInt(entityId)

    const post = await prisma.posts.findUnique({
      where: { id },
      include: {
        translations: {
          where: { is_source: true },
        },
      },
    })

    if (!post) throw new Error(`Post ${entityId} not found`)

    // Ensure we have the source translation (HTML)
    const sourceTranslation = post.translations[0]
    if (!sourceTranslation) {
      throw new Error(`No source translation found for Post ${entityId}`)
    }

    const sourceLocale = post.source_locale
    const sourceData = {
      content_html: sourceTranslation.content_html,
    }

    const result = await translationService.translatePost(
      sourceData,
      sourceLocale,
      targetLocale
    )

    await prisma.post_translations.upsert({
      where: {
        post_id_locale: {
          post_id: id,
          locale: targetLocale,
        },
      },
      update: {
        content_html: result.content_html,
        version: { increment: 1 },
      },
      create: {
        post_id: id,
        locale: targetLocale,
        content_html: result.content_html,
        version: 1,
        is_source: false,
      },
    })
  }
}

/**
 * 表情分组翻译处理器
 */
export class ExpressionGroupTranslationHandler extends BaseTranslationHandler<TranslationExpressionGroupCreatedEvent> {
  protected async execute(
    event: TranslationExpressionGroupCreatedEvent
  ): Promise<void> {
    const { entityId, targetLocale } = event
    const id = BigInt(entityId)

    const group = await prisma.expression_groups.findUnique({
      where: { id },
      include: {
        translations: {
          where: { is_source: true },
        },
      },
    })

    if (!group) throw new Error(`Expression group ${entityId} not found`)

    const sourceLocale = group.source_locale
    const sourceTranslation = group.translations[0]

    if (!sourceTranslation) {
      throw new Error(
        `No source translation found for Expression group ${entityId}`
      )
    }

    const sourceData = {
      name: sourceTranslation.name,
      description: null,
    }

    const result = await translationService.translateSimpleEntity(
      "EXPRESSION_GROUP",
      sourceData,
      sourceLocale,
      targetLocale
    )

    await prisma.expression_group_translations.upsert({
      where: {
        group_id_locale: {
          group_id: id,
          locale: targetLocale,
        },
      },
      update: {
        name: result.name,
        version: { increment: 1 },
      },
      create: {
        group_id: id,
        locale: targetLocale,
        name: result.name,
        version: 1,
        is_source: false,
      },
    })
  }
}

/**
 * 表情翻译处理器
 */
export class ExpressionTranslationHandler extends BaseTranslationHandler<TranslationExpressionCreatedEvent> {
  protected async execute(
    event: TranslationExpressionCreatedEvent
  ): Promise<void> {
    const { entityId, targetLocale } = event
    const id = BigInt(entityId)

    const expression = await prisma.expressions.findUnique({
      where: { id },
      include: {
        translations: {
          where: { is_source: true },
        },
      },
    })

    if (!expression) throw new Error(`Expression ${entityId} not found`)

    const sourceLocale = expression.source_locale
    const sourceTranslation = expression.translations[0]

    if (!sourceTranslation) {
      throw new Error(`No source translation found for Expression ${entityId}`)
    }

    const sourceData = {
      name: sourceTranslation.name,
      description: null,
    }

    const result = await translationService.translateSimpleEntity(
      "EXPRESSION",
      sourceData,
      sourceLocale,
      targetLocale
    )

    await prisma.expression_translations.upsert({
      where: {
        expression_id_locale: {
          expression_id: id,
          locale: targetLocale,
        },
      },
      update: {
        name: result.name,
        version: { increment: 1 },
      },
      create: {
        expression_id: id,
        locale: targetLocale,
        name: result.name,
        version: 1,
        is_source: false,
      },
    })
  }
}
