import type { NavigationItem } from "./types"

const normalize = (path: string) => path.replace(/\/+$/, "") || "/"

export const isSamePath = (a: string, b: string) =>
  normalize(a) === normalize(b)

// 当前页是否在这个节点自己或它的后代里（决定默认展开）
export const hasActive = (node: NavigationItem, currentPath: string): boolean =>
  (!!node.href && isSamePath(node.href, currentPath)) ||
  (node.items?.some((child: NavigationItem) => hasActive(child, currentPath)) ??
    false)
