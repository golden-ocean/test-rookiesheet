import { z } from "astro/zod"

export const sidebarSchema = z.object({
  // Sidebar 显示名称，不设置时使用文档 title
  title: z.string().min(1).optional(),
  // Sidebar 排序
  order: z.number().int().default(100),
  // 一般填写作为外链
  href: z.string().optional(),
  // 是否在 Sidebar 中隐藏
  hidden: z.boolean().default(false),
  expanded: z.boolean().default(true),
  badge: z.string().optional(),
})

export const docsSchema = z.object({
  // 文档基本信息
  title: z.string().min(1),
  description: z.string().default(""),
  // 内容分类
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  tags: z.array(z.string()).default([]),
  // SEO
  canonical: z.url().optional(),
  // 文档管理
  order: z.number().int().default(100),
  draft: z.boolean().default(false),
  // 文档日期
  created: z.coerce.date().optional(),
  updated: z.coerce.date().optional(),
  // 汇总页封面
  cover: z.string().optional(),
  // Sidebar 配置
  sidebar: sidebarSchema.default({ order: 100, hidden: false, expanded: true }),
})

export type DocsType = z.infer<typeof docsSchema>
export type SidebarType = z.infer<typeof sidebarSchema>
export type Difficulty = NonNullable<DocsType["difficulty"]>
