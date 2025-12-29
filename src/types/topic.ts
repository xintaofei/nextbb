export type Author = {
  id: string
  name: string
  avatar: string
}

export type BadgeItem = {
  id: string
  name: string
  icon: string
  level: number
  bgColor: string | null
  textColor: string | null
  description?: string | null
}

export type PostItem = {
  id: string
  author: Author
  content: string
  createdAt: string
  minutesAgo: number
  isDeleted: boolean
  likes: number
  liked: boolean
  bookmarks: number
  bookmarked: boolean
  badges?: BadgeItem[]
}

export type RelatedTopicItem = {
  id: string
  title: string
  category: {
    id: string
    name: string
    icon?: string
    description?: string | null
    bgColor?: string | null
    textColor?: string | null
  }
  tags: {
    id: string
    name: string
    icon: string
    description?: string | null
    bgColor?: string | null
    textColor?: string | null
  }[]
  replies: number
  views: number
  activity: string
}

export type TopicInfo = {
  id: string
  title: string
  type: string
  isPinned: boolean
  category: {
    id: string
    name: string
    icon?: string
    description?: string | null
    bgColor?: string | null
    textColor?: string | null
  }
  tags: {
    id: string
    name: string
    icon: string
    description?: string | null
    bgColor?: string | null
    textColor?: string | null
  }[]
}

export type TopicInfoResult = { topic: TopicInfo }

export type PostPage = {
  items: PostItem[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

export type RelatedResult = { relatedTopics: RelatedTopicItem[] }
