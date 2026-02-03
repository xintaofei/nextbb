import type { ExpressionGroupSize } from "@/types/expression"

export type ExpressionGroupSizeOption = {
  value: ExpressionGroupSize
  labelKey: string
  px: number
}

export const EXPRESSION_GROUP_SIZE_OPTIONS: ExpressionGroupSizeOption[] = [
  { value: "SMALL", labelKey: "groupDialog.sizeOptions.small", px: 32 },
  { value: "MEDIUM", labelKey: "groupDialog.sizeOptions.medium", px: 64 },
  { value: "LARGE", labelKey: "groupDialog.sizeOptions.large", px: 96 },
]

export const getExpressionGroupSizePx = (size: ExpressionGroupSize): number => {
  const match = EXPRESSION_GROUP_SIZE_OPTIONS.find(
    (option) => option.value === size
  )
  return match?.px ?? 32
}
