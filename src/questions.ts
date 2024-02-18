import { Hono } from 'hono'
import prisma from '@/lib/prisma'

const questions = new Hono()

questions.get('/stats', async (c) => {
  const questionsByDifficulty = await prisma.question.groupBy({
    by: ["difficulty"],
    _count: true
  }),
    difficultyStats = Object.fromEntries(questionsByDifficulty.map(q => ([q.difficulty, q._count]
    ))),
    questionsByCategories = await prisma.question.groupBy({
      by: ["category"],
      _count: true
    }),
    categoriesStats = Object.fromEntries(questionsByCategories.map(q => ([q.category, q._count]
    )))

  return c.json({ difficulties: difficultyStats, categories: categoriesStats })
})

export default questions
