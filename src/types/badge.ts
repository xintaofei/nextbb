export type BadgeItem = {
  id: string
  name: string
  icon: string
  badgeType: string
  level: number
  bgColor: string | null
  textColor: string | null
  description?: string | null
  awardedAt?: string
  awardedBy?: string | null
  awarderName?: string | null
  awarderAvatar?: string | null
}

export type UserBadgeRelation = {
  userId: string
  badgeId: string
  awardedAt: string
  awardedBy: string | null
  isDeleted: boolean
}

export type BadgeListResponse = {
  items: BadgeItem[]
}

export type BadgeAssignRequest = {
  badgeIds: string[]
}

export type BadgeAssignResponse = {
  success: boolean
  count: number
}
