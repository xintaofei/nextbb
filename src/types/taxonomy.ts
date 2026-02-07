export interface CategoryWithCount {
  id: string
  icon: string
  sort: number
  bgColor: string | null
  textColor: string | null
  darkBgColor: string | null
  darkTextColor: string | null
  name: string
  description: string | null
  topicCount: number
}

export interface TagWithCount {
  id: string
  icon: string
  sort: number
  bgColor: string | null
  textColor: string | null
  darkBgColor: string | null
  darkTextColor: string | null
  name: string
  description: string | null
  topicCount: number
}

export interface TaxonomyData {
  categories: CategoryWithCount[]
  tags: TagWithCount[]
}
