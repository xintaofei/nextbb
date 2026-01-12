export interface DashboardOverview {
  users: number
  topics: number
  posts: number
  interactions: number
}

export interface DashboardTrends {
  userGrowth: { date: string; name: string; value: number }[]
  contentGrowth: {
    date: string
    name: string
    value: number
    topics: number
    posts: number
  }[]
  categoryTrends: Record<string, unknown>[]
  tagTrends: Record<string, unknown>[]
  meta: {
    categories: string[]
    tags: string[]
  }
}

export interface DashboardTaxonomy {
  categories: { id: string; name: string; count: number }[]
  tags: { id: string; name: string; count: number }[]
  badges: {
    total: number
    awarded: number
    topBadges: { id: string; name: string; count: number }[]
  }
}

export interface DashboardActivity {
  activeUsers7d: number
  checkins7d: number
  topActiveUsers: {
    id: string
    name: string
    avatar: string
    postCount: number
  }[]
}
