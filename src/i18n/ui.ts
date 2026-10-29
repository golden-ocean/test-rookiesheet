import type { LocaleType } from "./config"
import { en } from "./translations/en"
import { zhCN } from "./translations/zh-cn"

export type UIKey = keyof typeof zhCN

export const ui = {
  "zh-cn": zhCN,
  en,
} satisfies Record<LocaleType, Record<UIKey, string>>
