// lib/docs/navigation.ts
import type { LocaleType } from "@/i18n"
import type { DocsType } from "@/schema/docs.schema"
import { getCollection, type CollectionEntry } from "astro:content"

type DocsEntry = CollectionEntry<"docs">

export interface NavNode {
  title: string
  href?: string
  difficulty?: DocsType["difficulty"]
  items?: NavNode[]
}

type Ranked = NavNode & { order: number }

interface Draft {
  path: string[]
  /** 叶子文档，或目录下的 index 文档 */
  entry?: DocsEntry
  children: Map<string, Draft>
}

const DEFAULT_ORDER = 100

const humanize = (s: string) =>
  s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

const byOrder = (a: Ranked, b: Ranked) =>
  a.order - b.order || a.title.localeCompare(b.title)

/** index 有正文才算"有内容"；叶子文档始终视为有内容 */
const hasContent = (node: Draft): boolean => {
  const { entry } = node
  if (!entry) return false
  // 叶子（没有子目录）一律可点击
  if (node.children.size === 0) return true
  return Boolean(entry.body?.trim())
}

/** 按文件夹关系建树；index 归并到所在目录 */
const buildTree = (entries: DocsEntry[], prefix: string): Draft => {
  const root: Draft = { path: [], children: new Map() }

  for (const entry of entries) {
    const segs = entry.id.slice(prefix.length).split("/")
    if (segs.at(-1) === "index") segs.pop()

    let node = root
    for (const seg of segs) {
      let next = node.children.get(seg)
      if (!next) {
        next = { path: [...node.path, seg], children: new Map() }
        node.children.set(seg, next)
      }
      node = next
    }
    node.entry = entry
  }
  return root
}

const toNav = (node: Draft, base: string): Ranked | null => {
  const { entry } = node
  if (entry?.data.sidebar.hidden) return null

  const items = [...node.children.values()]
    .map((c) => toNav(c, base))
    .filter((n): n is Ranked => n !== null)
    .sort(byOrder)

  // 没有 index 且子项全被隐藏/为空的目录，直接丢掉
  if (!entry && items.length === 0) return null

  return {
    title:
      entry?.data.sidebar.title ??
      entry?.data.title ??
      humanize(node.path.at(-1)!),
    order: entry?.data.sidebar.order ?? items[0]?.order ?? DEFAULT_ORDER,
    href: hasContent(node) ? `${base}/${node.path.join("/")}` : undefined,
    difficulty: entry?.data.difficulty,
    items: items.length ? items : undefined,
  }
}

/** 顶层文件夹 = group，对应 DocSidebar 里的 SidebarGroup */
export const getDocsNavigation = async (
  locale: LocaleType,
  stack: string
): Promise<NavNode[]> => {
  // content id 会被 slugify 成小写，这里统一小写比较
  const prefix = `${locale}/${stack}/`.toLowerCase()
  const entries = await getCollection(
    "docs",
    ({ id, data }) =>
      id.toLowerCase().startsWith(prefix) &&
      !(import.meta.env.PROD && data.draft)
  )

  const root = buildTree(entries, prefix)
  const base = `/${locale}/docs/${stack}`

  return [...root.children.values()]
    .map((c) => toNav(c, base))
    .filter((n): n is Ranked => n !== null)
    .sort(byOrder)
}
