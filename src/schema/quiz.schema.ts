import { z } from "astro/zod"

/**
 * Quiz 题目类型
 */
export const quizQuestionTypeSchema = z.enum([
  "single_choice",
  "multiple_choice",
  "true_false",
])

/**
 * 题目选项
 */
export const quizOptionSchema = z.object({
  id: z.string().trim().min(1),
  text: z.string().trim().min(1),
})

/**
 * 正确答案
 *
 * 统一使用 string[]：
 *
 * 单选：
 * ["a"]
 *
 * 多选：
 * ["a", "c"]
 *
 * 判断：
 * ["true"]
 */
export const quizAnswerSchema = z.object({
  value: z.array(z.string().trim().min(1)).min(1),
})

/**
 * 单道题目
 */
export const quizQuestionSchema = z.object({
  id: z.string().trim().min(1),
  type: quizQuestionTypeSchema,
  // 题干
  stem: z.string().trim().min(1),
  // 选项
  options: z.array(quizOptionSchema).min(2),
  // 正确答案
  answer: quizAnswerSchema,
  // 答案解析
  explanation: z.string().trim().optional(),
  // 分值
  score: z.number().int().positive().default(1),
})

/**
 * 整套测试
 */
export const quizSchema = z.object({
  version: z.number().int().positive().default(1),
  title: z.string().trim().min(1),
  description: z.string().trim().optional(),
  questions: z.array(quizQuestionSchema).min(1),
})

export type QuizQuestionType = z.infer<typeof quizQuestionTypeSchema>
export type QuizOption = z.infer<typeof quizOptionSchema>
export type QuizAnswer = z.infer<typeof quizAnswerSchema>
export type QuizQuestion = z.infer<typeof quizQuestionSchema>
export type Quiz = z.infer<typeof quizSchema>
