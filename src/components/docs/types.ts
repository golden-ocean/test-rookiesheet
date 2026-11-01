export interface NavigationItem {
  /** 唯一标识（建议有，做 key / 后端 id） */
  id?: string
  /** 显示标题（必需） */
  title: string
  /** 链接。没有则表示纯分组，只负责展开子项 */
  href?: string
  /** 图标名，如 lucide 的 "BookOpen" */
  icon?: string
  /** 徽章 */
  badge?: string
  /** 默认是否展开（仅对有 items 的节点有意义） */
  expanded?: boolean
  /** 是否隐藏 */
  hidden?: boolean
  /** 排序 */
  order?: number
  /** 是否当前页（一般由路由计算后注入，不必写在 JSON 里） */
  isActive?: boolean
  /** 外部链接 */
  external?: boolean
  /** 可选语义，方便以后扩展，渲染时不是必须 */
  type?: "group" | "section" | "article"
  /** 子项（有则视为可折叠分组） */
  items?: NavigationItem[]
}

export type Difficulty = 1 | 2 | 3 | 4
