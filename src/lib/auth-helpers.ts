import { prisma } from "@/lib/prisma"
import { cookies } from "next/headers"
import { generateId } from "@/lib/id"
import { uploadAvatarFromUrl } from "@/lib/blob"
import { AutomationEvents } from "@/lib/automation/event-bus"
import { recordLogin } from "@/lib/auth"
import { encodeUsername } from "@/lib/utils"
import { SOCIAL_LINK_COOKIE } from "@/lib/auth-options"
import { getConfigValue } from "@/lib/services/config-service"
import type { Account, Profile } from "next-auth"

/**
 * 生成随机字母数字组合
 */
function generateRandomString(length: number): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 确保用户名唯一，如果已存在则添加随机后缀
 */
async function ensureUniqueName(name: string): Promise<string> {
  const existingUser = await prisma.users.findFirst({ where: { name } })
  if (!existingUser) return name

  let uniqueName = `${name}${generateRandomString(5)}`
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    const check = await prisma.users.findFirst({ where: { name: uniqueName } })
    if (!check) return uniqueName
    uniqueName = `${name}${generateRandomString(5)}`
    attempts++
  }

  return `${name}${Date.now().toString().slice(-8)}`
}

/**
 * 处理社交账号链接模式
 */
export async function handleSocialLinkMode(
  provider: string,
  providerUid: string,
  providerUsername: string | null,
  email: string,
  avatarSrc: string | null,
  account: Account
): Promise<boolean | string> {
  const cookieStore = await cookies()
  const linkUserIdStr = cookieStore.get(SOCIAL_LINK_COOKIE)?.value
  if (!linkUserIdStr) return false

  cookieStore.delete(SOCIAL_LINK_COOKIE)
  const linkUserId = BigInt(linkUserIdStr)

  const linkUser = await prisma.users.findUnique({
    where: { id: linkUserId },
    select: { name: true },
  })

  if (!linkUser) return false

  const encodedLinkUsername = encodeUsername(linkUser.name)

  const existingLink = await prisma.user_social_accounts.findUnique({
    where: {
      provider_key_provider_uid: {
        provider_key: provider,
        provider_uid: providerUid,
      },
    },
  })

  if (existingLink) {
    if (existingLink.user_id === linkUserId) {
      return `/u/${encodedLinkUsername}/preferences/security?error=already_linked`
    }
    return `/u/${encodedLinkUsername}/preferences/security?error=account_linked_other`
  }

  await prisma.user_social_accounts.create({
    data: {
      id: generateId(),
      user_id: linkUserId,
      provider_key: provider,
      provider_uid: providerUid,
      provider_username: providerUsername,
      provider_email: email,
      provider_avatar: avatarSrc,
      access_token: account.access_token ?? null,
      refresh_token: account.refresh_token ?? null,
      token_expires_at: account.expires_at
        ? new Date(account.expires_at * 1000)
        : null,
      last_used_at: new Date(),
    },
  })

  return `/u/${encodedLinkUsername}/preferences/security?success=linked`
}

/**
 * 处理已存在的社交账号登录
 */
export async function handleExistingSocialAccount(
  provider: string,
  providerUid: string,
  providerUsername: string | null,
  email: string,
  avatarSrc: string | null,
  account: Account
): Promise<boolean> {
  const existingSocialAccount = await prisma.user_social_accounts.findUnique({
    where: {
      provider_key_provider_uid: {
        provider_key: provider,
        provider_uid: providerUid,
      },
    },
    include: { user: true },
  })

  if (!existingSocialAccount) return false

  const linkedUser = existingSocialAccount.user
  if (linkedUser.is_deleted || linkedUser.status !== 1) {
    await recordLogin(linkedUser.id, "FAILED", provider.toUpperCase())
    return false
  }

  await prisma.user_social_accounts.update({
    where: { id: existingSocialAccount.id },
    data: {
      provider_username: providerUsername,
      provider_email: email,
      provider_avatar: avatarSrc,
      access_token: account.access_token ?? null,
      refresh_token: account.refresh_token ?? null,
      token_expires_at: account.expires_at
        ? new Date(account.expires_at * 1000)
        : null,
      last_used_at: new Date(),
    },
  })

  await recordLogin(linkedUser.id, "SUCCESS", provider.toUpperCase())
  return true
}

/**
 * 处理已存在邮箱的用户（自动关联社交账号）
 */
export async function handleExistingUserByEmail(
  provider: string,
  providerUid: string,
  providerUsername: string | null,
  email: string,
  avatarSrc: string | null,
  account: Account
): Promise<boolean> {
  const existingUserByEmail = await prisma.users.findUnique({
    where: { email },
    include: {
      social_accounts: {
        where: { provider_key: provider },
      },
    },
  })

  if (!existingUserByEmail) return false

  if (existingUserByEmail.is_deleted || existingUserByEmail.status !== 1) {
    await recordLogin(existingUserByEmail.id, "FAILED", provider.toUpperCase())
    return false
  }

  if (existingUserByEmail.social_accounts.length === 0) {
    await prisma.user_social_accounts.create({
      data: {
        id: generateId(),
        user_id: existingUserByEmail.id,
        provider_key: provider,
        provider_uid: providerUid,
        provider_username: providerUsername,
        provider_email: email,
        provider_avatar: avatarSrc,
        access_token: account.access_token ?? null,
        refresh_token: account.refresh_token ?? null,
        token_expires_at: account.expires_at
          ? new Date(account.expires_at * 1000)
          : null,
        last_used_at: new Date(),
      },
    })
  }

  await recordLogin(existingUserByEmail.id, "SUCCESS", provider.toUpperCase())
  return true
}

/**
 * 创建新用户（首次 OAuth 登录）
 */
export async function createNewOAuthUser(
  provider: string,
  providerUid: string,
  providerUsername: string | null,
  email: string,
  avatarSrc: string | null,
  account: Account,
  profile: Profile
): Promise<boolean> {
  // 检查是否允许注册
  const registrationEnabled = await getConfigValue("registration.enabled")
  if (!registrationEnabled) {
    console.log(
      `[OAuth] 注册已关闭，拒绝创建新用户: ${email} (provider: ${provider})`
    )
    return false
  }

  // 开启邀请码注册时，拒绝 OAuth 新用户自动创建
  const inviteCodeRequired = await getConfigValue(
    "registration.require_invite_code"
  )
  if (inviteCodeRequired) {
    console.log(
      `[OAuth] 邀请码注册已开启，拒绝创建新用户: ${email} (provider: ${provider})，请先通过表单+邀请码注册`
    )
    return false
  }

  const id = generateId()

  let name: string =
    (typeof profile?.name === "string" && profile.name.length > 0
      ? profile.name
      : "") || ""

  if (!name && provider === "linuxdo") {
    const p = profile as { username?: string; login?: string }
    name =
      (typeof p.username === "string" && p.username.length > 0
        ? p.username
        : "") ||
      (typeof p.login === "string" && p.login.length > 0 ? p.login : "")
  }

  if (!name) {
    name = email.split("@")[0]
  }

  const uniqueName = await ensureUniqueName(name)

  let avatar = ""
  if (avatarSrc && avatarSrc.length > 0) {
    try {
      avatar = await uploadAvatarFromUrl(id, avatarSrc)
    } catch {
      avatar = avatarSrc
    }
  }

  const userCount = await prisma.users.count()
  const isFirstUser = userCount === 0

  await prisma.$transaction(async (tx) => {
    await tx.users.create({
      data: {
        id,
        email,
        name: uniqueName,
        avatar,
        password: null,
        status: 1,
        is_deleted: false,
        is_admin: isFirstUser,
      },
    })

    await tx.user_social_accounts.create({
      data: {
        id: generateId(),
        user_id: id,
        provider_key: provider,
        provider_uid: providerUid,
        provider_username: providerUsername,
        provider_email: email,
        provider_avatar: avatarSrc,
        access_token: account.access_token ?? null,
        refresh_token: account.refresh_token ?? null,
        token_expires_at: account.expires_at
          ? new Date(account.expires_at * 1000)
          : null,
        last_used_at: new Date(),
      },
    })
  })

  await AutomationEvents.userRegister({
    userId: id,
    email,
    oauthProvider: provider,
  })

  await recordLogin(id, "SUCCESS", provider.toUpperCase())

  return true
}
