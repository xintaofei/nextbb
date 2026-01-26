import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import process from "node:process"

declare global {
  var prisma: PrismaClient | undefined
}

const pooled =
  process.env.POSTGRES_PRISMA_URL ?? process.env.POSTGRES_URL ?? null
let url = pooled ?? process.env.POSTGRES_URL_NON_POOLING ?? ""
if (!url || url.length === 0) {
  throw new Error(
    "Database connection string is empty: set POSTGRES_URL_NON_POOLING or POSTGRES_URL or POSTGRES_PRISMA_URL"
  )
}
if (pooled) {
  try {
    const u = new URL(url)
    if (!u.searchParams.has("pgbouncer")) {
      u.searchParams.set("pgbouncer", "true")
      url = u.toString()
    }
  } catch {}
}
const pool = new Pool({
  connectionString: url,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
  max: parseInt(process.env.POSTGRES_POOL_MAX ?? "1", 10),
  idleTimeoutMillis: 10000,
})
const adapter = new PrismaPg(pool)

export const prisma: PrismaClient =
  global.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma
}
