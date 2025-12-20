import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import process from "node:process"

declare global {
  var prisma: PrismaClient | undefined
}

const url =
  process.env.POSTGRES_URL_NON_POOLING ??
  process.env.POSTGRES_URL ??
  process.env.POSTGRES_PRISMA_URL ??
  ""
if (!url || url.length === 0) {
  throw new Error(
    "Database connection string is empty: set POSTGRES_URL_NON_POOLING or POSTGRES_URL or POSTGRES_PRISMA_URL"
  )
}
const pool = new Pool({ connectionString: url, ssl: true })
const adapter = new PrismaPg(pool)

export const prisma: PrismaClient =
  global.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma
}
