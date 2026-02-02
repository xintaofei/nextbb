import type { IStorageProvider } from "./interface"
import type { VercelBlobProviderConfig } from "../types"

/**
 * Vercel Blob storage provider
 */
export class VercelBlobProvider implements IStorageProvider {
  private token: string
  private baseUrl: string

  constructor(config: VercelBlobProviderConfig, baseUrl: string) {
    this.token = config.token
    this.baseUrl = baseUrl.replace(/\/$/, "")
  }

  async upload(
    key: string,
    data: ArrayBuffer | Buffer,
    contentType: string
  ): Promise<string> {
    // Dynamic import to avoid bundling when not used
    const { put } = await import("@vercel/blob")

    const { url } = await put(key, data, {
      access: "public",
      contentType,
      token: this.token,
    })

    return url
  }

  async delete(key: string): Promise<void> {
    const { del } = await import("@vercel/blob")

    // Vercel Blob delete requires the full URL
    const url = this.getUrl(key)
    await del(url, { token: this.token })
  }

  getUrl(key: string): string {
    // Vercel Blob returns the full URL from upload, but we need to construct it for getUrl
    // The baseUrl should be the Vercel Blob store URL
    return `${this.baseUrl}/${key}`
  }

  async exists(key: string): Promise<boolean> {
    const { head } = await import("@vercel/blob")

    try {
      const url = this.getUrl(key)
      await head(url, { token: this.token })
      return true
    } catch {
      return false
    }
  }
}

/**
 * Factory function for creating VercelBlobProvider instances
 */
export function createVercelBlobProvider(
  config: Record<string, unknown>,
  baseUrl: string
): IStorageProvider {
  return new VercelBlobProvider(
    config as unknown as VercelBlobProviderConfig,
    baseUrl
  )
}
