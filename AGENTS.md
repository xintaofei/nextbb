# NextBB 项目规范

## 概述

NextBB 是一个现代化的论坛应用，采用响应式设计，适配桌面端、平板和移动设备。

## 技术栈

- **框架**: Next.js 16
- **语言**: TypeScript（严格模式）
- **样式**: Tailwind CSS 4 + shadcn/ui
- **数据库**: Prisma ORM + PostgreSQL
- **认证**: NextAuth.js
- **数据请求**: SWR
- **国际化**: next-intl（never 模式，不使用路由前缀）
- **表单**: React Hook Form + Zod 4
- **包管理器**: pnpm

## 开发命令

### 基础命令

```bash
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产版本（包含 prisma generate）
pnpm lint         # 运行 ESLint 检查
```

### Prisma 命令

```bash
pnpm prisma:generate    # 生成 Prisma Client
pnpm prisma:validate    # 验证 Prisma schema
pnpm db:push            # 推送 schema 到数据库
pnpm db:pull            # 从数据库拉取 schema
```

## 代码风格

### TypeScript

- **严格模式**: 始终启用 TypeScript strict 模式
- **禁止 `any`**: 严禁使用 `any` 类型，请使用具体类型
- **显式类型**: 所有函数参数、返回值和变量都必须显式声明类型
- **BigInt**: 数据库 ID 使用 `bigint` 类型

### 格式化（Prettier）

```json
{
  "tabWidth": 2,
  "useTabs": false,
  "semi": false,
  "bracketSpacing": true,
  "trailingComma": "es5",
  "printWidth": 80
}
```

### 导入规范

- 使用 `@/` 别名导入 `src` 目录下的模块
- 外部库导入在前，内部模块导入在后

### 组件结构

- 使用 `memo` 优化性能
- Props 接口定义在组件外部
- 使用 `cn()` 工具函数合并 Tailwind 类名
- 使用 shadcn/ui 组件作为基础

### API 路由

- 使用 Zod 进行请求参数验证
- 返回 `NextResponse.json({ error: string }, { status: number })` 格式的错误
- 使用 `BigInt` 处理数据库 ID
- 事务操作使用 `prisma.$transaction()`

### 国际化

- 所有用户可见文本必须使用 `next-intl`
- 翻译文件位置: `src/i18n/messages/*.json`
- 使用 `useTranslations` hook 或 `getTranslations` 服务端函数
- 默认语言: `zh` (中文)
- 支持语言: `en`, `zh`

### 数据库（Prisma）

- 所有数据模型定义在 `prisma/schema.prisma`
- ID 字段使用 `BigInt @id @db.BigInt`
- 时间字段使用 `@default(now())` 和 `@updatedAt`
- 软删除使用 `is_deleted` 字段
- 使用 `@@map` 自定义表名（snake_case）

```prisma
model users {
  id         BigInt    @id @db.BigInt
  name       String    @db.VarChar(32)
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt

  @@map("users")
}
```

### 状态管理

- **服务端状态**: 使用 SWR 进行数据请求与缓存
- **表单状态**: React Hook Form + Zod 校验器
- **本地状态**: React useState/useMemo/useCallback

### 响应式设计

- 使用 Tailwind CSS 断点: `sm:`, `md:`, `lg:`, `xl:`, `2xl:`
- 默认移动优先设计
- 使用 `max-sm:` 处理小屏特殊情况

### 文件结构

```
src/
├── app/              # Next.js App Router
│   ├── [locale]/     # 国际化路由
│   │   ├── api/     # API 路由
│   │   └── (main)/  # 主要页面
├── components/      # React 组件
│   ├── common/      # 通用组件
│   ├── editor/      # 编辑器组件
│   ├── new-topic/   # 新建话题组件
│   └── ui/          # shadcn/ui 组件
├── lib/             # 工具函数和服务
├── types/           # TypeScript 类型定义
└── i18n/            # 国际化配置
    ├── messages/    # 翻译文件
    ├── request.ts   # 请求配置
    └── routing.ts   # 路由配置
```

## 特殊说明

- Next.js v16 使用 `proxy.ts` 而不是 `middleware.ts` 进行中间件配置
- 包相关特性请参考与 context7 匹配的版本文档
- 所有组件必须支持深色模式
- 使用 `lucide-react` 作为图标库
