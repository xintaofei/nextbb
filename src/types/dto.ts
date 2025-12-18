import { PaginatedRequest } from "@/types/common"
import {
  CategoryEntity,
  PostEntity,
  TopicEntity,
  UserEntity,
} from "@/types/entity"

// --- User DTOs ---

/**
 * Public user profile information
 */
export type UserProfile = Pick<
  UserEntity,
  "id" | "name" | "avatar" | "email" | "status" | "created_at"
>

/**
 * Request to update user profile
 */
export interface UpdateUserRequest {
  name?: string
  avatar?: string
  email?: string
}

// --- Categories DTOs ---
export type CategoryResponse = Pick<CategoryEntity, "id" | "name" | "icon">

// --- Topic DTOs ---

/**
 * Request to create a new topic
 * Note: Creating a topic usually involves creating the first post content as well.
 */
export interface CreateTopicRequest {
  title: string
  category_id: string
  content: string // The content of the first post
}

/**
 * Detailed topic information including relationships
 */
export interface TopicDetail extends TopicEntity {
  user: UserProfile
  category: CategoryEntity
  // potentially stats like reply_count, view_count if added later
}

/**
 * Request parameters for fetching topics
 */
export interface GetTopicsRequest extends PaginatedRequest {
  category_id?: string
  user_id?: string
}

// --- Post DTOs ---

/**
 * Request to create a new post (reply)
 */
export interface CreatePostRequest {
  topic_id: string
  content: string
  parent_id?: string // Default to '0' if omitted
  reply_to_user_id?: string // Default to '0' if omitted
}

/**
 * Post item with author information
 */
export interface PostItem extends PostEntity {
  user: UserProfile
  reply_to_user?: UserProfile // If reply_to_user_id is not 0
}

/**
 * Request parameters for fetching posts in a topic
 */
export interface GetPostsRequest extends PaginatedRequest {
  topic_id: string
}
