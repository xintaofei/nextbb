export enum UserStatus {
  INACTIVE = 0,
  ACTIVE = 1,
  BANNED = 2,
}

export const DEFAULT_PAGE_SIZE = 10
export const MAX_PAGE_SIZE = 100

// Default values for DB defaults if needed in app logic
export const DEFAULT_PARENT_ID = "0"
export const DEFAULT_REPLY_TO_USER_ID = "0"
