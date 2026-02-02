import fs from "node:fs/promises"
import path from "node:path"
import type { IStorageProvider } from "./interface"
import type { LocalProviderConfig } from "../types"

/**
 * Local file system storage provider
 */
export class LocalStorageProvider implements IStorageProvider {
  private basePath: string
  private baseUrl: string

  constructor(config: LocalProviderConfig, baseUrl: string) {
    this.basePath = config.base_path
    this.baseUrl = baseUrl.replace(/\/$/, "")
  }

  async upload(
    key: string,
    data: ArrayBuffer | Buffer,
    _contentType: string
  ): Promise<string> {
    void _contentType
    const filePath = path.join(this.basePath, key)
    const dir = path.dirname(filePath)

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true })

    // Write file
    const buffer = data instanceof ArrayBuffer ? Buffer.from(data) : data
    await fs.writeFile(filePath, buffer)

    return this.getUrl(key)
  }

  async delete(key: string): Promise<void> {
    const filePath = path.join(this.basePath, key)
    try {
      await fs.unlink(filePath)
    } catch (err) {
      // Ignore if file doesn't exist
      if ((err as NodeJS.ErrnoException).code !== "ENOENT") {
        throw err
      }
    }
  }

  getUrl(key: string): string {
    return `${this.baseUrl}/${key}`
  }

  async exists(key: string): Promise<boolean> {
    const filePath = path.join(this.basePath, key)
    try {
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Factory function for creating LocalStorageProvider instances
 */
export function createLocalProvider(
  config: Record<string, unknown>,
  baseUrl: string
): IStorageProvider {
  return new LocalStorageProvider(
    config as unknown as LocalProviderConfig,
    baseUrl
  )
}
