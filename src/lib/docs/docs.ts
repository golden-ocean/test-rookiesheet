import type {
  BreadcrumbItem,
  NavigationItem,
  Pager,
  PagerItem,
} from "@/components/docs/types"

import { getCollection, type CollectionEntry } from "astro:content"

/**
 * 统一的文档导航数据。
 */
export interface DocsNavigation {
  /** 当前语言 */
  locale: string
  /** 当前技术栈 */
  stack: string
  /** 完整侧边栏 */
  sidebar: NavigationItem[]
  /** 前后翻页，以页面 href 为 key */
  pager: Record<string, Pager>
  /** 面包屑，以文档相对路径为 key */
  breadcrumbs: Record<string, BreadcrumbItem[]>
}

type DocsEntry = CollectionEntry<"docs">

/**
 * 内部构建节点。
 *
 * pagerHref 只用于区分真正参与 Pager 的文档链接。
 * 最终不会暴露给 NavigationItem。
 */
interface TreeNode extends NavigationItem {
  pagerHref?: string
  id: string
  order: number
  items: TreeNode[]
}

/**
 * 预处理后的文档。
 */
interface ScopedEntry {
  entry: DocsEntry
  relativeId: string
  isIndex: boolean
}

/**
 * 判断是否为 index.md / index.mdx。
 *
 * Astro Content Collection 的 entry.id 不包含 index 文件名，
 * 因此通过 filePath 判断。
 */
function isIndexEntry(entry: DocsEntry): boolean {
  const fileName = entry.filePath?.split(/[\\/]/).at(-1)

  if (!fileName) {
    throw new Error(`无法获取文档源文件路径：${entry.id}`)
  }

  return /^index\.mdx?$/i.test(fileName)
}

/**
 * 判断文档是否存在正文。
 *
 * entry.body 不包含 Frontmatter。
 */
function hasContent(entry: DocsEntry): boolean {
  return Boolean(entry.body?.trim())
}

/**
 * 生成系统默认文档链接。
 */
function createHref(locale: string, stack: string, relativeId: string): string {
  return `/${locale}/docs/${stack}/${relativeId}`
}

/**
 * 构建文档导航。
 *
 * 主要职责：
 * 1. 过滤当前 locale 和 stack 的文档。
 * 2. 检查文档路径冲突。
 * 3. 检查目录 index 文件。
 * 4. 建立 Sidebar 树。
 * 5. 处理自动链接和自定义链接。
 * 6. 清理无效节点。
 * 7. 排序。
 * 8. 生成 Pager 和 Breadcrumb。
 */
export function buildDocsNavigation(
  entries: DocsEntry[],
  locale: string,
  stack: string
): DocsNavigation {
  const prefix = `${locale}/${stack}/`

  // ==================================================
  // 1. 预处理文档
  // ==================================================

  const scoped: ScopedEntry[] = entries.flatMap((entry) => {
    if (!entry.id.startsWith(prefix)) {
      return []
    }

    const relativeId = entry.id.slice(prefix.length)

    if (!relativeId) {
      return []
    }

    return [
      {
        entry,
        relativeId,
        isIndex: isIndexEntry(entry),
      },
    ]
  })

  // ==================================================
  // 2. 路径校验
  // ==================================================

  // 普通文档路径。
  const documentIds = new Set<string>()

  // 所有目录路径。
  const directoryIds = new Set<string>()

  // 拥有 index 文件的目录。
  const indexIds = new Set<string>()

  for (const { relativeId, isIndex } of scoped) {
    if (isIndex) {
      indexIds.add(relativeId)
      directoryIds.add(relativeId)
    } else {
      documentIds.add(relativeId)
    }

    // 收集所有祖先目录。
    //
    // cli/install/ss
    // -> cli
    // -> cli/install
    const segments = relativeId.split("/")

    for (let i = 1; i < segments.length; i++) {
      directoryIds.add(segments.slice(0, i).join("/"))
    }
  }

  // 检查普通文档与目录路径冲突。
  //
  // 例如：
  // cli.mdx
  // cli/install.mdx
  //
  // 两者不能同时存在。
  const conflicts = [...documentIds].filter((id) => directoryIds.has(id))

  if (conflicts.length > 0) {
    throw new Error(
      `文档路径冲突（同时对应普通文档和目录）：\n${conflicts
        .sort()
        .map((id) => `  - ${prefix}${id}`)
        .join("\n")}`
    )
  }

  // 检查所有目录是否拥有 index 文件。
  const missingIndexes = [...directoryIds].filter((id) => !indexIds.has(id))

  if (missingIndexes.length > 0) {
    throw new Error(
      `以下目录缺少 index.md(x) 文件：\n${missingIndexes
        .sort()
        .map((id) => `  - ${prefix}${id}/index.mdx`)
        .join("\n")}`
    )
  }

  // ==================================================
  // 3. 建立 Sidebar 树
  // ==================================================

  const root: TreeNode[] = []

  // 通过路径直接查找节点，避免逐层 find。
  const nodeMap = new Map<string, TreeNode>()

  /**
   * 获取或创建节点。
   *
   * 子文档可能先于 index 文件被处理，
   * 因此允许先创建没有标题的占位目录。
   */
  function getOrCreateNode(path: string): TreeNode {
    const existing = nodeMap.get(path)

    if (existing) {
      return existing
    }

    const node: TreeNode = {
      id: path,
      title: "",
      order: 100,
      items: [],
    }

    nodeMap.set(path, node)

    const slashIndex = path.lastIndexOf("/")

    const siblings =
      slashIndex === -1
        ? root
        : getOrCreateNode(path.slice(0, slashIndex)).items

    siblings.push(node)

    return node
  }

  for (const { entry, relativeId, isIndex } of scoped) {
    const sidebar = entry.data.sidebar

    // 普通文档 hidden：完全跳过。
    // index hidden：保留目录结构。
    if (!isIndex && sidebar.hidden) {
      continue
    }

    const node = getOrCreateNode(relativeId)

    // 设置导航标题。
    node.title = sidebar.title ?? entry.data.title

    // 设置排序权重。
    node.order = sidebar.order

    // 设置徽标。
    node.badge = sidebar.badge

    // ----------------------------------------------
    // 处理链接
    // ----------------------------------------------

    // hidden 优先级最高。
    if (sidebar.hidden) {
      delete node.href
      delete node.pagerHref
      continue
    }

    // 自定义链接优先。
    // 自定义链接不参与 Pager。
    if (sidebar.href) {
      node.href = sidebar.href
      delete node.pagerHref
      continue
    }

    // 没有自定义链接时，有正文才生成默认链接。
    if (hasContent(entry)) {
      const href = createHref(locale, stack, relativeId)

      node.href = href
      node.pagerHref = href
    } else {
      delete node.href
      delete node.pagerHref
    }
  }

  // ==================================================
  // 4. 清理无效节点
  // ==================================================

  /**
   * 删除没有链接且没有子节点的节点。
   *
   * 例如：
   * 1. 没有正文的普通文档。
   * 2. 没有正文且所有子文档都 hidden 的目录。
   */
  function pruneEmptyNodes(nodes: TreeNode[]): void {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]

      // 先处理子节点。
      pruneEmptyNodes(node.items)

      // 再检查当前节点。
      if (!node.href && node.items.length === 0) {
        nodes.splice(i, 1)
      }
    }
  }

  pruneEmptyNodes(root)

  // ==================================================
  // 5. 排序
  // ==================================================

  /**
   * 每一层按以下规则排序：
   *
   * 1. order 升序。
   * 2. title 按当前语言排序。
   * 3. id 保证排序稳定。
   */
  function sortNodes(nodes: TreeNode[]): void {
    nodes.sort(
      (a, b) =>
        a.order - b.order ||
        a.title.localeCompare(b.title, locale) ||
        a.id.localeCompare(b.id)
    )

    for (const node of nodes) {
      sortNodes(node.items)
    }
  }

  sortNodes(root)

  // ==================================================
  // 6. 生成 Pager 和 Breadcrumb
  // ==================================================

  const pages: PagerItem[] = []

  const breadcrumbs: Record<string, BreadcrumbItem[]> = {}

  /**
   * 深度优先遍历 Sidebar。
   *
   * Pager 的阅读顺序与 Sidebar 顺序保持一致。
   */
  function traverse(nodes: TreeNode[], ancestors: BreadcrumbItem[]): void {
    for (const node of nodes) {
      // 当前文档的 Breadcrumb。
      // 当前项不需要链接。
      breadcrumbs[node.id] = [...ancestors, { title: node.title }]

      // 只有自动生成的文档链接参与 Pager。
      if (node.pagerHref) {
        pages.push({
          title: node.title,
          href: node.pagerHref,
        })
      }

      // 作为子节点的祖先时保留实际 href。
      // 自定义链接也可以点击。
      traverse(node.items, [
        ...ancestors,
        {
          title: node.title,
          href: node.href,
        },
      ])
    }
  }

  traverse(root, [])

  // ==================================================
  // 7. 生成 Pager
  // ==================================================

  const pager: Record<string, Pager> = {}

  pages.forEach((page, index) => {
    pager[page.href] = {
      prev: pages[index - 1],
      next: pages[index + 1],
    }
  })

  // ==================================================
  // 8. 返回结果
  // ==================================================

  return {
    locale,
    stack,
    sidebar: root,
    pager,
    breadcrumbs,
  }
}

/**
 * 获取指定语言和技术栈的导航数据。
 *
 * 负责：
 * 1. 查询 Astro Content Collection。
 * 2. 过滤 locale 和 stack。
 * 3. 生产环境过滤 draft。
 * 4. 调用统一导航生成器。
 */
export async function getDocsNavigation(
  locale: string,
  stack: string
): Promise<DocsNavigation> {
  const prefix = `${locale}/${stack}/`

  const entries = await getCollection("docs", ({ id, data }) => {
    const isCurrentStack = id.startsWith(prefix)

    const isPublished = !import.meta.env.PROD || !data.draft

    return isCurrentStack && isPublished
  })

  return buildDocsNavigation(entries, locale, stack)
}
