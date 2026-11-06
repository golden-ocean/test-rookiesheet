import type { NavigationItem } from "@/components/docs/types"
import type { CollectionEntry } from "astro:content"

export function buildSidebar(
  entries: CollectionEntry<"docs">[]
): NavigationItem[] {
  const nodeMap = new Map<string, NavigationItem>()
  const root: NavigationItem = { title: "root", items: [] }
  nodeMap.set("", root)

  for (const e of entries) {
    const [locale, stack, ...slug] = e.id.split("/")
    let parentPath = ""
    for (let i = 0; i < slug.length; i++) {
      const seg = slug[i]
      const currPath = parentPath ? `${parentPath}/${seg}` : seg
      if (!nodeMap.has(currPath)) {
        const node: NavigationItem = { title: seg, items: [] }
        nodeMap.set(currPath, node)
        nodeMap.get(parentPath)?.items?.push(node)
      }
      const currNode = nodeMap.get(currPath)!
      if (i === slug.length - 1) {
        if (e.data?.sidebar?.title) currNode.title = e.data.sidebar.title
        currNode.href = `/${locale}/docs/${stack}/${slug.join("/")}`
      }
      parentPath = currPath
    }
  }

  return root.items ?? []
}
