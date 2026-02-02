import type { IStorageProvider } from "./interface"
import type { TencentCOSProviderConfig } from "../types"
import { dynamicRequire } from "./dynamic-require"

interface COSClient {
  putObject(params: {
    Bucket: string
    Region: string
    Key: string
    Body: Buffer
    ContentType?: string
  }): Promise<unknown>
  deleteObject(params: {
    Bucket: string
    Region: string
    Key: string
  }): Promise<unknown>
  headObject(params: {
    Bucket: string
    Region: string
    Key: string
  }): Promise<unknown>
}

/**
 * Tencent Cloud COS storage provider
 */
export class TencentCOSProvider implements IStorageProvider {
  private config: TencentCOSProviderConfig
  private baseUrl: string
  private client: COSClient | null = null

  constructor(config: TencentCOSProviderConfig, baseUrl: string) {
    this.config = config
    this.baseUrl = baseUrl.replace(/\/$/, "")
  }

  private async getClient(): Promise<COSClient> {
    if (this.client) {
      return this.client
    }

    const COS =
      dynamicRequire<new (config: object) => COSClient>("cos-nodejs-sdk-v5")

    this.client = new COS({
      SecretId: this.config.secret_id,
      SecretKey: this.config.secret_key,
    })

    return this.client
  }

  async upload(
    key: string,
    data: ArrayBuffer | Buffer,
    contentType: string
  ): Promise<string> {
    const client = await this.getClient()
    const buffer = data instanceof ArrayBuffer ? Buffer.from(data) : data

    await client.putObject({
      Bucket: this.config.bucket,
      Region: this.config.region,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    })

    return this.getUrl(key)
  }

  async delete(key: string): Promise<void> {
    const client = await this.getClient()

    await client.deleteObject({
      Bucket: this.config.bucket,
      Region: this.config.region,
      Key: key,
    })
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/${key}`
  }

  async exists(key: string): Promise<boolean> {
    const client = await this.getClient()

    try {
      await client.headObject({
        Bucket: this.config.bucket,
        Region: this.config.region,
        Key: key,
      })
      return true
    } catch {
      return false
    }
  }
}

/**
 * Factory function for creating TencentCOSProvider instances
 */
export function createTencentCOSProvider(
  config: Record<string, unknown>,
  baseUrl: string
): IStorageProvider {
  return new TencentCOSProvider(
    config as unknown as TencentCOSProviderConfig,
    baseUrl
  )
}
