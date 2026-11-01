import type { NavigationItem } from "./types"

const normalize = (path: string) => path.replace(/\/+$/, "") || "/"

export const isSamePath = (a: string, b: string) =>
  normalize(a) === normalize(b)

// 当前页是否在这个节点自己或它的后代里（决定默认展开）
export const hasActive = (node: NavigationItem, currentPath: string): boolean =>
  (!!node.href && isSamePath(node.href, currentPath)) ||
  (node.items?.some((child: NavigationItem) => hasActive(child, currentPath)) ??
    false)

/**
 * 深度优先查找 href === targetPath 的节点，
 * 返回从根到该节点的完整链（含 group/section/article）
 */
export const findPath = (
  nodes: NavigationItem[],
  targetPath: string,
  trail: NavigationItem[] = []
): NavigationItem[] | null => {
  for (const node of nodes) {
    const nextTrail = [...trail, node]

    // 命中：article 的 href 与当前路径完全相同
    if (
      node.type === "article" &&
      node.href &&
      normalize(node.href) === normalize(targetPath)
    ) {
      return nextTrail
    }

    // 递归子节点
    if (node.items?.length) {
      const found = findPath(node.items, targetPath, nextTrail)
      if (found) return found
    }
  }
  return null
}

/**
 * 转换为面包屑 items
 * 规则：
 *  - 最后一项（当前页）不带 href → BreadcrumbPage
 *  - group / section 有 href 才可点，否则只显示文本
 *  - 过滤 hidden
 */
export const buildBreadcrumbItems = (
  sidebar: NavigationItem[],
  currentPath: string
): NavigationItem[] => {
  const trail = findPath(sidebar, currentPath)
  if (!trail) return []
  const visible = trail.filter((n) => !n.hidden)
  const lastIndex = visible.length - 1

  return visible.map((node, i) => {
    if (i === lastIndex) {
      // 当前页
      return { title: node.title }
    }
    return {
      title: node.title,
      href: node.href, // 有则传，没有则为 undefined（不可点）
    }
  })
}
