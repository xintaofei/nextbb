export type CurrentUser = {
  id: string
  email: string
  name: string
  avatar: string
  isAdmin: boolean
  credits: number
}

export type MeResponse = CurrentUser | null
