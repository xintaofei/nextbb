// 活动类型定义
export type ActivityType = "all" | "topics" | "posts" | "likes" | "bookmarks"

// 分类信息
export type CategoryInfo = {
  id: string
  name: string
  icon: string
  bgColor: string | null
  textColor: string | null
}

// 作者信息
export type AuthorInfo = {
  id: string
  name: string
  avatar: string
}

// 主题类活动数据
export type TopicActivity = {
  topicId: string
  title: string
  category: CategoryInfo
  type: string
  views: number
  repliesCount: number
}

// 回复类活动数据
export type PostActivity = {
  postId: string
  floorNumber: number
  contentPreview: string
  topicId: string
  topicTitle: string
  category: CategoryInfo
  likesCount: number
}

// 点赞类活动数据
export type LikeActivity = {
  postId: string
  floorNumber: number
  contentPreview: string
  topicId: string
  topicTitle: string
  category: CategoryInfo
  author: AuthorInfo
}

// 收藏类活动数据
export type BookmarkActivity = {
  postId: string
  floorNumber: number
  contentPreview: string
  topicId: string
  topicTitle: string
  category: CategoryInfo
  author: AuthorInfo
}

// 活动项
export type ActivityItem = {
  activityType: ActivityType
  activityTime: string
  topicData?: TopicActivity
  postData?: PostActivity
  likeData?: LikeActivity
  bookmarkData?: BookmarkActivity
}

// API响应
export type ActivitiesResponse = {
  items: ActivityItem[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}
