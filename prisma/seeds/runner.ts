import { config } from "dotenv"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import { Pool } from "pg"
import process from "node:process"
import { patches, latestVersion } from "./patches"
import snapshot from "./snapshot"

config()

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
const prisma = new PrismaClient({ adapter })

type InstallMode = "fresh" | "upgrade" | "up_to_date"

async function detectMode(): Promise<{
  mode: InstallMode
  currentVersion: number
}> {
  try {
    const latest = await prisma.seed_migrations.findFirst({
      orderBy: { version: "desc" },
    })
    if (!latest) {
      const hasData = await prisma.system_configs.count()
      if (hasData > 0) {
        return { mode: "upgrade", currentVersion: 0 }
      }
      return { mode: "fresh", currentVersion: 0 }
    }
    if (latest.version >= latestVersion) {
      return { mode: "up_to_date", currentVersion: latest.version }
    }
    return { mode: "upgrade", currentVersion: latest.version }
  } catch {
    return { mode: "fresh", currentVersion: 0 }
  }
}

async function recordMigration(version: number, name: string): Promise<void> {
  await prisma.seed_migrations.upsert({
    where: { version },
    update: { name, applied_at: new Date() },
    create: { version, name },
  })
}

async function runFreshInstall(): Promise<void> {
  console.log("🆕 检测到全新安装，运行快照...")
  console.log(`   目标版本: v${snapshot.targetVersion}`)
  await snapshot.apply(prisma)
  for (let v = 1; v <= snapshot.targetVersion; v++) {
    const patch = patches.find((p) => p.version === v)
    if (patch) {
      await recordMigration(v, patch.name)
    }
  }
  console.log("✅ 快照应用完成")
}

async function runUpgrade(currentVersion: number): Promise<void> {
  const pending = patches.filter((p) => p.version > currentVersion)
  if (pending.length === 0) {
    console.log("✅ 数据已是最新版本")
    return
  }
  console.log(`🔄 检测到升级，当前版本: v${currentVersion}`)
  console.log(`   待执行补丁: ${pending.length} 个`)
  for (const patch of pending) {
    console.log(`   ⏳ 正在执行: v${patch.version} - ${patch.name}`)
    await patch.up(prisma)
    await recordMigration(patch.version, patch.name)
    console.log(`   ✓ 完成: v${patch.version}`)
  }
  console.log("✅ 升级完成")
}

async function main(): Promise<void> {
  console.log("🌱 NextBB 智能数据填充")
  console.log(`   最新版本: v${latestVersion}`)
  console.log("")

  const { mode, currentVersion } = await detectMode()

  switch (mode) {
    case "fresh":
      await runFreshInstall()
      break
    case "upgrade":
      await runUpgrade(currentVersion)
      break
    case "up_to_date":
      console.log(`✅ 数据已是最新版本 (v${currentVersion})`)
      break
  }
}

main()
  .catch((e) => {
    console.error("❌ 填充失败:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
