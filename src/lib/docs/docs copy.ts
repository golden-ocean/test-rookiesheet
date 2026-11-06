import type { CollectionEntry } from "astro:content"

type DocsEntry = CollectionEntry<"docs">

interface SidebarNode {
  id: string
  title: string
  href?: string
  order: number
  items: SidebarNode[]
}

export const buildSidebar = (
  entries: DocsEntry[],
  locale: string,
  stack: string
): SidebarNode[] => {
  const root: SidebarNode[] = []

  for (const entry of entries) {
    const id = entry.id.replace(`${locale}/${stack}/`, "")
    const segments = id.split("/")

    let current = root
    let path = ""

    for (const segment of segments) {
      path = path ? `${path}/${segment}` : segment

      let node = current.find((item) => item.id === path)

      if (!node) {
        node = {
          id: path,
          title: segment,
          order: 100,
          items: [],
        }
        current.push(node)
      }

      current = node.items

      if (segment === segments.at(-1)) {
        node.title = entry.data.sidebar.title ?? entry.data.title
        node.order = entry.data.sidebar.order

        if (!entry.data.sidebar.hidden && entry.body.trim()) {
          node.href = `/${locale}/docs/${stack}/${path}`
        }
      }
    }
  }

  const sort = (nodes: SidebarNode[]) => {
    nodes.sort((a, b) => a.order - b.order)
    nodes.forEach((node) => sort(node.items))
  }

  sort(root)

  return root
}
