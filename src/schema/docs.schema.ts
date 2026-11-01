import { z } from "astro/zod"

export const docsSchema = z.object({
  // // 逻辑 文档ID：不同语言版本保持相同， 不同于id，id包括了{zh-cn,en,ja}
  // docId: z.string(),
  // 必需的基础信息
  title: z.string().min(1),
  description: z.string().default(""),
  // 学习难度和分类
  difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
  // 标签
  tags: z.array(z.string()).default([]),
  // SEO：仅在有明确需求时填写
  canonical: z.url().optional(),
  // 排序与日期
  order: z.number().int().default(100),
  draft: z.boolean().default(false),
  created: z.coerce.date().optional(),
  updated: z.coerce.date().optional(),

  // 汇总页封面
  cover: z.string().optional(),
})
export type DocsType = z.infer<typeof docsSchema>
// export type Difficulty = NonNullable<DocsType["difficulty"]>
