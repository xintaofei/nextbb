<h1 align="center">NextBB</h1>

<p align="center">
  <strong>基于 Next.js 16 构建的现代化、高性能、国际化论坛系统</strong><br/>
  <em>A modern, high-performance, i18n-ready forum built with Next.js 16</em>
</p>

<p align="center">
  <a href="https://discover.nextbb.org" target="_blank">🌐 在线演示</a>
  ·
  <a href="#-快速开始">📦 快速开始</a>
  ·
  <a href="https://github.com/xintaofei/nextbb/issues">🐛 报告问题</a>
</p>

<p align="center">
  <a href="https://github.com/xintaofei/nextbb/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/xintaofei/nextbb?style=flat-square&color=blue" alt="License" />
  </a>
  <a href="https://github.com/xintaofei/nextbb/stargazers">
    <img src="https://img.shields.io/github/stars/xintaofei/nextbb?style=flat-square&color=yellow" alt="Stars" />
  </a>
  <a href="https://github.com/xintaofei/nextbb/network/members">
    <img src="https://img.shields.io/github/forks/xintaofei/nextbb?style=flat-square&color=green" alt="Forks" />
  </a>
  <a href="https://github.com/xintaofei/nextbb/issues">
    <img src="https://img.shields.io/github/issues/xintaofei/nextbb?style=flat-square&color=red" alt="Issues" />
  </a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Prisma-ORM-2D3748?style=flat-square&logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

---

## 📖 关于 NextBB

NextBB 是一个使用最新技术栈开发的**开源论坛应用**。它不仅提供了完整的社区功能，还深度集成了 **AI 自动翻译**、**自动化规则引擎**和**丰富的互动组件**，旨在为用户提供流畅、现代且智能的交流体验。

## ✨ 核心特性

<table>
  <tr>
    <td width="50%">

### 🚀 极致性能

基于 Next.js 16 App Router 和 React 19，利用服务端组件（RSC）实现极速加载

### 🌍 全方位国际化

- UI 界面完全本地化（中/英）
- **AI 驱动内容翻译**：支持 OpenAI、Claude、Gemini 等主流 LLM

### 🤖 自动化规则引擎

灵活配置触发器与动作，实现社区运营自动化

### 💬 丰富互动形式

投票 · 抽奖 · 悬赏 · 签到

</td>
<td width="50%">

### 🛠️ 强大管理后台

全功能仪表盘，管理用户、内容、配置及 LLM 设置

### 🎨 现代化 UI/UX

- Tailwind CSS 4 + shadcn/ui
- 完美深色模式支持
- 响应式设计，适配所有设备

### 📝 高级编辑器

Milkdown Markdown 编辑器，斜杠命令、实时预览

### 🔒 安全可靠

NextAuth.js 认证 + RBAC 权限控制

</td>
  </tr>
</table>

<br/>

## 🛠️ 技术栈

<table>
  <tr>
    <td><b>框架</b></td>
    <td><a href="https://nextjs.org/">Next.js 16</a> (App Router)</td>
  </tr>
  <tr>
    <td><b>语言</b></td>
    <td>TypeScript (Strict Mode)</td>
  </tr>
  <tr>
    <td><b>样式</b></td>
    <td><a href="https://tailwindcss.com/">Tailwind CSS 4</a> · <a href="https://ui.shadcn.com/">shadcn/ui</a> · <a href="https://www.framer.com/motion/">Framer Motion</a></td>
  </tr>
  <tr>
    <td><b>数据库</b></td>
    <td><a href="https://www.postgresql.org/">PostgreSQL</a> + <a href="https://www.prisma.io/">Prisma ORM</a></td>
  </tr>
  <tr>
    <td><b>缓存</b></td>
    <td><a href="https://redis.io/">Redis</a></td>
  </tr>
  <tr>
    <td><b>认证</b></td>
    <td><a href="https://next-auth.js.org/">NextAuth.js</a></td>
  </tr>
  <tr>
    <td><b>数据请求</b></td>
    <td><a href="https://swr.vercel.app/">SWR</a></td>
  </tr>
  <tr>
    <td><b>国际化</b></td>
    <td><a href="https://next-intl-docs.vercel.app/">next-intl</a></td>
  </tr>
  <tr>
    <td><b>表单</b></td>
    <td>React Hook Form + Zod</td>
  </tr>
  <tr>
    <td><b>AI</b></td>
    <td><a href="https://sdk.vercel.ai/">Vercel AI SDK</a></td>
  </tr>
</table>

<br/>

## 🚀 快速开始

### 前置要求

| 依赖       | 版本要求 |
| ---------- | -------- |
| Node.js    | 20+      |
| pnpm       | 9+       |
| PostgreSQL | 16+      |
| Redis      | 7+       |

### 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/xintaofei/nextbb.git
cd nextbb

# 2. 安装依赖
pnpm install

# 3. 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写数据库等配置

# 4. 初始化数据库
pnpm prisma generate
pnpm db:push
pnpm db:seed

# 5. 启动开发服务器
pnpm dev
```

打开 [http://localhost:3000](http://localhost:3000) 即可访问 🎉

### 一键部署到 Vercel

<p>
  <a target="_blank" href="https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fxintaofei%2Fnextbb&env=JWT_AUTH_SECRET,NEXTAUTH_SECRET,IS_SERVERLESS,NODE_TLS_REJECT_UNAUTHORIZED&project-name=nextbb&repository-name=nextbb&demo-title=NextBB&demo-description=Next%20bulletin%20board%20system&demo-url=https%3A%2F%2Fdiscover.nextbb.org&stores=%5B%7B%22type%22%3A%22blob%22%7D%2C%7B%22type%22%3A%22kv%22%7D%2C%7B%22type%22%3A%22postgres%22%7D%5D">
    <img src="https://vercel.com/button" alt="Deploy with Vercel" height="36" />
  </a>
</p>

点击上方按钮，Vercel 会自动引导你集成：

- **Neon** - PostgreSQL 数据库
- **Upstash** - Redis 缓存服务
- **Blob** - 云端存储服务

<details>
<summary><b>📋 需要手动配置的环境变量</b></summary>

| 变量名                         | 说明             | 生成方式                  |
| ------------------------------ | ---------------- | ------------------------- |
| `JWT_AUTH_SECRET`              | JWT 认证密钥     | `openssl rand -base64 32` |
| `NEXTAUTH_SECRET`              | Session 加密密钥 | `openssl rand -base64 32` |
| `IS_SERVERLESS`                | Serverless 模式  | 设置为 `true`             |
| `NODE_TLS_REJECT_UNAUTHORIZED` | SSL 验证         | 设置为 `0`                |

</details>

<br/>

## 📂 项目结构

```
src/
├── app/                  # Next.js 路由与页面 (App Router)
│   ├── [locale]/         # 国际化路由入口
│   │   ├── admin/        # 管理员后台
│   │   ├── api/          # API 接口
│   │   └── (main)/       # 前台页面
├── components/           # UI 组件
│   ├── admin/            # 后台专用组件
│   ├── common/           # 通用组件
│   ├── editor/           # 编辑器组件
│   └── ui/               # shadcn/ui 基础组件
├── hooks/                # 自定义 React Hooks
├── i18n/                 # 国际化配置与翻译
├── lib/                  # 工具函数与服务
│   ├── ai/               # AI 模型适配层
│   ├── automation/       # 自动化规则引擎
│   └── services/         # 业务逻辑服务
├── types/                # TypeScript 类型定义
└── instrumentation.ts    # 服务启动初始化
```

## 🤝 贡献

我们欢迎所有形式的贡献！

## 💖 致谢

感谢所有为这个项目做出贡献的开发者！

<a href="https://github.com/xintaofei/nextbb/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=xintaofei/nextbb" />
</a>

## 📄 许可证

本项目采用 [GPL-2.0 License](LICENSE) 开源许可证。

---
