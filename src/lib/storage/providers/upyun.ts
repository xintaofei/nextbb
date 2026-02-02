import type { IStorageProvider } from "./interface"
import type { UpyunProviderConfig } from "../types"
import { dynamicRequire } from "./dynamic-require"

interface UpyunClient {
  putFile(key: string, data: Buffer): Promise<boolean>
  deleteFile(key: string): Promise<boolean>
  headFile(key: string): Promise<Record<string, string> | false>
}

interface UpyunModule {
  Service: new (bucket: string, operator: string, password: string) => unknown
  Client: new (service: unknown) => UpyunClient
}

/**
 * Upyun (又拍云) storage provider
 */
export class UpyunProvider implements IStorageProvider {
  private config: UpyunProviderConfig
  private baseUrl: string
  private client: UpyunClient | null = null

  constructor(config: UpyunProviderConfig, baseUrl: string) {
    this.config = config
    this.baseUrl = baseUrl.replace(/\/$/, "")
  }

  private async getClient(): Promise<UpyunClient> {
    if (this.client) {
      return this.client
    }

    const upyun = dynamicRequire<UpyunModule>("upyun")

    const service = new upyun.Service(
      this.config.bucket,
      this.config.operator,
      this.config.password
    )

    this.client = new upyun.Client(service)

    return this.client
  }

  async upload(
    key: string,
    data: ArrayBuffer | Buffer,
    _contentType: string
  ): Promise<string> {
    const client = await this.getClient()
    const buffer = data instanceof ArrayBuffer ? Buffer.from(data) : data

    const result = await client.putFile(key, buffer)

    if (!result) {
      throw new Error("Upyun upload failed")
    }

    return this.getUrl(key)
  }

  async delete(key: string): Promise<void> {
    const client = await this.getClient()
    await client.deleteFile(key)
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/${key}`
  }

  async exists(key: string): Promise<boolean> {
    const client = await this.getClient()

    try {
      const result = await client.headFile(key)
      return result !== false
    } catch {
      return false
    }
  }
}

/**
 * Factory function for creating UpyunProvider instances
 */
export function createUpyunProvider(
  config: Record<string, unknown>,
  baseUrl: string
): IStorageProvider {
  return new UpyunProvider(config as unknown as UpyunProviderConfig, baseUrl)
}
