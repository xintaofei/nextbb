import { PrismaClient } from "@prisma/client"
import { PrismaMariaDb } from "@prisma/adapter-mariadb"

declare global {
  var prisma: PrismaClient | undefined
}

function getMariaDbAdapter(): PrismaMariaDb {
  const url = new URL(process.env.DATABASE_URL!)
  const host = url.hostname
  const port = Number(url.port || "3306")
  const user = decodeURIComponent(url.username)
  const password = decodeURIComponent(url.password)
  const database = url.pathname.replace(/^\//, "")
  const connectionLimitParam = url.searchParams.get("connection_limit")
  const connectionLimit =
    connectionLimitParam !== null ? Number(connectionLimitParam) : 5
  return new PrismaMariaDb({
    host,
    port,
    user,
    password,
    database,
    connectionLimit,
  })
}

const adapter = getMariaDbAdapter()

export const prisma: PrismaClient =
  global.prisma ?? new PrismaClient({ adapter })

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma
}
