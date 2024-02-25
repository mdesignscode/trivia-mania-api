import { Hono } from 'hono'
import prisma from '@/lib/prisma'

const questions = new Hono()

questions.post('/stats', async (c) => {
  const body = await c.req.json(),
    userId = body.userId;

  const user = userId ? await prisma.user.findUnique({
    where: {
      id: userId
    }
  }) : undefined

  let difficultiesCount = 0
  const questionsByDifficulty = await prisma.question.groupBy({
    by: ["difficulty"],
    _count: true,
    where: {
      id: {
        notIn: user?.answeredQuestions
      }
    }
  }),
    difficultyStats = Object.fromEntries(questionsByDifficulty.map(q => {
      difficultiesCount += q._count
      return [q.difficulty, q._count]
    })),
    allCategories = await prisma.question.groupBy({
      by: ["category"],
      _count: true
    }),
    categoriesStats: Record<string, Record<string, number>> = Object.fromEntries(
      await Promise.all(allCategories.map(async ({ category }) => [
        category,
        Object.fromEntries(
          await Promise.all(["easy", "medium", "hard"]
            .map(async difficulty => {
              const categoryDifficultyCount = (await prisma.question.groupBy(
                {
                  by: ["category", "difficulty"],
                  where: { category, difficulty },
                  _count: true
                }
              ))[0]?._count || 0

              return [difficulty, categoryDifficultyCount]
            }))
        )
      ]))
    )

  allCategories.forEach(({ category, _count }) => {
    categoriesStats[category]["all difficulties"] = _count
  })

  difficultyStats["all difficulties"] = difficultiesCount

  return c.json({ difficulties: difficultyStats, categories: categoriesStats })
})

questions.post('/play', async (c) => {
  const body = await c.req.json(),
    difficultyCheck = body.difficulty,
    categories = body.categories,
    user: TUser = body.user

  if (!user) return new Response("User object missing", { status: 400 })

  if (!difficultyCheck) return new Response("No difficulty provided", { status: 400 })

  const difficulty = body.difficulty === "all difficulties" ? undefined : body.difficulty

  if (!categories || !categories.length || categories.includes("all difficulties")) return c.json(await prisma.question.findMany({
    where: {
      difficulty,
      id: {
        notIn: user.answeredQuestions
      }
    }
  }))

  const playQuestions = await prisma.question.findMany({
    where: {
      difficulty, category: {
        in: categories.split(",")
      },
      id: {
        notIn: user.answeredQuestions
      }
    }
  })

  // Fisher-Yates shuffle algorithm
  for (let i = playQuestions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [playQuestions[i], playQuestions[j]] = [playQuestions[j], playQuestions[i]];
  }

  return c.json(playQuestions)
})

export default questions
