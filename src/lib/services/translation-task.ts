import { prisma } from "@/lib/prisma"
import {
  TranslationEntityType,
  TranslationTaskStatus,
  TranslationTaskPriority,
} from "@prisma/client"
import { generateId } from "@/lib/id"
import { TranslationEvents } from "@/lib/translation/event-bus"

/**
 * 创建或更新翻译任务
 * @param entityType 实体类型
 * @param entityId 实体ID
 * @param sourceLocale 源语言
 * @param sourceVersion 源版本
 */
export async function createTranslationTasks(
  entityType: TranslationEntityType,
  entityId: bigint,
  sourceLocale: string,
  sourceVersion: number
) {
  // 1. 获取启用的自动翻译语言
  const config = await prisma.system_configs.findUnique({
    where: { config_key: "system.translation.enabled_locales" },
  })

  if (!config?.config_value) {
    return
  }

  let enabledLocales: string[] = []
  try {
    enabledLocales = JSON.parse(config.config_value)
  } catch (e) {
    console.error("Failed to parse enabled_locales config", e)
    return
  }

  if (!Array.isArray(enabledLocales) || enabledLocales.length === 0) {
    return
  }

  // 2. 过滤掉源语言
  const targetLocales = enabledLocales.filter(
    (locale) => locale !== sourceLocale
  )

  if (targetLocales.length === 0) {
    return
  }

  // 3. 查询已存在的任务
  const existingTasks = await prisma.translation_tasks.findMany({
    where: {
      entity_type: entityType,
      entity_id: entityId,
      target_locale: { in: targetLocales },
    },
    select: {
      id: true,
      target_locale: true,
    },
  })

  const existingLocales = new Set(existingTasks.map((t) => t.target_locale))
  const missingLocales = targetLocales.filter((l) => !existingLocales.has(l))

  // 4. 更新已存在的任务
  if (existingLocales.size > 0) {
    await prisma.translation_tasks.updateMany({
      where: {
        entity_type: entityType,
        entity_id: entityId,
        target_locale: { in: Array.from(existingLocales) },
      },
      data: {
        source_version: sourceVersion,
        status: TranslationTaskStatus.PENDING,
        priority: TranslationTaskPriority.NORMAL,
        retry_count: 0,
        error_message: null,
        started_at: null,
        completed_at: null,
        updated_at: new Date(),
      },
    })

    // 触发事件
    for (const task of existingTasks) {
      await TranslationEvents.createTask(entityType, {
        taskId: task.id,
        entityId: entityId,
        targetLocale: task.target_locale,
        priority: TranslationTaskPriority.NORMAL,
      })
    }
  }

  // 5. 创建新任务
  if (missingLocales.length > 0) {
    const newTasks = missingLocales.map((locale) => ({
      id: generateId(),
      entity_type: entityType,
      entity_id: entityId,
      source_locale: sourceLocale,
      target_locale: locale,
      source_version: sourceVersion,
      status: TranslationTaskStatus.PENDING,
      priority: TranslationTaskPriority.NORMAL,
      retry_count: 0,
    }))

    await prisma.translation_tasks.createMany({
      data: newTasks,
    })

    // 触发事件
    for (const task of newTasks) {
      await TranslationEvents.createTask(entityType, {
        taskId: task.id,
        entityId: entityId,
        targetLocale: task.target_locale,
        priority: task.priority,
      })
    }
  }
}
