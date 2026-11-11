import type { Quiz } from "@/schema"
import { getCollection } from "astro:content"

/**
 * 获取所有测试题，并建立 docId -> Quiz 映射。
 */
export const getQuizMap = async (): Promise<Map<string, Quiz>> => {
  const entries = await getCollection("quizzes")
  return new Map(
    entries.map((entry) => [entry.id.replace(/quiz$/, ""), entry.data])
  )
}

/**
 * 根据文档 ID 获取测试题。
 */
export const getQuiz = async (docId: string): Promise<Quiz | undefined> => {
  const quizMap = await getQuizMap()
  return quizMap.get(docId)
}
