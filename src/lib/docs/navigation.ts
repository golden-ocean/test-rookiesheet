import type { LocaleType } from "@/i18n"
import type {
  DocsArticle,
  DocsGroup,
  DocsMeta,
  DocsSection,
} from "@/schema/docs-meta.schema"
import { getCollection } from "astro:content"

export const getDocsNavigation = async (
  locale: LocaleType,
  stack: string
): Promise<DocsMeta[]> => {
  const entries = await getCollection("docsMeta")

  const groups = entries
    .filter((e) => {
      // id 示例: "zh-CN/react/guide.nav" 或 "zh-CN/react/guide"
      const parts = e.id.split("/")
      const loc = parts[0]
      const stk = parts[1]
      return loc === locale && stk === stack
    })
    .map((e) => e.data)
    .sort((a, b) => (a.order ?? 100) - (b.order ?? 100))

  return groups.map((g) => resolveNode(g, locale, stack) as DocsGroup)
}

const resolveNode = (
  node: DocsGroup | DocsSection | DocsArticle,
  locale: LocaleType,
  stack: string
): DocsGroup | DocsSection | DocsArticle => {
  if (
    node.type === "article" ||
    (!("items" in node) && "href" in node === false)
  ) {
    const article = node as DocsArticle
    if (article.external && article.href) return article

    const slug = article.id // 或 article.slug
    if (!slug) return article

    return {
      ...article,
      href: `/${locale}/docs/${stack}/${slug}`,
    }
  }

  if ("items" in node && node.items) {
    return {
      ...node,
      items: node.items.map((child) => resolveNode(child, locale, stack)),
    } as typeof node
  }

  return node
}
