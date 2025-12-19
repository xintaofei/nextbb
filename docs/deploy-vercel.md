# 部署到 Vercel

## 前置条件
- 已有 Git 仓库（GitHub/GitLab），本项目位于仓库根目录
- 已开通 Vercel 账号，并具备项目创建权限
- 数据库（MySQL/MariaDB）可以通过公网访问，已在安全组/白名单放行 Vercel 出网 IP

## 环境变量
- 在 Vercel 的 Project Settings → Environment Variables 配置以下变量（Preview 与 Production 都需要）：
  - `DATABASE_URL`：例如 `mysql://USER:PASSWORD@HOST:3306/DB_NAME?connection_limit=1`
  - `AUTH_SECRET`：用于 JWT 签名的随机字符串
- 参考仓库根目录的 `.env.example`
- 说明：`connection_limit` 会被 `src/lib/prisma.ts` 读取以控制连接池大小

## 通过 Dashboard 一键部署
- 打开 Vercel Dashboard → New Project
- 选择 Import Git Repository，导入本仓库
- 保持框架自动识别为 Next.js，构建命令与安装命令留空（使用默认）
- 在项目的 Environment Variables 填写上述变量
- 点击 Deploy，等待构建完成

## 通过 CLI 部署（可选）
```bash
npm i -g vercel
vercel login
vercel          # 首次部署（交互式创建项目）
vercel --prod   # 生产部署
```

## 数据库与区域
- 若数据库白名单需要固定出网 IP，可考虑启用 Vercel 的固定出网 IP功能或使用数据库代理服务
- 可在 Vercel Project Settings → Regions 选择靠近数据库的区域以降低延迟

## 首次上线验证
- 登录页：`/[locale]/login`
- 成功登录后调用：`GET /api/auth/me` 应返回当前用户信息
- 构建输出包含 API 路由：`/api/auth/login`、`/api/auth/logout`、`/api/auth/register`、`/api/topics` 等

## 常见问题
- 构建期缺少 `AUTH_SECRET`：通常该变量仅在运行时读取，若构建时报错请检查是否在构建阶段执行了需要密钥的逻辑
- 连接数过高：Serverless 并发会放大连接数，必要时将 `connection_limit` 调小或引入连接代理
- 边缘运行时：本项目未声明 `export const runtime = 'edge'`，默认 Node.js 运行时兼容数据库驱动与 `bcryptjs`

