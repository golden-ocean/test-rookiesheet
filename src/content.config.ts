import { glob } from "astro/loaders"
import { defineCollection } from "astro:content"
import { docsMetaSchema, docsSchema } from "./schema"

const docs = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/docs" }),
  schema: docsSchema,
})

const docsMeta = defineCollection({
  loader: glob({
    pattern: "**/*.nav.json",
    base: "./src/content/docs",
  }),
  schema: docsMetaSchema,
})
export const collections = { docs, docsMeta }
