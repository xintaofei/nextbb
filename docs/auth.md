# 认证与 Supabase 集成简要说明

## 环境变量
- 复制 `.env.local.example` 为 `.env.local`，填入实际 `SUPABASE_URL` 与 `SUPABASE_ANON_KEY`
- 浏览器端使用 `NEXT_PUBLIC_*` 变量
- 可选：`NEXT_PUBLIC_SITE_URL` 用于 OAuth 回调重定向

## Supabase Provider 设置
- 在 Supabase Dashboard → Authentication → Providers 中开启 GitHub 与 Google
- 将站点 URL 设置为开发地址（如 `http://localhost:3000`）
- 授权回调域名允许 `localhost:3000`，生产环境改为实际域名

## 数据表与 RLS
- 在 Supabase SQL Editor 执行 `supabase/sql/profiles.sql`，创建表与策略

## API 路由
- 注册：`POST /api/auth/register`
  - 请求体：`{ email, password, username, avatar }`
- 登录：`POST /api/auth/login`
  - 请求体：`{ email, password }`
- OAuth：`POST /api/auth/oauth`
  - 请求体：`{ provider: 'github' | 'google', redirectTo?: string }`
- 退出：`POST /api/auth/logout`
- 当前用户：`GET /api/auth/me`

## 前端调用
- 账号密码：通过上述 API 提交表单
- OAuth（推荐前端直接调用）：
  ```ts
  import { supabaseClient } from '@/src/lib/supabase/client'
  await supabaseClient.auth.signInWithOAuth({
    provider: 'github',
    options: { redirectTo: process.env.NEXT_PUBLIC_SITE_URL }
  })
  ```

