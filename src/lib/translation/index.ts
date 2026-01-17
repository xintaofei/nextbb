import { translationBus } from "./event-bus"
import {
  CategoryTranslationHandler,
  TagTranslationHandler,
  BadgeTranslationHandler,
  TopicTranslationHandler,
  PostTranslationHandler,
} from "./handlers"

/**
 * 全局状态类型
 */
interface TranslationSystemState {
  isInitialized: boolean
  initializationPromise: Promise<void> | null
}

const globalForTranslationSystem = globalThis as unknown as {
  translationSystemState: TranslationSystemState
}

if (!globalForTranslationSystem.translationSystemState) {
  globalForTranslationSystem.translationSystemState = {
    isInitialized: false,
    initializationPromise: null,
  }
}

const state = globalForTranslationSystem.translationSystemState

/**
 * 初始化翻译系统
 *
 * 注册事件监听器并启动 Redis Stream 总线
 */
export async function initializeTranslationSystem(): Promise<void> {
  if (state.isInitialized) {
    return
  }

  if (state.initializationPromise) {
    return state.initializationPromise
  }

  state.initializationPromise = (async () => {
    try {
      // 1. 注册事件监听器
      registerEventListeners()

      // 2. 初始化 Redis 事件总线
      await translationBus.initialize()

      state.isInitialized = true
      console.log("[Translation] System initialized successfully")
    } catch (error) {
      console.error("[Translation] System initialization failed:", error)
      state.initializationPromise = null
      throw error
    }
  })()

  return state.initializationPromise
}

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

  // 注册分类事件
  translationBus.on("category", async (data) => {
    await categoryHandler.handle(data)
  })

  // 注册标签事件
  translationBus.on("tag", async (data) => {
    await tagHandler.handle(data)
  })

  // 注册徽章事件
  translationBus.on("badge", async (data) => {
    await badgeHandler.handle(data)
  })

  // 注册话题事件
  translationBus.on("topic", async (data) => {
    await topicHandler.handle(data)
  })

  // 注册帖子事件
  translationBus.on("post", async (data) => {
    await postHandler.handle(data)
  })
}
