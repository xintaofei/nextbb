/**
 * 分类多语言翻译表数据迁移脚本
 *
 * 此脚本将现有 categories 表的 name 和 description 字段迁移至 category_translations 表
 * 执行步骤：
 * 1. 创建 category_translations 表
 * 2. 添加 source_locale 字段到 categories 表
 * 3. 迁移现有数据到 category_translations 表（源语言设为 'zh'）
 * 4. 删除 categories 表的 name 和 description 字段
 *
 * 执行方式：
 * npx tsx prisma/migrate-category-translations.ts
 */

import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  console.log("开始数据迁移...")

  try {
    // 步骤 1: 创建 category_translations 表
    console.log("\n步骤 1: 创建 category_translations 表")
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "category_translations" (
        "category_id" BIGINT NOT NULL,
        "locale" VARCHAR(8) NOT NULL,
        "name" VARCHAR(32) NOT NULL,
        "description" VARCHAR(255),
        "is_source" BOOLEAN NOT NULL DEFAULT false,
        "version" INTEGER NOT NULL DEFAULT 0,
        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "category_translations_pkey" PRIMARY KEY ("category_id", "locale")
      );
    `)
    console.log("✓ category_translations 表创建成功")

    // 步骤 2: 添加 source_locale 字段到 categories 表
    console.log("\n步骤 2: 添加 source_locale 字段")
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "categories" 
      ADD COLUMN IF NOT EXISTS "source_locale" VARCHAR(8) NOT NULL DEFAULT 'zh';
    `)
    console.log("✓ source_locale 字段添加成功")

    // 步骤 3: 迁移现有数据
    console.log("\n步骤 3: 迁移现有数据到 category_translations 表")
    const result = await prisma.$executeRawUnsafe(`
      INSERT INTO "category_translations" 
        ("category_id", "locale", "name", "description", "is_source", "version", "created_at", "updated_at")
      SELECT 
        "id" as "category_id",
        'zh' as "locale",
        "name",
        "description",
        true as "is_source",
        0 as "version",
        "created_at",
        "updated_at"
      FROM "categories"
      ON CONFLICT ("category_id", "locale") DO NOTHING;
    `)
    console.log(`✓ 已迁移 ${result} 条数据`)

    // 步骤 4: 创建索引
    console.log("\n步骤 4: 创建索引")
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "category_translations_locale_source_index" 
      ON "category_translations" ("locale", "is_source");
    `)
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "category_translations_category_source_index" 
      ON "category_translations" ("category_id", "is_source");
    `)
    console.log("✓ 索引创建成功")

    // 步骤 5: 添加外键约束
    console.log("\n步骤 5: 添加外键约束")
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "category_translations"
      ADD CONSTRAINT "category_translations_category_id_fkey"
      FOREIGN KEY ("category_id") REFERENCES "categories" ("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
    `)
    console.log("✓ 外键约束添加成功")

    // 步骤 6: 验证数据
    console.log("\n步骤 6: 验证数据")
    const categoriesResult = await prisma.$queryRawUnsafe<[{ count: bigint }]>(
      `SELECT COUNT(*) as count FROM "categories";`
    )
    const translationsResult = await prisma.$queryRawUnsafe<
      [{ count: bigint }]
    >(
      `SELECT COUNT(*) as count FROM "category_translations" WHERE "is_source" = true;`
    )

    const catCount = Number(categoriesResult[0].count)
    const transCount = Number(translationsResult[0].count)

    console.log(`  分类总数: ${catCount}`)
    console.log(`  源语言翻译数: ${transCount}`)

    if (catCount === transCount) {
      console.log("✓ 数据验证成功：所有分类都有对应的源语言翻译")
    } else {
      throw new Error(
        `数据不一致：分类数(${catCount}) != 翻译数(${transCount})`
      )
    }

    // 步骤 7: 删除旧字段
    console.log("\n步骤 7: 删除 categories 表的 name 和 description 字段")
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "categories" DROP COLUMN IF EXISTS "name";`
    )
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "categories" DROP COLUMN IF EXISTS "description";`
    )
    console.log("✓ 旧字段删除成功")

    console.log("\n✅ 数据迁移完成！")
  } catch (error) {
    console.error("\n❌ 迁移失败:", error)
    console.log("\n正在回滚...")

    try {
      // 尝试回滚
      await prisma.$executeRawUnsafe(
        `DROP TABLE IF EXISTS "category_translations";`
      )
      await prisma.$executeRawUnsafe(
        `ALTER TABLE "categories" DROP COLUMN IF EXISTS "source_locale";`
      )
      console.log("✓ 回滚成功")
    } catch (rollbackError) {
      console.error("❌ 回滚失败:", rollbackError)
      console.log("请手动检查数据库状态")
    }

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
