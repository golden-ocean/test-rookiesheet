import type {
  BreadcrumbItem,
  NavigationItem,
  Pager,
  PagerItem,
} from "@/components/docs/types"

import { getCollection, type CollectionEntry } from "astro:content"

export interface DocsNavigation {
  locale: string
  stack: string
  // 完整文档树
  sidebar: NavigationItem[]
  // 每篇文档的前后翻页，以页面 href 为 key
  pager: Record<string, Pager>
  // 每篇文档的面包屑，以相对文档路径为 key
  breadcrumbs: Record<string, BreadcrumbItem[]>
}

type DocsEntry = CollectionEntry<"docs">

/**
 * 内部使用的树节点。
 *
 * 构建过程中 id、order、items 一定存在。
 */
interface TreeNode extends NavigationItem {
  id: string
  order: number
  items: TreeNode[]
}

/**
 * 判断 entry 是否来自 index.md / index.mdx。
 *
 * Astro 会去掉 index 的文件名：
 * cli/index.mdx -> zh-cn/rust/cli
 *
 * 所以不能用 entry.id 判断，必须用 filePath 取原始文件名。
 */
const isIndexEntry = (entry: DocsEntry): boolean => {
  const fileName = entry.filePath?.split(/[\\/]/).at(-1)

  if (!fileName) {
    throw new Error(`无法获取文档源文件路径：${entry.id}`)
  }

  return /^index\.mdx?$/i.test(fileName)
}

/**
 * 判断文档是否有正文（body 不含 Frontmatter）。
 */
const hasContent = (entry: DocsEntry): boolean => {
  return Boolean(entry.body?.trim())
}

/**
 * 创建自动生成的文档 URL。
 */
const createHref = (locale: string, stack: string, id: string): string => {
  return `/${locale}/docs/${stack}/${id}`
}

/**
 * 构建统一的文档导航数据。
 *
 * 规则：
 *
 * 1. 每个目录必须有 index.md(x)，否则构建时报错。
 *
 * 2. index 有正文且未 hidden：
 *    - 没有 sidebar.href：自动生成文档链接。
 *    - 有 sidebar.href：使用自定义链接。
 *
 * 3. 普通文档：
 *    - hidden：不进入 Sidebar。
 *    - 有 sidebar.href：使用自定义链接。
 *    - 没有 sidebar.href 且有正文：自动生成文档链接。
 *    - 没有正文且没有自定义链接：不显示。
 *
 * 4. 只有自动生成的文档链接参与 Pager。
 *
 * 5. Breadcrumb 根据 Sidebar 实际节点生成。
 */
export const buildDocsNavigation = (
  entries: DocsEntry[],
  locale: string,
  stack: string
): DocsNavigation => {
  const prefix = `${locale}/${stack}/`

  // --------------------------------------------------
  // 1. 预处理当前 locale 和 stack 的文档
  // --------------------------------------------------

  const scoped = entries.flatMap((entry) => {
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

  // --------------------------------------------------
  // 2. 校验路径关系
  // --------------------------------------------------

  // 普通文档路径。
  const documentIds = new Set<string>()

  // 所有目录路径。
  const directoryIds = new Set<string>()

  // 拥有 index 文件的目录路径。
  const indexIds = new Set<string>()

  for (const { relativeId, isIndex } of scoped) {
    if (isIndex) {
      indexIds.add(relativeId)
      directoryIds.add(relativeId)
    } else {
      documentIds.add(relativeId)
    }

    // 所有祖先路径都是目录。
    //
    // cli/install/ss -> cli、cli/install
    const segments = relativeId.split("/")

    for (let i = 1; i < segments.length; i++) {
      directoryIds.add(segments.slice(0, i).join("/"))
    }
  }

  // 检查普通文档与目录同名。
  const conflicts = [...documentIds].filter((id) => directoryIds.has(id))

  if (conflicts.length > 0) {
    throw new Error(
      `文档路径冲突（同时对应普通文档和目录）：\n${conflicts
        .sort()
        .map((id) => `  - ${prefix}${id}`)
        .join("\n")}`
    )
  }

  // 检查每个目录是否有 index 文件。
  const missingIndexes = [...directoryIds].filter((id) => !indexIds.has(id))

  if (missingIndexes.length > 0) {
    throw new Error(
      `以下目录缺少 index.md(x) 文件：\n${missingIndexes
        .sort()
        .map((id) => `  - ${prefix}${id}/index.mdx`)
        .join("\n")}`
    )
  }

  // --------------------------------------------------
  // 3. 建立 Sidebar 树
  // --------------------------------------------------

  const root: TreeNode[] = []

  // 路径 -> 节点，避免重复查找。
  const nodeMap = new Map<string, TreeNode>()

  // 记录自动生成文档链接的节点。
  // 自定义 sidebar.href 不参与 Pager。
  const pagerPageIds = new Set<string>()

  /**
   * 获取节点，不存在则创建并挂到父节点下。
   *
   * 子文档可能先于 index 被处理，
   * 因此父目录先创建占位节点。
   */
  const getOrCreateNode = (path: string): TreeNode => {
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
    // index hidden：保留目录节点，但不设置链接。
    if (!isIndex && sidebar.hidden) {
      continue
    }

    const node = getOrCreateNode(relativeId)

    // 标题优先使用 sidebar.title，否则使用文档 title。
    node.title = sidebar.title ?? entry.data.title

    // 排序权重和徽标。
    node.order = sidebar.order
    node.badge = sidebar.badge

    // ------------------------------------------------
    // 链接处理
    // ------------------------------------------------

    // hidden 优先级最高。
    if (sidebar.hidden) {
      delete node.href
      continue
    }

    // 自定义链接优先，不参与 Pager。
    if (sidebar.href) {
      node.href = sidebar.href
      continue
    }

    // 没有自定义链接时，有正文才自动生成链接。
    if (hasContent(entry)) {
      node.href = createHref(locale, stack, relativeId)

      // 只有自动生成的文档链接参与 Pager。
      pagerPageIds.add(relativeId)
    } else {
      delete node.href
    }
  }

  // --------------------------------------------------
  // 4. 清理无效节点
  // --------------------------------------------------

  /**
   * 删除既没有链接、也没有子节点的节点。
   *
   * 例如：
   * - 没有正文的普通文档。
   * - index 没有正文，且所有子文档都被 hidden 的目录。
   */
  function pruneEmptyNodes(nodes: TreeNode[]): void {
    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]

      pruneEmptyNodes(node.items)

      if (!node.href && node.items.length === 0) {
        nodes.splice(i, 1)
      }
    }
  }

  pruneEmptyNodes(root)

  // --------------------------------------------------
  // 5. 排序
  // --------------------------------------------------

  /**
   * 每一层按以下顺序排序：
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

  // --------------------------------------------------
  // 6. 从 Sidebar 提取 Pager 和 Breadcrumb
  // --------------------------------------------------

  const pages: PagerItem[] = []

  const breadcrumbs: Record<string, BreadcrumbItem[]> = {}

  /**
   * 深度优先遍历 Sidebar。
   *
   * Pager 顺序与 Sidebar 阅读顺序一致。
   */
  function traverse(nodes: TreeNode[], ancestors: BreadcrumbItem[]): void {
    for (const node of nodes) {
      // 当前文档的 Breadcrumb。
      breadcrumbs[node.id] = [...ancestors, { title: node.title }]

      // 只有自动生成链接的文档参与 Pager。
      if (node.href && pagerPageIds.has(node.id)) {
        pages.push({
          title: node.title,
          href: node.href,
        })
      }

      // 作为子节点的祖先时保留实际 href。
      // 纯目录没有 href，因此 Breadcrumb 不可点击。
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

  // --------------------------------------------------
  // 7. 生成 Pager
  // --------------------------------------------------

  const pager: Record<string, Pager> = {}

  pages.forEach((page, i) => {
    pager[page.href] = {
      prev: pages[i - 1],
      next: pages[i + 1],
    }
  })

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
 * 3. 生产环境排除 draft。
 * 4. 调用统一导航生成器。
 */
export async function getDocsNavigation(
  locale: string,
  stack: string
): Promise<DocsNavigation> {
  const prefix = `${locale}/${stack}/`

  const entries = await getCollection("docs", ({ id, data }) => {
    // 只查询当前 stack 下的文档。
    const isCurrentStack = id.startsWith(prefix)

    // 开发环境显示草稿，生产环境排除草稿。
    const isPublished = !import.meta.env.PROD || !data.draft

    return isCurrentStack && isPublished
  })

  return buildDocsNavigation(entries, locale, stack)
}
