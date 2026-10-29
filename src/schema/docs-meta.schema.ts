import { z } from "astro/zod"

const MAX_DEPTH = 3

const baseDocsMetaFields = {
  title: z.string().min(1),
  description: z.string().optional(),
  type: z.enum(["group", "section", "article"]).optional(),
  order: z.number().int().default(100),
  icon: z.string().optional(),
  tags: z.array(z.string()).default([]),
  expanded: z.boolean().default(true),
  href: z.string().optional(),
  difficulty: z
    .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
    .optional(),
}
const docsMetaSchemaAt = (depth: number): z.ZodType => {
  if (depth <= 0) {
    // 到达最大深度：不再允许 items
    return z.object(baseDocsMetaFields)
  }
  return z.object({
    ...baseDocsMetaFields,
    items: z.array(docsMetaSchemaAt(depth - 1)).optional(),
  })
}

export const docsMetaSchema = () => docsMetaSchemaAt(MAX_DEPTH)
// export const docsMetaSchema = () =>
//   z.object({
//     title: z.string().min(1),
//     description: z.string().optional(),
//     type: z.enum(["group", "section", "article"]).optional(),
//     order: z.number().int().default(100),
//     icon: z.string().optional(),
//     tags: z.array(z.string()).default([]),
//     expanded: z.boolean().default(true),
//     href: z.string().optional(),
//     difficulty: z
//       .union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)])
//       .optional(),
//     get items() {
//       return z.array(docsMetaSchema()).optional()
//     },
//   })
export type DocsMetaType = z.infer<typeof docsMetaSchema>
