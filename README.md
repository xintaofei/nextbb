# NextBB

<p align="center">
  <img src="public/nextbb-logo.png" alt="NextBB Logo" width="120" />
</p>

<p align="center">
  <strong>基于 Next.js 16 构建的现代化、高性能、国际化论坛系统</strong>
</p>

<p align="center">
  <a href="#特性">特性</a> •
  <a href="#技术栈">技术栈</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#项目结构">项目结构</a> •
  <a href="#贡献">贡献</a>
</p>

---

NextBB 是一个使用最新技术栈（Next.js 16, TypeScript, Tailwind CSS 4）开发的开源论坛应用。它不仅提供了完整的社区功能，还深度集成了 AI 自动翻译、自动化规则引擎和丰富的互动组件，旨在为用户提供流畅、现代且智能的交流体验。

## ✨ 特性

- 🚀 **极致性能**：基于 Next.js 16 App Router 和 React 19，利用服务端组件（RSC）实现极速加载。
- 🌍 **全方位国际化**：
  - UI 界面完全本地化（支持中英文）。
  - **AI 驱动的内容翻译**：支持配置大模型（OpenAI、Anthropic、Gemini 等主流 LLM）自动翻译分类、标签、话题、帖子等。
- 🤖 **自动化规则引擎**：灵活配置触发器（如注册、发帖、签到）和动作（如奖励积分、授予徽章），实现社区运营自动化。
- 💬 **丰富的互动形式**：
  - **投票 (Polls)**：支持单选、多选。
  - **抽奖 (Lotteries)**：支持按楼层、时间或人数自动开奖。
  - **悬赏 (Bounties)**：支持设置积分悬赏，激励优质回复。
  - **签到 (Check-ins)**：连续签到奖励系统。
- 🛠️ **强大的管理后台**：全功能仪表盘，管理用户、内容、配置、自动化规则及 LLM 设置。
- 🎨 **现代化 UI/UX**：
  - 使用 Tailwind CSS 4 和 shadcn/ui 构建，支持极致的深色模式。
  - 响应式设计，完美适配桌面端和移动端。
- 📝 **高级编辑器**：集成 Milkdown Markdown 编辑器，支持斜杠命令、实时预览和图片上传。
- 🔒 **安全可靠**：NextAuth.js 身份验证，支持多种社交账号登录及 RBAC 权限控制。

## 🛠️ 技术栈

- **框架**: [Next.js 16 (App Router)](https://nextjs.org/)
- **语言**: TypeScript (Strict Mode)
- **样式**: [Tailwind CSS 4](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [Framer Motion](https://www.framer.com/motion/)
- **数据库**: [PostgreSQL](https://www.postgresql.org/) + [Prisma ORM](https://www.prisma.io/)
- **缓存/消息队列**: [Redis](https://redis.io/)
- **认证**: [NextAuth.js](https://next-auth.js.org/)
- **数据请求**: [SWR](https://swr.vercel.app/)
- **国际化**: [next-intl](https://next-intl-docs.vercel.app/)
- **表单**: React Hook Form + Zod
- **AI 引擎**: [Vercel AI SDK](https://sdk.vercel.ai/)

## 🚀 快速开始

### 前置要求

- Node.js 20+
- pnpm 9+
- PostgreSQL 数据库
- Redis 服务（可选，用于增强事件处理性能）

### 安装与运行

1. **克隆仓库**

   ```bash
   git clone https://github.com/xintaofei/nextbb.git
   cd nextbb
   ```

2. **安装依赖**

   ```bash
   pnpm install
   ```

3. **配置环境变量**

   复制 `.env.example` 并填写相关配置：

   ```bash
   cp .env.example .env
   ```

   *确保相关配置正确。*

4. **初始化数据库**

   ```bash
   pnpm prisma generate
   pnpm db:push
   pnpm db:seed
   ```

5. **启动开发服务器**

   ```bash
   pnpm dev
   ```

   打开 [http://localhost:3000](http://localhost:3000) 即可访问。

### Vercel 部署

<p align="center">
  <a href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxintaofei%2Fnextbb&env=JWT_AUTH_SECRET,NEXTAUTH_SECRET,IS_SERVERLESS,NODE_TLS_REJECT_UNAUTHORIZED&project-name=nextbb&repository-name=nextbb&demo-title=NextBB&demo-description=Next%20bulletin%20board%20system&demo-url=https%3A%2F%2Fdiscover.nextbb.org&integration-ids=oac_VmvSUnSuoifAKUTlyS7Lr3HZ,oac_7p0L2iQvEAsV5uO2rB02L7R9,oac_ivL9WpG0I5I3I5I5I5I5I5I5">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" height="32" />
  </a>
</p>

1. **一键集成**：点击上方的“Deploy with Vercel”按钮，部署流程会自动引导你集成以下核心服务：
   - **Supabase**：提供 PostgreSQL 数据库支持。
   - **Upstash Redis**：提供高性能缓存与事件总线。
   - **Vercel Blob**：提供云端图片存储服务。

   *集成完成后，相关的环境变量（如 `POSTGRES_URL_NON_POOLING`、`REDIS_URL`、`BLOB_READ_WRITE_TOKEN`）将自动注入。*

2. **手动配置环境变量**：在部署过程中，你仍需手动填写以下变量：
   - `JWT_AUTH_SECRET`: 用于 JWT 认证的密钥（可运行 `openssl rand -base64 32` 生成，或随机字符串）。
   - `NEXTAUTH_SECRET`: 用于加密 Session 的随机字符串（可运行 `openssl rand -base64 32` 生成，或随机字符串）。
   - `IS_SERVERLESS`: 必须设置为 `true`。
   - `NODE_TLS_REJECT_UNAUTHORIZED`: 目前必须设置为 `0`，用于忽略 SSL 证书验证错误。

3. **Cron Jobs**：Vercel 会自动根据 `vercel.json` 启用定时任务。

## 📂 项目结构

```text
src/
├── app/              # Next.js 路由与页面 (App Router)
│   ├── [locale]/     # 国际化路由入口
│   │   ├── admin/    # 管理员后台页面
│   │   ├── api/      # API 接口
│   │   └── (main)/   # 前台主要页面
├── components/       # UI 组件
│   ├── admin/        # 后台专用组件
│   ├── common/       # 通用组件
│   ├── editor/       # 编辑器相关组件
│   └── ui/           # 基础 UI 组件 (shadcn/ui)
├── hooks/            # 自定义 React Hooks
├── i18n/             # 国际化配置文件与翻译文件
├── lib/              # 工具函数、核心逻辑与服务端服务
│   ├── ai/           # AI 模型适配层
│   ├── automation/   # 自动化规则引擎核心
│   └── services/     # 业务逻辑服务层
├── types/            # TypeScript 类型定义
└── instrumentation.ts # 服务启动初始化逻辑
```

## 🤝 贡献

我们欢迎所有形式的贡献！无论是修复 Bug、添加新特性还是改进文档。

## 📄 许可证

本项目采用 [GPL-2.0 License](LICENSE) 许可。

---
