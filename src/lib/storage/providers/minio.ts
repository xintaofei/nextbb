import type { IStorageProvider } from "./interface"
import type { MinIOProviderConfig } from "../types"
import { dynamicRequire } from "./dynamic-require"

interface S3ClientModule {
  S3Client: new (config: object) => {
    send: (command: unknown) => Promise<unknown>
  }
  PutObjectCommand: new (params: object) => unknown
  DeleteObjectCommand: new (params: object) => unknown
  HeadObjectCommand: new (params: object) => unknown
}

/**
 * MinIO storage provider (S3-compatible)
 * Uses AWS SDK since MinIO is S3-compatible
 */
export class MinIOProvider implements IStorageProvider {
  private config: MinIOProviderConfig
  private baseUrl: string
  private client: { send: (command: unknown) => Promise<unknown> } | null = null
  private s3Module: S3ClientModule | null = null

  constructor(config: MinIOProviderConfig, baseUrl: string) {
    this.config = config
    this.baseUrl = baseUrl.replace(/\/$/, "")
  }

  private getS3Module(): S3ClientModule {
    if (!this.s3Module) {
      this.s3Module = dynamicRequire<S3ClientModule>("@aws-sdk/client-s3")
    }
    return this.s3Module
  }

  private async getClient(): Promise<{
    send: (command: unknown) => Promise<unknown>
  }> {
    if (this.client) {
      return this.client
    }

    const { S3Client } = this.getS3Module()

    const protocol = this.config.use_ssl !== false ? "https" : "http"
    const port =
      this.config.port || (this.config.use_ssl !== false ? 443 : 9000)
    const endpoint = `${protocol}://${this.config.endpoint}:${port}`

    this.client = new S3Client({
      region: "us-east-1", // MinIO doesn't use regions but SDK requires it
      credentials: {
        accessKeyId: this.config.access_key,
        secretAccessKey: this.config.secret_key,
      },
      endpoint,
      forcePathStyle: true,
    })

    return this.client
  }

  async upload(
    key: string,
    data: ArrayBuffer | Buffer,
    contentType: string
  ): Promise<string> {
    const client = await this.getClient()
    const { PutObjectCommand } = this.getS3Module()

    const buffer = data instanceof ArrayBuffer ? Buffer.from(data) : data

    await client.send(
      new PutObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
        Body: buffer,
        ContentType: contentType,
      })
    )

    return this.getUrl(key)
  }

  async delete(key: string): Promise<void> {
    const client = await this.getClient()
    const { DeleteObjectCommand } = this.getS3Module()

    await client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key,
      })
    )
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/${key}`
  }

  async exists(key: string): Promise<boolean> {
    const client = await this.getClient()
    const { HeadObjectCommand } = this.getS3Module()

    try {
      await client.send(
        new HeadObjectCommand({
          Bucket: this.config.bucket,
          Key: key,
        })
      )
      return true
    } catch {
      return false
    }
  }
}

/**
 * Factory function for creating MinIOProvider instances
 */
export function createMinIOProvider(
  config: Record<string, unknown>,
  baseUrl: string
): IStorageProvider {
  return new MinIOProvider(config as unknown as MinIOProviderConfig, baseUrl)
}
