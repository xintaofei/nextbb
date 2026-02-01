export type ExpressionGroup = {
  id: string
  code: string
  name: string
  icon: string | null
  sort: number
  isEnabled: boolean
  isDeleted: boolean
  sourceLocale: string
  expressionCount: number
  createdAt: string
  updatedAt: string
}

export type Expression = {
  id: string
  groupId: string
  groupName: string
  code: string
  name: string
  type: "IMAGE" | "TEXT"
  imagePath: string | null
  imageUrl: string | null
  textContent: string | null
  width: number | null
  height: number | null
  sort: number
  isEnabled: boolean
  isDeleted: boolean
  sourceLocale: string
  createdAt: string
  updatedAt: string
}

export type ExpressionGroupListResult = {
  items: ExpressionGroup[]
  page: number
  pageSize: number
  total: number
}

export type ExpressionListResult = {
  items: Expression[]
  page: number
  pageSize: number
  total: number
}

export type Translation = {
  locale: string
  name: string
  isSource: boolean
  isTranslated: boolean
}

export type TranslationResult = {
  sourceLocale: string
  translations: Translation[]
}

export type ExpressionGroupFormData = {
  code: string
  name: string
  icon: string | null
  sort: number
}

export type ExpressionFormData = {
  groupId: string
  code: string
  name: string
  type: "IMAGE" | "TEXT"
  imagePath: string | null
  textContent: string | null
  width: number | null
  height: number | null
  sort: number
}
