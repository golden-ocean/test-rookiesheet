import { z } from "astro/zod"

export const docsSchema = () =>
  z.object({
    // 必需的基础信息
    title: z.string().min(1),
    description: z.string().default(""),
    // 学习难度和分类
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    // 排序与可见性
    order: z.number().int().default(100),
    draft: z.boolean().default(false),
    // 日期
    created: z.coerce.date().optional(),
    updated: z.coerce.date().optional(),
    // 标签
    tags: z.array(z.string()).default([]),
    // SEO：仅在有明确需求时填写
    canonical: z.url().optional(),
  })
export type DocsType = z.infer<typeof docsSchema>
