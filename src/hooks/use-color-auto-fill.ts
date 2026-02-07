import { useCallback } from "react"
import {
  convertLightBgToDark,
  convertLightTextToDark,
  convertDarkBgToLight,
  convertDarkTextToLight,
} from "@/lib/color-utils"

/**
 * 颜色字段类型
 * 包含浅色和深色模式的背景色和文字色
 */
type ColorFields = {
  bgColor: string | null
  textColor: string | null
  darkBgColor: string | null
  darkTextColor: string | null
}

/**
 * 颜色自动填充 Hook
 * 当用户设置一种模式的颜色时，自动填充另一种模式的对应颜色
 *
 * @param formData - 包含颜色字段的表单数据
 * @param setFormData - 更新表单数据的函数
 * @returns 四个增强的 onChange 处理器
 */
export function useColorAutoFill<T extends ColorFields>(
  formData: T,
  setFormData: (data: T) => void
) {
  // 浅色背景色变化处理
  const handleLightBgChange = useCallback(
    (color: string | null) => {
      const updates: Partial<T> = { bgColor: color } as Partial<T>
      // 如果深色背景色为空且新颜色不为空，自动填充深色背景色
      if (!formData.darkBgColor && color) {
        updates.darkBgColor = convertLightBgToDark(color) as T["darkBgColor"]
      }
      setFormData({ ...formData, ...updates })
    },
    [formData, setFormData]
  )

  // 浅色文字色变化处理
  const handleLightTextChange = useCallback(
    (color: string | null) => {
      const updates: Partial<T> = { textColor: color } as Partial<T>
      // 如果深色文字色为空且新颜色不为空，自动填充深色文字色
      if (!formData.darkTextColor && color) {
        updates.darkTextColor = convertLightTextToDark(
          color
        ) as T["darkTextColor"]
      }
      setFormData({ ...formData, ...updates })
    },
    [formData, setFormData]
  )

  // 深色背景色变化处理
  const handleDarkBgChange = useCallback(
    (color: string | null) => {
      const updates: Partial<T> = { darkBgColor: color } as Partial<T>
      // 如果浅色背景色为空且新颜色不为空，自动填充浅色背景色
      if (!formData.bgColor && color) {
        updates.bgColor = convertDarkBgToLight(color) as T["bgColor"]
      }
      setFormData({ ...formData, ...updates })
    },
    [formData, setFormData]
  )

  // 深色文字色变化处理
  const handleDarkTextChange = useCallback(
    (color: string | null) => {
      const updates: Partial<T> = { darkTextColor: color } as Partial<T>
      // 如果浅色文字色为空且新颜色不为空，自动填充浅色文字色
      if (!formData.textColor && color) {
        updates.textColor = convertDarkTextToLight(color) as T["textColor"]
      }
      setFormData({ ...formData, ...updates })
    },
    [formData, setFormData]
  )

  return {
    handleLightBgChange,
    handleLightTextChange,
    handleDarkBgChange,
    handleDarkTextChange,
  }
}
