import { createServiceInitializer } from "@/lib/utils/service-lifecycle"
import { TranslationEvents } from "./event-bus"
import {
  CategoryTranslationHandler,
  TagTranslationHandler,
  BadgeTranslationHandler,
  TopicTranslationHandler,
  PostTranslationHandler,
  ExpressionGroupTranslationHandler,
  ExpressionTranslationHandler,
  MessageTranslationHandler,
} from "./handlers"
import {
  TranslationCategoryCreatedEvent,
  TranslationTagCreatedEvent,
  TranslationBadgeCreatedEvent,
  TranslationTopicCreatedEvent,
  TranslationPostCreatedEvent,
  TranslationExpressionGroupCreatedEvent,
  TranslationExpressionCreatedEvent,
  TranslationMessageCreatedEvent,
} from "./types"

/**
 * 初始化翻译系统
 *
 * 注册事件监听器并启动事件总线（根据配置启动 Redis 或本地消息处理）
 * 使用通用生命周期管理器
 */
export const initializeTranslationSystem = createServiceInitializer(
  "Translation",
  async () => {
    // 1. 注册事件监听器
    registerEventListeners()

    // 2. 初始化事件总线
    await TranslationEvents.initialize()
  }
)

/**
 * 注册事件监听器
 */
function registerEventListeners(): void {
  // 实例化处理器
  const categoryHandler = new CategoryTranslationHandler()
  const tagHandler = new TagTranslationHandler()
  const badgeHandler = new BadgeTranslationHandler()
  const topicHandler = new TopicTranslationHandler()
  const postHandler = new PostTranslationHandler()
  const expressionGroupHandler = new ExpressionGroupTranslationHandler()
  const expressionHandler = new ExpressionTranslationHandler()
  const messageHandler = new MessageTranslationHandler()

  // 注册分类事件
  TranslationEvents.on(
    "category",
    async (data: TranslationCategoryCreatedEvent) => {
      await categoryHandler.handle(data)
    }
  )

  // 注册标签事件
  TranslationEvents.on("tag", async (data: TranslationTagCreatedEvent) => {
    await tagHandler.handle(data)
  })

  // 注册徽章事件
  TranslationEvents.on("badge", async (data: TranslationBadgeCreatedEvent) => {
    await badgeHandler.handle(data)
  })

  // 注册话题事件
  TranslationEvents.on("topic", async (data: TranslationTopicCreatedEvent) => {
    await topicHandler.handle(data)
  })

  // 注册帖子事件
  TranslationEvents.on("post", async (data: TranslationPostCreatedEvent) => {
    await postHandler.handle(data)
  })

  // 注册表情分组事件
  TranslationEvents.on(
    "expression_group",
    async (data: TranslationExpressionGroupCreatedEvent) => {
      await expressionGroupHandler.handle(data)
    }
  )

  // 注册表情事件
  TranslationEvents.on(
    "expression",
    async (data: TranslationExpressionCreatedEvent) => {
      await expressionHandler.handle(data)
    }
  )

  // 注册消息事件
  TranslationEvents.on(
    "message",
    async (data: TranslationMessageCreatedEvent) => {
      await messageHandler.handle(data)
    }
  )
}
