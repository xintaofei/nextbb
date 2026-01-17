import { prisma } from "@/lib/prisma"
import { TranslationTaskStatus } from "@prisma/client"
import {
  TranslationCategoryCreatedEvent,
  TranslationTagCreatedEvent,
  TranslationBadgeCreatedEvent,
  TranslationTopicCreatedEvent,
  TranslationPostCreatedEvent,
  BaseTranslationCreatedEvent,
} from "./event-bus"

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
    console.log("[Translation] Processing Category translation:", event)
    // TODO: 实现分类翻译逻辑
    // 1. 获取分类源内容
    // 2. 调用 LLM 进行翻译
    // 3. 保存翻译结果
  }
}

/**
 * 标签翻译处理器
 */
export class TagTranslationHandler extends BaseTranslationHandler<TranslationTagCreatedEvent> {
  protected async execute(event: TranslationTagCreatedEvent): Promise<void> {
    console.log("[Translation] Processing Tag translation:", event)
    // TODO: 实现标签翻译逻辑
  }
}

/**
 * 徽章翻译处理器
 */
export class BadgeTranslationHandler extends BaseTranslationHandler<TranslationBadgeCreatedEvent> {
  protected async execute(event: TranslationBadgeCreatedEvent): Promise<void> {
    console.log("[Translation] Processing Badge translation:", event)
    // TODO: 实现徽章翻译逻辑
  }
}

/**
 * 话题翻译处理器
 */
export class TopicTranslationHandler extends BaseTranslationHandler<TranslationTopicCreatedEvent> {
  protected async execute(event: TranslationTopicCreatedEvent): Promise<void> {
    console.log("[Translation] Processing Topic translation:", event)
    // TODO: 实现话题翻译逻辑
    // 话题通常包含标题和内容，可能需要分别翻译或合并翻译
  }
}

/**
 * 帖子翻译处理器
 */
export class PostTranslationHandler extends BaseTranslationHandler<TranslationPostCreatedEvent> {
  protected async execute(event: TranslationPostCreatedEvent): Promise<void> {
    console.log("[Translation] Processing Post translation:", event)
    // TODO: 实现帖子翻译逻辑
  }
}
