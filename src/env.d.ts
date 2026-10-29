/// <reference types="astro/client" />

// 用 import() 类型而不是顶层 import，避免文件变成模块导致 App 命名空间失效
declare namespace App {
  interface Locals {
    locale: import("@/i18n/config").LocaleType
    t: ReturnType<typeof import("@/i18n/utils").getTranslations>
  }
}
