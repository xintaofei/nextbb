import type { PrismaClient } from "@prisma/client"

export type SeedPatch = {
  version: number
  name: string
  up: (prisma: PrismaClient) => Promise<void>
}

export type SeedSnapshot = {
  targetVersion: number
  apply: (prisma: PrismaClient) => Promise<void>
}
