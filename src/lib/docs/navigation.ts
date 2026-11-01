import type { LocaleType } from "@/i18n"
import type {
  DocsArticle,
  DocsGroup,
  DocsSection,
} from "@/schema/docs-meta.schema"
import { getCollection, type CollectionEntry } from "astro:content"

interface Context {
  base: string // /zh-CN/docs/react
  prefix: string // zh-CN/react/
  docIds: ReadonlySet<string>
  source: string // 文件路径
}

const resolveHref = (slug: string, ctx: Context, asDir = false): string => {
  const rel = slug.replace(/^\/+|\/+$/g, "")
  const ids = (asDir ? [`${rel}/index`, rel] : [rel]).map((p) => ctx.prefix + p)
  const id = ids.find((i) => ctx.docIds.has(i))

  if (!id) {
    throw new Error(
      `[Docs Navigation] ${ctx.source}: not found, tried ${ids.join(" or ")}`
    )
  }

  // index 对应目录路由，不暴露 /index
  const path = id.slice(ctx.prefix.length).replace(/(^|\/)index$/, "")
  return path ? `${ctx.base}/${path}` : ctx.base
}

/** 先全部解析（保证隐藏项的死链也能报出来），再过滤隐藏并排序 */
const visibleSorted = <T extends { order: number; hidden: boolean }>(
  items: T[]
): T[] => items.filter((i) => !i.hidden).sort((a, b) => a.order - b.order)

const resolveArticle = (a: DocsArticle, ctx: Context): DocsArticle =>
  a.slug ? { ...a, href: resolveHref(a.slug, ctx) } : a

const resolveSection = (s: DocsSection, ctx: Context): DocsSection => ({
  ...s,
  ...(s.slug && { href: resolveHref(s.slug, ctx, true) }),
  items: visibleSorted(s.items.map((a) => resolveArticle(a, ctx))),
})

const resolveGroup = (g: DocsGroup, ctx: Context): DocsGroup => ({
  ...g,
  items: visibleSorted(
    g.items.map((i) =>
      i.type === "section" ? resolveSection(i, ctx) : resolveArticle(i, ctx)
    )
  ),
})

export const buildDocsNavigation = (
  locale: LocaleType,
  stack: string,
  docs: CollectionEntry<"docs">[],
  metaEntries: CollectionEntry<"docsMeta">[]
): DocsGroup[] => {
  const prefix = `${locale}/${stack}/`
  const base = `/${locale}/docs/${stack}`
  const inScope = ({ id }: { id: string }) => id.startsWith(prefix)
  const docIds = new Set(docs.filter(inScope).map((d) => d.id))

  return visibleSorted(
    metaEntries.filter(inScope).map((e) =>
      resolveGroup(e.data, {
        base,
        prefix,
        docIds,
        source: e.filePath ?? e.id, // filePath 为空时退回 id
      })
    )
  )
}

export const getDocsNavigation = async (locale: LocaleType, stack: string) => {
  const [docs, metaEntries] = await Promise.all([
    // 与 getStaticPaths 保持一致：生产环境不生成草稿页，导航也不应指向它们
    getCollection("docs", ({ data }) => !(import.meta.env.PROD && data.draft)),
    getCollection("docsMeta"),
  ])
  return buildDocsNavigation(locale, stack, docs, metaEntries)
}
