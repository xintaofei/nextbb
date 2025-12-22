export type Author = {
  id: string
  name: string
  avatar: string
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
}

export type RelatedTopicItem = {
  id: string
  title: string
  category: { id: string; name: string; icon?: string }
  tags: { id: string; name: string; icon: string }[]
  replies: number
  views: number
  activity: string
}

export type TopicInfo = {
  id: string
  title: string
  category: { id: string; name: string; icon?: string }
  tags: { id: string; name: string; icon: string }[]
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
