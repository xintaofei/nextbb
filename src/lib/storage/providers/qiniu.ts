import type { IStorageProvider } from "./interface"
import type { QiniuProviderConfig } from "../types"
import { dynamicRequire } from "./dynamic-require"

interface QiniuModule {
  auth: {
    digest: {
      Mac: new (accessKey: string, secretKey: string) => unknown
    }
  }
  rs: {
    PutPolicy: new (config: object) => { uploadToken: (mac: unknown) => string }
    BucketManager: new (
      mac: unknown,
      config: unknown
    ) => {
      delete: (
        bucket: string,
        key: string,
        callback: (
          err: Error | null,
          respBody: unknown,
          respInfo: { statusCode: number }
        ) => void
      ) => void
      stat: (
        bucket: string,
        key: string,
        callback: (
          err: Error | null,
          respBody: unknown,
          respInfo: { statusCode: number }
        ) => void
      ) => void
    }
  }
  conf: {
    Config: new () => { zone?: unknown }
  }
  zone: Record<string, unknown>
  form_up: {
    FormUploader: new (config: unknown) => {
      put: (
        token: string,
        key: string,
        data: Buffer,
        extra: unknown,
        callback: (
          err: Error | null,
          body: unknown,
          info: { statusCode: number }
        ) => void
      ) => void
    }
    PutExtra: new () => unknown
  }
}

/**
 * Qiniu Cloud storage provider
 */
export class QiniuProvider implements IStorageProvider {
  private config: QiniuProviderConfig
  private baseUrl: string
  private qiniuModule: QiniuModule | null = null

  constructor(config: QiniuProviderConfig, baseUrl: string) {
    this.config = config
    this.baseUrl = baseUrl.replace(/\/$/, "")
  }

  private getQiniuModule(): QiniuModule {
    if (!this.qiniuModule) {
      this.qiniuModule = dynamicRequire<QiniuModule>("qiniu")
    }
    return this.qiniuModule
  }

  async upload(
    key: string,
    data: ArrayBuffer | Buffer,
    _contentType: string
  ): Promise<string> {
    void _contentType
    const qiniu = this.getQiniuModule()

    const mac = new qiniu.auth.digest.Mac(
      this.config.access_key,
      this.config.secret_key
    )

    const putPolicy = new qiniu.rs.PutPolicy({
      scope: `${this.config.bucket}:${key}`,
    })
    const uploadToken = putPolicy.uploadToken(mac)

    const config = new qiniu.conf.Config()
    if (this.config.zone) {
      const zoneKey = `Zone_${this.config.zone}`
      config.zone = qiniu.zone[zoneKey]
    }

    const formUploader = new qiniu.form_up.FormUploader(config)
    const putExtra = new qiniu.form_up.PutExtra()

    const buffer = data instanceof ArrayBuffer ? Buffer.from(data) : data

    return new Promise((resolve, reject) => {
      formUploader.put(
        uploadToken,
        key,
        buffer,
        putExtra,
        (err: Error | null, _body: unknown, info: { statusCode: number }) => {
          if (err) {
            reject(err)
            return
          }
          if (info.statusCode === 200) {
            resolve(this.getUrl(key))
          } else {
            reject(
              new Error(`Qiniu upload failed with status ${info.statusCode}`)
            )
          }
        }
      )
    })
  }

  async delete(key: string): Promise<void> {
    const qiniu = this.getQiniuModule()

    const mac = new qiniu.auth.digest.Mac(
      this.config.access_key,
      this.config.secret_key
    )

    const config = new qiniu.conf.Config()
    const bucketManager = new qiniu.rs.BucketManager(mac, config)

    return new Promise((resolve, reject) => {
      bucketManager.delete(
        this.config.bucket,
        key,
        (
          err: Error | null,
          _respBody: unknown,
          respInfo: { statusCode: number }
        ) => {
          if (err) {
            reject(err)
            return
          }
          if (respInfo.statusCode === 200 || respInfo.statusCode === 612) {
            // 612 means file not found, which is acceptable for delete
            resolve()
          } else {
            reject(
              new Error(
                `Qiniu delete failed with status ${respInfo.statusCode}`
              )
            )
          }
        }
      )
    })
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/${key}`
  }

  async exists(key: string): Promise<boolean> {
    const qiniu = this.getQiniuModule()

    const mac = new qiniu.auth.digest.Mac(
      this.config.access_key,
      this.config.secret_key
    )

    const config = new qiniu.conf.Config()
    const bucketManager = new qiniu.rs.BucketManager(mac, config)

    return new Promise((resolve) => {
      bucketManager.stat(
        this.config.bucket,
        key,
        (
          err: Error | null,
          _respBody: unknown,
          respInfo: { statusCode: number }
        ) => {
          if (err || respInfo.statusCode !== 200) {
            resolve(false)
          } else {
            resolve(true)
          }
        }
      )
    })
  }
}

/**
 * Factory function for creating QiniuProvider instances
 */
export function createQiniuProvider(
  config: Record<string, unknown>,
  baseUrl: string
): IStorageProvider {
  return new QiniuProvider(config as unknown as QiniuProviderConfig, baseUrl)
}
