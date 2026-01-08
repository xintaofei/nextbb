import Redis from "ioredis"

/**
 * Redis 客户端单例管理
 *
 * 生产级别实现：
 * 1. 统一使用 globalThis 存储，确保开发和生产环境一致
 * 2. 添加连接健康检查
 * 3. 添加自动重连机制
 */
const globalForRedis = globalThis as unknown as {
  redisClient: Redis | null
  redisSubscriber: Redis | null
}

if (!globalForRedis.redisClient) {
  globalForRedis.redisClient = null
}

if (!globalForRedis.redisSubscriber) {
  globalForRedis.redisSubscriber = null
}

/**
 * 获取 Redis 客户端（用于发布消息和 Stream 操作）
 *
 * 生产级别特性：
 * - 全局单例，避免连接泄漏
 * - 自动重连机制
 * - 连接健康监控
 */
export function getRedisClient(): Redis {
  if (!globalForRedis.redisClient) {
    const redisUrl = process.env.REDIS_URL
    if (!redisUrl) {
      throw new Error("REDIS_URL 环境变量未配置")
    }

    globalForRedis.redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        if (times > 20) {
          // 重试 20 次后报错，避免无限重试
          console.error("[Redis] 达到最大重试次数，停止重连")
          return null
        }
        const delay = Math.min(times * 50, 2000)
        return delay
      },
      reconnectOnError: (err) => {
        // 遇到 READONLY 错误时重连（Redis 主从切换）
        const targetError = "READONLY"
        if (err.message.includes(targetError)) {
          return true
        }
        return false
      },
    })

    globalForRedis.redisClient.on("error", (error) => {
      console.error("[Redis] 客户端连接错误:", error)
    })

    globalForRedis.redisClient.on("connect", () => {
      console.log("[Redis] 客户端连接成功")
    })

    globalForRedis.redisClient.on("ready", () => {
      console.log("[Redis] 客户端就绪")
    })

    globalForRedis.redisClient.on("reconnecting", () => {
      console.log("[Redis] 客户端正在重连...")
    })

    globalForRedis.redisClient.on("close", () => {
      console.log("[Redis] 客户端连接已关闭")
    })
  }

  return globalForRedis.redisClient
}

/**
 * 获取 Redis 订阅客户端（用于订阅消息）
 *
 * 注意：Redis 的订阅客户端不能用于其他操作，需要单独创建
 * 目前项目使用 Redis Stream，此客户端预留备用
 */
export function getRedisSubscriber(): Redis {
  if (!globalForRedis.redisSubscriber) {
    const redisUrl = process.env.REDIS_URL
    if (!redisUrl) {
      throw new Error("REDIS_URL 环境变量未配置")
    }

    globalForRedis.redisSubscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy: (times) => {
        if (times > 20) {
          console.error("[Redis] 订阅客户端达到最大重试次数")
          return null
        }
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })

    globalForRedis.redisSubscriber.on("error", (error) => {
      console.error("[Redis] 订阅客户端连接错误:", error)
    })

    globalForRedis.redisSubscriber.on("reconnecting", () => {
      console.log("[Redis] 订阅客户端正在重连...")
    })
  }

  return globalForRedis.redisSubscriber
}

/**
 * 关闭所有 Redis 连接
 *
 * 在应用关闭时调用，确保优雅退出
 */
export async function closeRedisConnections(): Promise<void> {
  const promises: Promise<void>[] = []

  if (globalForRedis.redisClient) {
    promises.push(
      globalForRedis.redisClient.quit().then(() => {
        globalForRedis.redisClient = null
      })
    )
  }

  if (globalForRedis.redisSubscriber) {
    promises.push(
      globalForRedis.redisSubscriber.quit().then(() => {
        globalForRedis.redisSubscriber = null
      })
    )
  }

  await Promise.all(promises)
}
