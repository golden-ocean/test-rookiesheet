import { defaultLocale, localesConfig, type LocaleType } from "./config"
import { ui, type UIKey } from "./ui"

export const isLocale = (value: unknown): value is LocaleType =>
  typeof value === "string" && Object.hasOwn(localesConfig, value)

export const getLocaleFromUrl = (url: URL): LocaleType => {
  const [, locale] = url.pathname.split("/")

  if (locale && locale in ui) {
    return locale as LocaleType
  }

  return defaultLocale
}

export const getTranslations = (locale: LocaleType) => {
  return (key: UIKey): string => {
    return ui[locale][key] ?? ui[defaultLocale][key]
  }
}
