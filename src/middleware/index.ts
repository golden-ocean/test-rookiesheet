import { sequence } from "astro:middleware"
import { i18nMiddleware } from "./i18n.middleware"

export const onRequest = sequence(i18nMiddleware)
