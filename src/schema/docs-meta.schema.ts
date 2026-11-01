import { z } from "astro/zod"

const baseFields = {
  /** 显示标题 */
  title: z.string().min(1),
  /** 简短描述，可用于 tooltip 或 SEO */
  description: z.string().optional(),
  /** 排序，越小越靠前；相同时保持书写顺序 */
  order: z.number().int().default(100),
  /** 是否在侧边栏隐藏（页面仍可访问，构建时依然校验） */
  hidden: z.boolean().default(false),
}

/** 文章（叶子节点） */
const articleSchema = z
  .object({
    ...baseFields,
    type: z.literal("article").default("article"),
    /** 文档路径，相对当前文档空间，如 "guide/intro" */
    slug: z.string().min(1).optional(),
    /** 仅用于外链；站内文档请写 slug，构建时会生成 href */
    href: z.string().min(1).optional(),
    /** lucide 图标名，如 "Rocket"、"BookOpen" */
    icon: z.string().optional(),
    /** 徽章文字 */
    badge: z.string().optional(),
    /** 难度 1-4，可选 */
    difficulty: z
      .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
      .optional(),
  })
  .refine((a) => Boolean(a.slug) !== Boolean(a.href), {
    message: "article 必须在 slug（站内）和 href（外链）中二选一",
  })

/** 小节（可折叠，只挂文章） */
const sectionSchema = z.object({
  ...baseFields,
  type: z.literal("section"),
  /** 可选：指向目录 index 的路径。不写则只是折叠标题 */
  slug: z.string().min(1).optional(),
  /** 由 slug 在构建时生成，无需手写 */
  href: z.string().optional(),
  /** 默认是否展开（与 DocNavItem 一致） */
  expanded: z.boolean().default(true),
  items: z.array(articleSchema).default([]),
})

/** 分组（最顶层） */
const groupSchema = z.object({
  ...baseFields,
  type: z.literal("group"),
  expanded: z.boolean().default(true),
  /** 可挂 section 或直接挂 article */
  items: z.array(z.union([sectionSchema, articleSchema])).min(1),
})

export const docsMetaSchema = groupSchema

export type DocsMeta = z.infer<typeof docsMetaSchema>
export type DocsArticle = z.infer<typeof articleSchema>
export type DocsSection = z.infer<typeof sectionSchema>
export type DocsGroup = z.infer<typeof groupSchema>
