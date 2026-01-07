import Redis from "ioredis"

/**
 * Redis 客户端实例
 *
 * 使用单例模式确保全局只有一个 Redis 连接
 */
let redisClient: Redis | null = null
let redisSubscriber: Redis | null = null

/**
 * 获取 Redis 客户端（用于发布消息）
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const redisUrl = process.env.REDIS_URL
    if (!redisUrl) {
      throw new Error("REDIS_URL 环境变量未配置")
    }

    redisClient = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })

    redisClient.on("error", (error) => {
      console.error("[Redis] 客户端连接错误:", error)
    })
  }

  return redisClient
}

/**
 * 获取 Redis 订阅客户端（用于订阅消息）
 *
 * 注意：Redis 的订阅客户端不能用于其他操作，需要单独创建
 */
export function getRedisSubscriber(): Redis {
  if (!redisSubscriber) {
    const redisUrl = process.env.REDIS_URL
    if (!redisUrl) {
      throw new Error("REDIS_URL 环境变量未配置")
    }

    redisSubscriber = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000)
        return delay
      },
    })

    redisSubscriber.on("error", (error) => {
      console.error("[Redis] 订阅客户端连接错误:", error)
    })
  }

  return redisSubscriber
}

/**
 * 关闭所有 Redis 连接
 */
export async function closeRedisConnections(): Promise<void> {
  const promises: Promise<void>[] = []

  if (redisClient) {
    promises.push(
      redisClient.quit().then(() => {
        redisClient = null
      })
    )
  }

  if (redisSubscriber) {
    promises.push(
      redisSubscriber.quit().then(() => {
        redisSubscriber = null
      })
    )
  }

  await Promise.all(promises)
}
