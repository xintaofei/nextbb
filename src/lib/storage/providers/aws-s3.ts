import type { IStorageProvider } from "./interface"
import type { AWSS3ProviderConfig } from "../types"
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
 * AWS S3 storage provider
 */
export class AWSS3Provider implements IStorageProvider {
  private config: AWSS3ProviderConfig
  private baseUrl: string
  private client: { send: (command: unknown) => Promise<unknown> } | null = null
  private s3Module: S3ClientModule | null = null

  constructor(config: AWSS3ProviderConfig, baseUrl: string) {
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

    this.client = new S3Client({
      region: this.config.region,
      credentials: {
        accessKeyId: this.config.access_key_id,
        secretAccessKey: this.config.secret_access_key,
      },
      ...(this.config.endpoint && {
        endpoint: this.config.endpoint,
        forcePathStyle: true,
      }),
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
 * Factory function for creating AWSS3Provider instances
 */
export function createAWSS3Provider(
  config: Record<string, unknown>,
  baseUrl: string
): IStorageProvider {
  return new AWSS3Provider(config as unknown as AWSS3ProviderConfig, baseUrl)
}
