import { PrismaClient } from "@prisma/client"
import fs from "node:fs"
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"

declare global {
  var prisma: PrismaClient | undefined
}

function getPgSslOption():
  | boolean
  | { rejectUnauthorized: boolean; ca?: string | Buffer } {
  const envVar = process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED
  const caPath = process.env.POSTGRES_SSL_CA
  const caInline = process.env.POSTGRES_SSL_CA_INLINE
  if (caInline && caInline.length > 0) {
    const inline = caInline.startsWith("-----BEGIN")
      ? caInline
      : Buffer.from(caInline, "base64").toString("utf-8")
    return {
      rejectUnauthorized: envVar === "false" ? false : true,
      ca: inline,
    }
  }
  if (caPath && caPath.length > 0) {
    const ca = fs.readFileSync(caPath)
    return {
      rejectUnauthorized: envVar === "false" ? false : true,
      ca,
    }
  }
  if (envVar === "false") {
    return { rejectUnauthorized: false }
  }
  return true
}

const connectionString =
  process.env.POSTGRES_URL ?? process.env.POSTGRES_PRISMA_URL ?? ""

const pool = new Pool({ connectionString, ssl: getPgSslOption() })
const adapter = new PrismaPg(pool)

export const prisma: PrismaClient =
  global.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma
}
