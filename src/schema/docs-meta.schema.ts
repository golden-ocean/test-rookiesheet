import { z } from "astro/zod"

const baseFields = {
  /** 唯一标识，建议稳定，后端可当 id / slug 用 */
  id: z.string().min(1).optional(),
  /** 显示标题 */
  title: z.string().min(1),
  /** 简短描述，可用于 tooltip 或 SEO */
  description: z.string().optional(),
  /** 排序，越小越靠前 */
  order: z.number().int().default(100),
  /** lucide 图标名，如 "Rocket"、"BookOpen" */
  icon: z.string().optional(),
  /** 徽章文字，简单场景够用 */
  badge: z.string().optional(),
  /** 是否在侧边栏隐藏（仍可访问页面） */
  hidden: z.boolean().default(false),
  /** 标签，方便过滤/搜索 */
  tags: z.array(z.string()).default([]),
}

/** 文章（叶子节点） */
const articleSchema = z.object({
  ...baseFields,
  type: z.literal("article").default("article"),
  /** 链接 */
  href: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  /** 难度 1-4，可选 */
  difficulty: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
    .optional(),
  /** 外部链接 */
  external: z.boolean().default(false),
})

/** 小节（可折叠，只挂文章） */
const sectionSchema = z.object({
  ...baseFields,
  type: z.literal("section"),
  /** 可选：section 本身也可点击 */
  href: z.string().optional(),
  /** 默认是否展开 */
  expanded: z.boolean().default(true),
  items: z.array(articleSchema).min(1),
})

/** 分组（最顶层） */
const groupSchema = z.object({
  ...baseFields,
  type: z.literal("group"),
  href: z.string().optional(),
  expanded: z.boolean().default(true),
  /** 可挂 section 或直接挂 article */
  items: z.array(z.union([sectionSchema, articleSchema])).min(1),
})

/** 整个侧边栏 */
export const docsMetaSchema = groupSchema

export type DocsMeta = z.infer<typeof docsMetaSchema>
export type DocsArticle = z.infer<typeof articleSchema>
export type DocsSection = z.infer<typeof sectionSchema>
export type DocsGroup = z.infer<typeof groupSchema>
export type DocsMetaItem = DocsGroup | DocsSection | DocsArticle
