import type { NavigationItem } from "@/components/docs/types"
import type { CollectionEntry } from "astro:content"

export function buildSidebar(
  entries: CollectionEntry<"docs">[]
): NavigationItem[] {
  const nodeMap = new Map<string, NavigationItem>()
  const root: NavigationItem = { title: "root", items: [] }
  nodeMap.set("", root)

  // 1. 按路径深度排序，确保父级目录先于子文件创建
  const sortedEntries = [...entries].sort(
    (a, b) => a.id.split("/").length - b.id.split("/").length
  )

  for (const e of sortedEntries) {
    if (e.data?.sidebar?.hidden) continue

    // 去掉可能存在的文件后缀（如 .mdx / .md）
    const cleanId = e.id.replace(/\.(mdx|md)$/, "")
    const segments = cleanId.split("/")

    let parentPath = ""
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      const currPath = parentPath ? `${parentPath}/${seg}` : seg
      const isLeaf = i === segments.length - 1

      if (!nodeMap.has(currPath)) {
        // 如果节点不存在，如果是叶子节点直接用 Frontmatter 标题，否则用路径片段兜底
        const defaultTitle = isLeaf
          ? e.data?.sidebar?.title || e.data?.title || seg
          : formatTitle(seg)

        const node: NavigationItem = {
          title: defaultTitle,
          items: [],
        }
        nodeMap.set(currPath, node)
        nodeMap.get(parentPath)?.items?.push(node)
      }

      // 如果这是当前文件的最终路径，更新标题并赋予 href
      if (isLeaf) {
        const currNode = nodeMap.get(currPath)!
        if (e.data?.sidebar?.title) {
          currNode.title = e.data.sidebar.title
        } else if (e.data?.title) {
          currNode.title = e.data.title
        }
        currNode.href = `/${cleanId}`
      }

      parentPath = currPath
    }
  }

  return root.items ?? []
}

// 辅助函数：将中间虚拟目录的英文短横线转为可读标题
function formatTitle(str: string) {
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/-/g, " ")
}
