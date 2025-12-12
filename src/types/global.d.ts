// 导入默认语言的 JSON 结构作为类型源
import zh from "../i18n/messages/zh.json"

// 推断类型
type Messages = typeof zh

declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface IntlMessages extends Messages {}
}
