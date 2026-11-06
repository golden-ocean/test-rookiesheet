import { glob } from "astro/loaders"
import { defineCollection } from "astro:content"
import { docsSchema } from "./schema"

const docs = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/docs" }),
  schema: docsSchema,
})

export const collections = { docs }
