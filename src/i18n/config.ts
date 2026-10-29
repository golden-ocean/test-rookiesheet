export const localesConfig = {
  "zh-cn": { label: "简体中文", htmlLang: "zh-CN", dir: "ltr" },
  en: { label: "English", htmlLang: "en", dir: "ltr" },
} as const

export type LocaleType = keyof typeof localesConfig
export type LocaleConfigType = (typeof localesConfig)[LocaleType]

export const locales = Object.keys(localesConfig) as LocaleType[]

export const defaultLocale: LocaleType = "zh-cn"
export const prefixDefaultLocale = true
