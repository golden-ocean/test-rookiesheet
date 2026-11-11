import { glob } from "astro/loaders"
import { defineCollection } from "astro:content"
import { docsSchema, quizSchema } from "./schema"

const docs = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/docs" }),
  schema: docsSchema,
})

const quizzes = defineCollection({
  loader: glob({ pattern: "**/*.quiz.json", base: "./src/content/docs" }),
  schema: quizSchema,
})

export const collections = { docs, quizzes }
