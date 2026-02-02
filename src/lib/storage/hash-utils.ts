import crypto from "node:crypto"

/**
 * Calculate SHA-256 hash of file content
 * @param data - File data as ArrayBuffer or Buffer
 * @returns Hex-encoded SHA-256 hash string
 */
export function calculateFileHash(data: ArrayBuffer | Buffer): string {
  const buffer = data instanceof ArrayBuffer ? Buffer.from(data) : data
  return crypto.createHash("sha256").update(buffer).digest("hex")
}

/**
 * Calculate SHA-256 hash of a readable stream
 * @param stream - ReadableStream of file data
 * @returns Hex-encoded SHA-256 hash string
 */
export async function calculateStreamHash(
  stream: ReadableStream<Uint8Array>
): Promise<string> {
  const hash = crypto.createHash("sha256")
  const reader = stream.getReader()

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      hash.update(value)
    }
  } finally {
    reader.releaseLock()
  }

  return hash.digest("hex")
}
