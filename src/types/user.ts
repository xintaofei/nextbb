// Auth session 用户信息（JWT token 中的静态信息）
export type CurrentUser = {
  id: string
  email: string
  name: string
  avatar: string
  isAdmin: boolean
}

// 完整用户信息（包括实时积分等动态数据）
export type CurrentUserProfile = CurrentUser & {
  credits: number
  bio: string | null
  website: string | null
  location: string | null
  birthday: string | null
}
