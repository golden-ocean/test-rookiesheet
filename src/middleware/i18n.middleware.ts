import { getLocaleFromUrl, getTranslations } from "@/i18n"
import type { APIContext, MiddlewareNext } from "astro"

export const i18nMiddleware = async (
  context: APIContext,
  next: MiddlewareNext
) => {
  const locale = getLocaleFromUrl(context.url)

  context.locals.locale = locale
  context.locals.t = getTranslations(locale)

  return next()
}
