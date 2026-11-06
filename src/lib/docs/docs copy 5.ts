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
 * 判断 entry 是否来自 index.mdx。
 *
 * Astro 对 index.mdx 有特殊处理：
 *
 * cli/index.mdx
 * -> zh-cn/rust/cli
 *
 * 因此不能通过 entry.id 判断是否为 index.mdx。
 * 使用 filePath 获取原始文件名。
 */
const isIndexEntry = (entry: DocsEntry): boolean => {
  const fileName = entry.filePath?.split(/[\\/]/).at(-1)
  if (!fileName) {
    throw new Error(`无法获取文档源文件路径：${entry.id}`)
  }
  return /^index\.mdx?$/i.test(fileName)
}

/**
 * 判断文档是否存在正文。
 *
 * body 是 Markdown/MDX 正文，不包含 Frontmatter。
 */
const hasContent = (entry: DocsEntry): boolean => {
  return Boolean(entry.body?.trim())
}

/**
 * 创建默认目录节点。
 *
 * 即使目录没有 index.mdx，
 * 也可以根据子文档自动创建目录节点。
 */
const createDirectoryNode = (id: string): NavigationItem => {
  return {
    id,
    title: "",
    order: 100,
    items: [],
  }
}

/**
 * 创建文档 URL。
 */
const createHref = (locale: string, stack: string, id: string): string => {
  return `/${locale}/docs/${stack}/${id}`
}

/**
 * 构建统一的文档导航数据。
 *
 * Sidebar 是唯一的数据来源：
 *
 * 1. 根据 entry.id 建立树形结构。
 * 2. 按照 order 排序。
 * 3. 从树中提取阅读顺序，生成 Pager。
 * 4. 从树中提取祖先路径，生成 Breadcrumb。
 */
export const buildDocsNavigation = (
  entries: DocsEntry[],
  locale: string,
  stack: string
): DocsNavigation => {
  // 最终 Sidebar 根节点。
  const root: NavigationItem[] = []
  // 当前 locale 和 stack 对应的 ID 前缀。
  const prefix = `${locale}/${stack}/`
  // 记录普通文档的路径。
  // 仅用于内部路径冲突检查，不会暴露到 NavigationItem。
  const documentIds = new Set<string>()

  // 记录目录路径。
  // 仅用于内部路径冲突检查。
  const directoryIds = new Set<string>()

  // --------------------------------------------------
  // 1. 收集文档路径关系
  // --------------------------------------------------
  for (const entry of entries) {
    if (!entry.id.startsWith(prefix)) {
      continue
    }
    const relativeId = entry.id.slice(prefix.length)
    if (!relativeId) {
      continue
    }
    const segments = relativeId.split("/")
    const isIndex = isIndexEntry(entry)

    // index.mdx 对应目录节点。
    if (isIndex) {
      directoryIds.add(relativeId)
    } else {
      // 普通文档对应文档节点。
      documentIds.add(relativeId)
    }

    // 当前 entry 的所有父级路径都是目录。
    //
    // cli/install/ss
    // -> cli
    // -> cli/install
    //
    // cli/index.mdx
    // -> cli
    for (let i = 1; i < segments.length; i++) {
      directoryIds.add(segments.slice(0, i).join("/"))
    }
  }

  // 检查普通文档与目录是否存在路径冲突。
  //
  // 例如：
  // cli.mdx
  // cli/index.mdx
  //
  // 两者会映射到同一个 entry.id。
  for (const id of documentIds) {
    if (directoryIds.has(id)) {
      throw new Error(`文档路径冲突：${id} 同时对应普通文档和目录`)
    }
  }

  // --------------------------------------------------
  // 2. 建立 Sidebar 树
  // --------------------------------------------------
  for (const entry of entries) {
    // 只处理当前 locale 和 stack。
    if (!entry.id.startsWith(prefix)) {
      continue
    }

    // 去掉 locale 和 stack 前缀。
    //
    // zh-cn/rust/cli/install/ss
    // -> cli/install/ss
    const relativeId = entry.id.slice(prefix.length)

    if (!relativeId) {
      continue
    }

    const isIndex = isIndexEntry(entry)

    // 普通文档 hidden：不创建节点。
    //
    // index hidden：保留目录节点，
    // 只隐藏目录首页的链接。
    if (!isIndex && entry.data.sidebar.hidden) {
      continue
    }

    const segments = relativeId.split("/")

    // 当前正在处理的节点层级。
    let current = root

    // 当前节点的完整相对路径。
    let currentPath = ""

    // 逐层建立目录树。
    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i]

      // 拼接当前路径。
      currentPath = currentPath ? `${currentPath}/${segment}` : segment

      // 是否为当前 entry 的最后一层。
      const isLastSegment = i === segments.length - 1

      // 在当前层级查找已有节点。
      let node = current.find((item) => item.id === currentPath)

      // 节点不存在时创建默认目录节点。
      if (!node) {
        node = createDirectoryNode(currentPath, segment)
        current.push(node)
      }

      // 不是最后一层，说明当前节点是父目录。
      if (!isLastSegment) {
        // 如果父节点已经有 href，
        // 说明它已经被当作普通文档处理。
        if (node.href) {
          throw new Error(`文档路径冲突：${node.id} 是文档，不能包含子文档`)
        }

        // 切换到当前目录的子节点。
        current = node.items

        continue
      }

      // ----------------------------------------------
      // 当前 entry 是 index.mdx。
      // ----------------------------------------------

      if (isIndex) {
        // 目录首页标题优先使用 sidebar.title。
        // 没有设置时使用 Frontmatter 的 title。
        node.title = entry.data.sidebar.title ?? entry.data.title

        // 使用 index.mdx 的排序权重。
        node.order = entry.data.sidebar.order

        // 设置可选徽标。
        node.badge = entry.data.sidebar.badge

        // 有正文且没有 hidden 才生成目录首页链接。
        if (!entry.data.sidebar.hidden && hasContent(entry)) {
          node.href = createHref(locale, stack, relativeId)
        } else {
          delete node.href
        }
      } else {
        // --------------------------------------------
        // 当前 entry 是普通文档。
        // --------------------------------------------

        // 普通文档不能拥有子节点。
        if (node.items.length > 0) {
          throw new Error(`文档路径冲突：${entry.id} 同时对应普通文档和目录`)
        }

        // 普通文档标题优先使用 sidebar.title。
        node.title = entry.data.sidebar.title ?? entry.data.title

        // 使用普通文档自己的排序权重。
        node.order = entry.data.sidebar.order

        // 设置可选徽标。
        node.badge = entry.data.sidebar.badge

        // 有正文才生成链接。
        if (hasContent(entry)) {
          node.href = createHref(locale, stack, relativeId)
        }
      }

      // 切换到当前节点的子节点。
      current = node.items
    }
  }

  // --------------------------------------------------
  // 3. 清理无效节点
  // --------------------------------------------------

  /**
   * 删除没有链接、没有子节点的节点。
   *
   * 例如：
   * 普通文档没有正文，且没有子节点。
   *
   * 这种节点没有实际导航意义，不应该显示在 Sidebar。
   *
   * 目录即使没有 href，只要有子节点就会保留。
   */
  function removeEmptyNodes(nodes: NavigationItem[]): void {
    for (const node of nodes) {
      removeEmptyNodes(node.items)
    }

    for (let i = nodes.length - 1; i >= 0; i--) {
      const node = nodes[i]

      if (!node.href && node.items.length === 0) {
        nodes.splice(i, 1)
      }
    }
  }

  removeEmptyNodes(root)

  // --------------------------------------------------
  // 4. 排序
  // --------------------------------------------------

  /**
   * 对每一层节点按照 order 排序。
   *
   * order 相同时，按照标题排序。
   */
  function sortNodes(nodes: NavigationItem[]): void {
    nodes.sort((a, b) => {
      return a.order - b.order || a.title.localeCompare(b.title)
    })

    // 递归排序子节点。
    for (const node of nodes) {
      sortNodes(node.items)
    }
  }

  sortNodes(root)

  // --------------------------------------------------
  // 5. 从 Sidebar 提取 Pager 和 Breadcrumb
  // --------------------------------------------------

  // 按 Sidebar 的实际顺序排列的可访问页面。
  const pages: PagerItem[] = []

  // 每篇文档的 Breadcrumb。
  const breadcrumbs: Record<string, BreadcrumbItem[]> = {}

  /**
   * 深度优先遍历 Sidebar。
   *
   * 阅读顺序：
   *
   * CLI
   * ├── 安装环境
   * │   ├── 配置环境变量
   * │   └── 配置工具链
   * └── 命令行参数
   *
   * Pager 顺序：
   * CLI -> 安装环境 -> 配置环境变量
   *     -> 配置工具链 -> 命令行参数
   */
  function traverse(
    nodes: NavigationItem[],
    ancestors: BreadcrumbItem[]
  ): void {
    for (const node of nodes) {
      // 当前节点的 Breadcrumb。
      //
      // 当前页面本身不需要链接。
      breadcrumbs[node.id] = [
        ...ancestors,
        {
          title: node.title,
        },
      ]

      // 有 href 的节点才参与 Pager。
      if (node.href) {
        pages.push({
          title: node.title,
          href: node.href,
        })
      }

      // 当前节点成为下一层节点的祖先。
      //
      // href 不存在时，Breadcrumb 仍然保留标题，
      // 但该项不可点击。
      const nextAncestors = [
        ...ancestors,
        {
          title: node.title,
          href: node.href,
        },
      ]

      // 继续遍历子节点。
      traverse(node.items, nextAncestors)
    }
  }

  traverse(root, [])

  // --------------------------------------------------
  // 6. 生成 Pager
  // --------------------------------------------------

  const pager: Record<string, Pager> = {}

  for (let i = 0; i < pages.length; i++) {
    const current = pages[i]

    pager[current.href] = {
      prev: pages[i - 1],
      next: pages[i + 1],
    }
  }

  // --------------------------------------------------
  // 7. 返回统一导航数据
  // --------------------------------------------------

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
    // 当前 stack 下的文档。
    const isCurrentStack = id === `${locale}/${stack}` || id.startsWith(prefix)

    // 开发环境显示草稿。
    // 生产环境排除草稿。
    const isPublished = !import.meta.env.PROD || !data.draft

    return isCurrentStack && isPublished
  })

  return buildDocsNavigation(entries, locale, stack)
}
