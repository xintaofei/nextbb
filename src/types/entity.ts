import { BaseEntity } from "@/types/common"
import { UserStatus } from "@/lib/constants"

/**
 * User Entity
 */
export interface UserEntity extends BaseEntity {
  name: string
  avatar: string
  email: string
  status: UserStatus
}

/**
 * Category Entity
 */
export interface CategoryEntity extends BaseEntity {
  name: string
  icon: string
}

/**
 * Topic Entity
 */
export interface TopicEntity extends BaseEntity {
  category_id: string
  user_id: string
  title: string
}

/**
 * Post Entity
 */
export interface PostEntity extends BaseEntity {
  topic_id: string
  user_id: string
  parent_id: string
  reply_to_user_id: string
  floor_number: number
  content: string
}
