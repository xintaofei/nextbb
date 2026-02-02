import type { IStorageProvider } from "./interface"
import type { AliyunOSSProviderConfig } from "../types"
import { dynamicRequire } from "./dynamic-require"

/**
 * Aliyun OSS storage provider
 */
export class AliyunOSSProvider implements IStorageProvider {
  private config: AliyunOSSProviderConfig
  private baseUrl: string
  private client: unknown | null = null

  constructor(config: AliyunOSSProviderConfig, baseUrl: string) {
    this.config = config
    this.baseUrl = baseUrl.replace(/\/$/, "")
  }

  private async getClient(): Promise<{
    put: (key: string, data: Buffer) => Promise<{ url: string }>
    delete: (key: string) => Promise<void>
    head: (key: string) => Promise<unknown>
  }> {
    if (this.client) {
      return this.client as {
        put: (key: string, data: Buffer) => Promise<{ url: string }>
        delete: (key: string) => Promise<void>
        head: (key: string) => Promise<unknown>
      }
    }

    // Dynamic import - will throw at runtime if module not installed
    const OSS = dynamicRequire<{ new (config: object): unknown }>("ali-oss")

    this.client = new OSS({
      region: this.config.region,
      accessKeyId: this.config.access_key_id,
      accessKeySecret: this.config.access_key_secret,
      bucket: this.config.bucket,
      endpoint: this.config.endpoint,
    })

    return this.client as {
      put: (key: string, data: Buffer) => Promise<{ url: string }>
      delete: (key: string) => Promise<void>
      head: (key: string) => Promise<unknown>
    }
  }

  async upload(
    key: string,
    data: ArrayBuffer | Buffer,
    _contentType: string
  ): Promise<string> {
    void _contentType
    const client = await this.getClient()
    const buffer = data instanceof ArrayBuffer ? Buffer.from(data) : data

    await client.put(key, buffer)
    return this.getUrl(key)
  }

  async delete(key: string): Promise<void> {
    const client = await this.getClient()
    await client.delete(key)
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/${key}`
  }

  async exists(key: string): Promise<boolean> {
    const client = await this.getClient()
    try {
      await client.head(key)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Factory function for creating AliyunOSSProvider instances
 */
export function createAliyunOSSProvider(
  config: Record<string, unknown>,
  baseUrl: string
): IStorageProvider {
  return new AliyunOSSProvider(
    config as unknown as AliyunOSSProviderConfig,
    baseUrl
  )
}
