/**
 * Interface that all storage providers must implement
 */
export interface IStorageProvider {
  /**
   * Upload a file to the storage provider
   * @param key - The storage key/path for the file
   * @param data - File data as ArrayBuffer or Buffer
   * @param contentType - MIME type of the file
   * @returns The URL to access the uploaded file
   */
  upload(
    key: string,
    data: ArrayBuffer | Buffer,
    contentType: string
  ): Promise<string>

  /**
   * Delete a file from the storage provider
   * @param key - The storage key/path of the file to delete
   */
  delete(key: string): Promise<void>

  /**
   * Get the public URL for a file
   * @param key - The storage key/path of the file
   * @returns The public URL to access the file
   */
  getUrl(key: string): string

  /**
   * Check if a file exists in the storage
   * @param key - The storage key/path to check
   * @returns True if the file exists
   */
  exists(key: string): Promise<boolean>
}

/**
 * Factory function type for creating storage provider instances
 */
export type StorageProviderFactory = (
  config: Record<string, unknown>,
  baseUrl: string
) => IStorageProvider
